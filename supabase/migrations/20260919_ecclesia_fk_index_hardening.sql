-- ECCLESIA AI
-- Applied migration: ecclesia_fk_index_hardening
-- Cover tenant-aware foreign keys and frequently joined user foreign keys.
create index care_cases_church_person_idx on public.care_cases(church_id,person_id);
create index care_cases_created_by_idx on public.care_cases(created_by);
create index care_notes_author_user_idx on public.care_notes(author_user_id);
create index care_notes_church_case_idx on public.care_notes(church_id,care_case_id);
create index migration_files_church_job_idx on public.migration_files(church_id,migration_job_id);
create index migration_jobs_created_by_idx on public.migration_jobs(created_by);
create index migration_mappings_church_job_idx on public.migration_mappings(church_id,migration_job_id);
create index migration_mappings_approved_by_idx on public.migration_mappings(approved_by);
create index migration_reconciliations_church_job_idx on public.migration_reconciliations(church_id,migration_job_id);
create index migration_records_church_job_idx on public.migration_records(church_id,migration_job_id);
create index ministries_leader_user_idx on public.ministries(leader_user_id);
create index ministry_volunteers_church_ministry_idx on public.ministry_volunteers(church_id,ministry_id);
create index ministry_volunteers_church_volunteer_idx on public.ministry_volunteers(church_id,volunteer_id);
create index people_church_household_idx on public.people(church_id,household_id);
create index service_assignments_church_ministry_idx on public.service_assignments(church_id,ministry_id);
create index service_assignments_church_position_idx on public.service_assignments(church_id,service_position_id);
create index service_assignments_church_service_idx on public.service_assignments(church_id,service_id);
create index service_assignments_church_volunteer_idx on public.service_assignments(church_id,volunteer_id);
create index service_assignments_created_by_idx on public.service_assignments(created_by);
create index service_positions_church_ministry_idx on public.service_positions(church_id,ministry_id);
create index services_created_by_idx on public.services(created_by);
create index tasks_church_person_idx on public.tasks(church_id,related_person_id);
create index visitor_journeys_owner_user_idx on public.visitor_journeys(owner_user_id);
