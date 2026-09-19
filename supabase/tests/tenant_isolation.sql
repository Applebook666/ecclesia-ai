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

select * from ecclesia_security_test_results order by test;
rollback;
