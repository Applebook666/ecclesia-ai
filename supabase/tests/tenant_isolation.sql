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

select * from ecclesia_security_test_results order by test;
rollback;
