-- ECCLESIA AI
-- Applied migration: ecclesia_people_care_tenant_integrity
-- Preflight confirmed zero existing cross-church mismatches.
alter table public.households add constraint households_church_id_id_key unique (church_id,id);
alter table public.care_cases add constraint care_cases_church_id_id_key unique (church_id,id);

alter table public.people drop constraint people_household_id_fkey,
 add constraint people_church_household_fkey foreign key (church_id,household_id)
 references public.households(church_id,id) on delete set null (household_id);

alter table public.visitor_journeys drop constraint visitor_journeys_person_id_fkey,
 add constraint visitor_journeys_church_person_fkey foreign key (church_id,person_id)
 references public.people(church_id,id) on delete cascade;

alter table public.tasks drop constraint tasks_related_person_id_fkey,
 add constraint tasks_church_person_fkey foreign key (church_id,related_person_id)
 references public.people(church_id,id) on delete set null (related_person_id);

alter table public.care_cases drop constraint care_cases_person_id_fkey,
 add constraint care_cases_church_person_fkey foreign key (church_id,person_id)
 references public.people(church_id,id) on delete set null (person_id);

alter table public.care_notes drop constraint care_notes_care_case_id_fkey,
 add constraint care_notes_church_case_fkey foreign key (church_id,care_case_id)
 references public.care_cases(church_id,id) on delete cascade;
