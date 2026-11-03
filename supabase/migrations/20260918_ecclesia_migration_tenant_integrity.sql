-- ECCLESIA AI
-- Applied Supabase migration: ecclesia_migration_tenant_integrity
-- Purpose: database-level tenant integrity for Migration Center child records.
--
-- Preflight performed before application:
-- migration_files, migration_mappings, migration_records and
-- migration_reconciliations each had zero church/job mismatches.

alter table public.migration_jobs
  add constraint migration_jobs_church_id_id_key unique (church_id, id);

alter table public.migration_files
  drop constraint migration_files_migration_job_id_fkey,
  add constraint migration_files_church_job_fkey
    foreign key (church_id, migration_job_id)
    references public.migration_jobs (church_id, id)
    on delete cascade;

alter table public.migration_mappings
  drop constraint migration_mappings_migration_job_id_fkey,
  add constraint migration_mappings_church_job_fkey
    foreign key (church_id, migration_job_id)
    references public.migration_jobs (church_id, id)
    on delete cascade;

alter table public.migration_records
  drop constraint migration_records_migration_job_id_fkey,
  add constraint migration_records_church_job_fkey
    foreign key (church_id, migration_job_id)
    references public.migration_jobs (church_id, id)
    on delete cascade;

alter table public.migration_reconciliations
  drop constraint migration_reconciliations_migration_job_id_fkey,
  add constraint migration_reconciliations_church_job_fkey
    foreign key (church_id, migration_job_id)
    references public.migration_jobs (church_id, id)
    on delete cascade;
