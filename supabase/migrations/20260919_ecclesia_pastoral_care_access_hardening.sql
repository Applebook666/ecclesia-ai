-- ECCLESIA AI
-- Applied migration: ecclesia_pastoral_care_access_hardening
-- Care access is intentionally narrower than ordinary church membership.

create or replace function private.has_pastoral_care_access(target_church_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.church_memberships m
 where m.church_id=target_church_id and m.user_id=(select auth.uid())
 and m.status='active'::public.membership_status
 and m.role=any(array['owner'::public.church_role,'pastor'::public.church_role,'administrator'::public.church_role]));
$$;

create or replace function private.is_valid_care_assignee(target_church_id uuid,target_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
 select target_user_id is null or exists(select 1 from public.church_memberships m
 where m.church_id=target_church_id and m.user_id=target_user_id
 and m.status='active'::public.membership_status
 and m.role=any(array['owner'::public.church_role,'pastor'::public.church_role,'administrator'::public.church_role]));
$$;

drop policy if exists "care cases pastoral select" on public.care_cases;
drop policy if exists "care cases pastoral insert" on public.care_cases;
drop policy if exists "care cases pastoral update" on public.care_cases;
drop policy if exists "care notes pastoral select" on public.care_notes;
drop policy if exists "care notes pastoral insert" on public.care_notes;

create policy "care cases pastoral select" on public.care_cases for select to authenticated
using (private.has_pastoral_care_access(church_id));
create policy "care cases pastoral insert" on public.care_cases for insert to authenticated
with check (private.has_pastoral_care_access(church_id) and created_by=(select auth.uid()) and private.is_valid_care_assignee(church_id,assigned_to));
create policy "care cases pastoral update" on public.care_cases for update to authenticated
using (private.has_pastoral_care_access(church_id))
with check (private.has_pastoral_care_access(church_id) and private.is_valid_care_assignee(church_id,assigned_to));
create policy "care notes pastoral select" on public.care_notes for select to authenticated
using (private.has_pastoral_care_access(church_id) and exists(select 1 from public.care_cases c where c.id=care_notes.care_case_id and c.church_id=care_notes.church_id));
create policy "care notes pastoral insert" on public.care_notes for insert to authenticated
with check (private.has_pastoral_care_access(church_id) and author_user_id=(select auth.uid()) and exists(select 1 from public.care_cases c where c.id=care_notes.care_case_id and c.church_id=care_notes.church_id));
