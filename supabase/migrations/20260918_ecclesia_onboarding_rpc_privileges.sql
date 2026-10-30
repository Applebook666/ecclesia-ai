-- ECCLESIA AI
-- Applied Supabase migration: ecclesia_onboarding_rpc_privileges
--
-- create_church_for_current_user is intentionally SECURITY DEFINER: authenticated
-- users need one controlled atomic path to create a church and their initial owner
-- membership while normal table RLS remains restrictive.
--
-- The function itself validates auth.uid(), refuses users who already have an
-- active church membership, validates name/slug, fixes search_path to empty,
-- derives the owner user id from auth.uid(), and writes an audit log.
--
-- This migration makes the intended caller boundary explicit. Supabase's generic
-- security-definer advisor will continue to warn because authenticated execution
-- is intentional and reviewed.

revoke all on function public.create_church_for_current_user(text,text,text) from public;
revoke all on function public.create_church_for_current_user(text,text,text) from anon;
grant execute on function public.create_church_for_current_user(text,text,text) to authenticated;
