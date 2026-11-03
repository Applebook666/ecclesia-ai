-- Keep Migration Center authorization explicit per SQL operation.
drop policy if exists migration_files_access on public.migration_files;
create policy migration_files_select on public.migration_files for select to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_files_insert on public.migration_files for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_files_update on public.migration_files for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_files_delete on public.migration_files for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));

drop policy if exists migration_mappings_access on public.migration_mappings;
create policy migration_mappings_select on public.migration_mappings for select to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_mappings_insert on public.migration_mappings for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_mappings_update on public.migration_mappings for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_mappings_delete on public.migration_mappings for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));

drop policy if exists migration_records_access on public.migration_records;
create policy migration_records_select on public.migration_records for select to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_records_insert on public.migration_records for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_records_update on public.migration_records for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_records_delete on public.migration_records for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));

drop policy if exists migration_reconciliations_access on public.migration_reconciliations;
create policy migration_reconciliations_select on public.migration_reconciliations for select to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_reconciliations_insert on public.migration_reconciliations for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_reconciliations_update on public.migration_reconciliations for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
create policy migration_reconciliations_delete on public.migration_reconciliations for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator']::public.church_role[]));
