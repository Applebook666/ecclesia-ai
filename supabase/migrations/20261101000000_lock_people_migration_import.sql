-- Snapshot of the live function updated on 2026-10-31.
-- The migration job row is locked before checking status, serializing concurrent imports.
-- Function is SECURITY DEFINER: retain authorization and restricted search_path.
-- This migration is intended for environments that already have the controlled People migration schema.
CREATE OR REPLACE FUNCTION public.import_ready_people_migration(target_job_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_uid uuid:=auth.uid(); v_church uuid; v_status public.migration_status; v_open bigint; v_ready bigint; v_imported bigint:=0; r record; v_person uuid;
begin
 if v_uid is null then raise exception 'Authentication required'; end if;
 select church_id,status into v_church,v_status from public.migration_jobs where id=target_job_id for update;
 if v_church is null or not private.has_church_role(v_church,array['owner','pastor','administrator']::public.church_role[]) then raise exception 'Migration not found or access denied'; end if;
 if v_status<>'review' then raise exception 'Migration is not in review'; end if;
 select count(*) into v_open from public.migration_records where church_id=v_church and migration_job_id=target_job_id and status in ('needs_review','duplicate','pending');
 if v_open>0 then raise exception 'Unresolved migration exceptions remain'; end if;
 select count(*) into v_ready from public.migration_records where church_id=v_church and migration_job_id=target_job_id and status='ready';
 if v_ready=0 then raise exception 'No records are ready to import'; end if;
 if exists (select 1 from public.migration_records where church_id=v_church and migration_job_id=target_job_id and status='ready' and (nullif(btrim(coalesce(normalized_data->>'first_name','')),'') is null or nullif(btrim(coalesce(normalized_data->>'last_name','')),'') is null)) then raise exception 'Ready records must include first and last names'; end if;
 update public.migration_jobs set status='importing',updated_at=now() where id=target_job_id and church_id=v_church and status='review';
 for r in select id,normalized_data from public.migration_records where church_id=v_church and migration_job_id=target_job_id and status='ready' order by created_at,id for update loop
  if nullif(trim(coalesce(r.normalized_data->>'first_name','')),'') is null or nullif(trim(coalesce(r.normalized_data->>'last_name','')),'') is null then raise exception 'Ready record % is missing required name fields',r.id; end if;
  insert into public.people(church_id,first_name,last_name,email,phone,status)
  values(v_church,trim(r.normalized_data->>'first_name'),trim(r.normalized_data->>'last_name'),nullif(trim(coalesce(r.normalized_data->>'email','')),''),nullif(trim(coalesce(r.normalized_data->>'phone','')),''),'visitor')
  returning id into v_person;
  update public.migration_records set status='imported',imported_record_id=v_person,error_message=null where id=r.id and church_id=v_church;
  v_imported:=v_imported+1;
 end loop;
 insert into public.migration_reconciliations(church_id,migration_job_id,entity_type,source_count,imported_count,reconciled,notes)
 values(v_church,target_job_id,'people',v_ready,v_imported,v_ready=v_imported,'Controlled People migration import');
 insert into public.audit_logs(church_id,actor_user_id,action,entity_type,entity_id,metadata)
 values(v_church,v_uid,'migration.people_imported','migration_job',target_job_id::text,jsonb_build_object('imported_count',v_imported,'source_count',v_ready));
 update public.migration_jobs set status='completed',imported_records=v_imported,completed_at=now(),updated_at=now() where id=target_job_id and church_id=v_church;
 return jsonb_build_object('imported',v_imported,'reconciled',v_ready=v_imported);
end $function$
;
