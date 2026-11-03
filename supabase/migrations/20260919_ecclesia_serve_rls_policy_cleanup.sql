-- ECCLESIA AI
-- Applied migration: ecclesia_serve_rls_policy_cleanup
-- Split ALL management policies into write-only policies so SELECT has one
-- permissive path per Serve table, while preserving existing role semantics.

do $$
declare t text; manage text; sel text;
begin
  -- Documentation marker only; concrete policies are created below.
end $$;

drop policy if exists "serve ministries manage" on public.ministries;
create policy "serve ministries insert" on public.ministries for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "serve ministries update" on public.ministries for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "serve ministries delete" on public.ministries for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
drop policy if exists "serve volunteers manage" on public.volunteers;
create policy "serve volunteers insert" on public.volunteers for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "serve volunteers update" on public.volunteers for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "serve volunteers delete" on public.volunteers for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
drop policy if exists "serve ministry volunteers manage" on public.ministry_volunteers;
create policy "serve ministry volunteers insert" on public.ministry_volunteers for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "serve ministry volunteers update" on public.ministry_volunteers for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "serve ministry volunteers delete" on public.ministry_volunteers for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
drop policy if exists "serve assignments manage" on public.service_assignments;
create policy "serve assignments insert" on public.service_assignments for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "serve assignments update" on public.service_assignments for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "serve assignments delete" on public.service_assignments for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
drop policy if exists "services_manage" on public.services;
create policy "services_insert" on public.services for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "services_update" on public.services for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "services_delete" on public.services for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
drop policy if exists "service_positions_manage" on public.service_positions;
create policy "service_positions_insert" on public.service_positions for insert to authenticated with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "service_positions_update" on public.service_positions for update to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[])) with check (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
create policy "service_positions_delete" on public.service_positions for delete to authenticated using (private.has_church_role(church_id,array['owner','pastor','administrator','staff','ministry_leader']::public.church_role[]));
