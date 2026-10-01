-- ECCLESIA AI
-- Applied migration: ecclesia_pastoral_care_audit_trail
-- Sensitive Care mutations are audited without copying pastoral note/summary text.

create or replace function private.audit_sensitive_change()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_church_id uuid; v_entity_id text; v_action text; v_metadata jsonb;
begin
 v_church_id:=coalesce(new.church_id,old.church_id);
 v_entity_id:=coalesce(new.id,old.id)::text;
 v_action:=tg_table_name||'.'||lower(tg_op);
 if tg_table_name='care_cases' then
  if tg_op='INSERT' then
   v_metadata:=jsonb_build_object('status',new.status,'priority',new.priority,'assigned_to',new.assigned_to,'confidential',new.confidential);
  elsif tg_op='UPDATE' then
   v_metadata:=jsonb_build_object('status_from',old.status,'status_to',new.status,'priority_from',old.priority,'priority_to',new.priority,'assigned_from',old.assigned_to,'assigned_to',new.assigned_to,'follow_up_changed',old.next_follow_up_at is distinct from new.next_follow_up_at,'summary_changed',old.summary is distinct from new.summary);
  else v_metadata:='{}'::jsonb; end if;
 elsif tg_table_name='care_notes' then
  v_metadata:=jsonb_build_object('care_case_id',coalesce(new.care_case_id,old.care_case_id),'note_content_logged',false);
 else v_metadata:='{}'::jsonb; end if;
 insert into public.audit_logs(church_id,actor_user_id,action,entity_type,entity_id,metadata)
 values(v_church_id,(select auth.uid()),v_action,tg_table_name,v_entity_id,v_metadata);
 return coalesce(new,old);
end; $$;

revoke all on function private.audit_sensitive_change() from public;
revoke all on function private.audit_sensitive_change() from anon;
revoke all on function private.audit_sensitive_change() from authenticated;

drop trigger if exists audit_care_cases_changes on public.care_cases;
create trigger audit_care_cases_changes after insert or update on public.care_cases for each row execute function private.audit_sensitive_change();
drop trigger if exists audit_care_notes_changes on public.care_notes;
create trigger audit_care_notes_changes after insert on public.care_notes for each row execute function private.audit_sensitive_change();
create index if not exists audit_logs_church_created_idx on public.audit_logs(church_id,created_at desc);
