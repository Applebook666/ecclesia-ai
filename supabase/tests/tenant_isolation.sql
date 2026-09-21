-- ECCLESIA AI tenant-isolation regression tests
-- Run against a non-production database or inside a transaction.
-- All fixtures are rolled back.

begin;
create temp table ecclesia_security_test_results(test text, passed boolean, detail text) on commit drop;

do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); ha uuid; pb uuid;
begin
  insert into public.churches(id,name,slug)
  values(a,'Isolation Test A','isolation-a-'||substr(a::text,1,8)),
        (b,'Isolation Test B','isolation-b-'||substr(b::text,1,8));

  insert into public.households(church_id,household_name)
  values(a,'A Household') returning id into ha;

  insert into public.people(church_id,first_name,last_name)
  values(b,'B','Person') returning id into pb;

  begin
    update public.people set household_id=ha where id=pb;
    insert into ecclesia_security_test_results values
      ('cross_church_household_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then
    insert into ecclesia_security_test_results values
      ('cross_church_household_rejected',true,'FK rejected mismatched church');
  end;

  begin
    insert into public.volunteers(church_id,person_id) values(a,pb);
    insert into ecclesia_security_test_results values
      ('cross_church_volunteer_person_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then
    insert into ecclesia_security_test_results values
      ('cross_church_volunteer_person_rejected',true,'FK rejected mismatched church');
  end;
end $$;



-- Extended composite-FK attacks. Use a temporary auth user so auth-backed
-- created_by constraints remain intact; the outer transaction rolls it back.
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); u uuid:=gen_random_uuid();
        pa uuid; pb uuid; ma uuid; mb uuid; sa uuid; sb uuid; spa uuid; va uuid; vb uuid; joba uuid;
begin
  insert into auth.users(id,aud,role,email,created_at,updated_at)
  values(u,'authenticated','authenticated','isolation-'||substr(u::text,1,8)||'@example.invalid',now(),now());
  insert into public.churches(id,name,slug) values
    (a,'Isolation Extended A','isolation-ext-a-'||substr(a::text,1,8)),
    (b,'Isolation Extended B','isolation-ext-b-'||substr(b::text,1,8));
  insert into public.people(church_id,first_name,last_name) values(a,'A','Person') returning id into pa;
  insert into public.people(church_id,first_name,last_name) values(b,'B','Person') returning id into pb;
  insert into public.ministries(church_id,name) values(a,'A Ministry') returning id into ma;
  insert into public.ministries(church_id,name) values(b,'B Ministry') returning id into mb;
  insert into public.services(church_id,name,starts_at,created_by) values(a,'A Service',now()+interval '1 day',u) returning id into sa;
  insert into public.services(church_id,name,starts_at,created_by) values(b,'B Service',now()+interval '1 day',u) returning id into sb;
  insert into public.volunteers(church_id,person_id) values(a,pa) returning id into va;
  insert into public.volunteers(church_id,person_id) values(b,pb) returning id into vb;
  insert into public.service_positions(church_id,service_id,ministry_id,role_name) values(a,sa,ma,'Greeter') returning id into spa;
  insert into public.migration_jobs(church_id,source_name,source_type,created_by) values(a,'A Import','csv',u) returning id into joba;

  begin insert into public.migration_files(church_id,migration_job_id,original_name,storage_path) values(b,joba,'x.csv','x');
    insert into ecclesia_security_test_results values('migration_file_cross_church_job_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then insert into ecclesia_security_test_results values('migration_file_cross_church_job_rejected',true,'FK rejected mismatched church'); end;
  begin insert into public.service_positions(church_id,service_id,ministry_id,role_name) values(a,sb,ma,'Bad');
    insert into ecclesia_security_test_results values('position_cross_church_service_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then insert into ecclesia_security_test_results values('position_cross_church_service_rejected',true,'FK rejected mismatched church'); end;
  begin insert into public.service_positions(church_id,service_id,ministry_id,role_name) values(a,sa,mb,'Bad');
    insert into ecclesia_security_test_results values('position_cross_church_ministry_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then insert into ecclesia_security_test_results values('position_cross_church_ministry_rejected',true,'FK rejected mismatched church'); end;
  begin insert into public.service_assignments(church_id,ministry_id,volunteer_id,service_id,service_position_id,role_name,starts_at,created_by) values(a,ma,vb,sa,spa,'Bad',now(),u);
    insert into ecclesia_security_test_results values('assignment_cross_church_volunteer_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then insert into ecclesia_security_test_results values('assignment_cross_church_volunteer_rejected',true,'FK rejected mismatched church'); end;
  begin insert into public.visitor_journeys(church_id,person_id) values(a,pb);
    insert into ecclesia_security_test_results values('visitor_cross_church_person_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then insert into ecclesia_security_test_results values('visitor_cross_church_person_rejected',true,'FK rejected mismatched church'); end;
  begin insert into public.tasks(church_id,title,related_person_id) values(a,'Bad',pb);
    insert into ecclesia_security_test_results values('task_cross_church_person_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then insert into ecclesia_security_test_results values('task_cross_church_person_rejected',true,'FK rejected mismatched church'); end;
  begin insert into public.care_cases(church_id,person_id,title,created_by) values(a,pb,'Bad Care',u);
    insert into ecclesia_security_test_results values('care_cross_church_person_rejected',false,'unexpectedly accepted');
  exception when foreign_key_violation then insert into ecclesia_security_test_results values('care_cross_church_person_rejected',true,'FK rejected mismatched church'); end;
end $$;


-- Authenticated RLS regression attacks
do $$
declare ca uuid:=gen_random_uuid(); cb uuid:=gen_random_uuid(); ownera uuid:=gen_random_uuid();
        staffa uuid:=gen_random_uuid(); vola uuid:=gen_random_uuid(); suspa uuid:=gen_random_uuid();
        ownerb uuid:=gen_random_uuid(); pa uuid; pb uuid; carea uuid; minb uuid; n int;
begin
  insert into auth.users(id,aud,role,email,created_at,updated_at) values
    (ownera,'authenticated','authenticated','rls-owner-a@example.invalid',now(),now()),
    (staffa,'authenticated','authenticated','rls-staff-a@example.invalid',now(),now()),
    (vola,'authenticated','authenticated','rls-vol-a@example.invalid',now(),now()),
    (suspa,'authenticated','authenticated','rls-suspended-a@example.invalid',now(),now()),
    (ownerb,'authenticated','authenticated','rls-owner-b@example.invalid',now(),now());
  insert into public.churches(id,name,slug) values
    (ca,'RLS Test A','rls-test-a-'||substr(ca::text,1,8)),(cb,'RLS Test B','rls-test-b-'||substr(cb::text,1,8));
  insert into public.church_memberships(church_id,user_id,role,status) values
    (ca,ownera,'owner','active'),(ca,staffa,'staff','active'),(ca,vola,'volunteer','active'),
    (ca,suspa,'staff','suspended'),(cb,ownerb,'owner','active');
  insert into public.people(church_id,first_name,last_name) values(ca,'A','Person') returning id into pa;
  insert into public.people(church_id,first_name,last_name) values(cb,'B','Person') returning id into pb;
  insert into public.care_cases(church_id,person_id,title,created_by) values(ca,pa,'Private',ownera) returning id into carea;
  insert into public.migration_jobs(church_id,source_name,source_type,created_by) values(ca,'Private Import','csv',ownera);
  insert into public.ministries(church_id,name) values(cb,'B Ministry') returning id into minb;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub',staffa::text,true);
  select count(*) into n from public.care_cases where church_id=ca;
  insert into ecclesia_security_test_results values('staff_cannot_read_care',n=0,'visible rows='||n);
  select count(*) into n from public.migration_jobs where church_id=ca;
  insert into ecclesia_security_test_results values('staff_cannot_read_migration',n=0,'visible rows='||n);
  begin insert into public.care_cases(church_id,title,created_by) values(ca,'Unauthorized',staffa);
    insert into ecclesia_security_test_results values('staff_cannot_create_care',false,'unexpectedly accepted');
  exception when insufficient_privilege then insert into ecclesia_security_test_results values('staff_cannot_create_care',true,'RLS rejected insert'); end;

  perform set_config('request.jwt.claim.sub',vola::text,true);
  select count(*) into n from public.care_cases where church_id=ca;
  insert into ecclesia_security_test_results values('volunteer_cannot_read_care',n=0,'visible rows='||n);
  begin insert into public.people(church_id,first_name,last_name) values(ca,'Bad','Write');
    insert into ecclesia_security_test_results values('volunteer_cannot_write_people',false,'unexpectedly accepted');
  exception when insufficient_privilege then insert into ecclesia_security_test_results values('volunteer_cannot_write_people',true,'RLS rejected insert'); end;

  perform set_config('request.jwt.claim.sub',suspa::text,true);
  select count(*) into n from public.people where church_id=ca;
  insert into ecclesia_security_test_results values('suspended_member_cannot_read_people',n=0,'visible rows='||n);

  perform set_config('request.jwt.claim.sub',ownera::text,true);
  select count(*) into n from public.people where church_id=cb;
  insert into ecclesia_security_test_results values('church_a_owner_cannot_read_church_b_people',n=0,'visible rows='||n);
  update public.people set first_name='Hacked' where id=pb; get diagnostics n=row_count;
  insert into ecclesia_security_test_results values('church_a_owner_cannot_update_church_b_person',n=0,'updated rows='||n);
  delete from public.ministries where id=minb; get diagnostics n=row_count;
  insert into ecclesia_security_test_results values('church_a_owner_cannot_delete_church_b_ministry',n=0,'deleted rows='||n);
  reset role;
end $$;

-- Pastoral Care audit confidentiality regression
do $$
declare c uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); p uuid; cc uuid;
        secret_summary text:='ECCLESIA_SECRET_SUMMARY_92841'; secret_note text:='ECCLESIA_SECRET_NOTE_73155';
        leaked int; events int; notes int;
begin
  insert into auth.users(id,aud,role,email,created_at,updated_at)
  values(u,'authenticated','authenticated','care-audit@example.invalid',now(),now());
  insert into public.churches(id,name,slug) values(c,'Care Audit Test','care-audit-'||substr(c::text,1,8));
  insert into public.church_memberships(church_id,user_id,role,status) values(c,u,'owner','active');
  insert into public.people(church_id,first_name,last_name) values(c,'Audit','Person') returning id into p;
  perform set_config('request.jwt.claim.sub',u::text,true);
  insert into public.care_cases(church_id,person_id,title,summary,created_by)
    values(c,p,'Audit Case',secret_summary,u) returning id into cc;
  update public.care_cases set summary=secret_summary||'_CHANGED',priority='high' where id=cc;
  insert into public.care_notes(church_id,care_case_id,author_user_id,note) values(c,cc,u,secret_note);
  select count(*) into events from public.audit_logs where church_id=c and action in ('care_cases.insert','care_cases.update','care_notes.insert');
  select count(*) into notes from public.audit_logs where church_id=c and action='care_notes.insert'
    and metadata->>'care_case_id'=cc::text and metadata->>'note_content_logged'='false';
  select count(*) into leaked from public.audit_logs where church_id=c
    and (metadata::text like '%'||secret_summary||'%' or metadata::text like '%'||secret_note||'%');
  insert into ecclesia_security_test_results values(
    'care_audit_does_not_leak_sensitive_content',
    events=3 and notes=1 and leaked=0,
    'events='||events||', note events='||notes||', leaked='||leaked);
end $$;

reset role;
select * from ecclesia_security_test_results order by test;
rollback;
