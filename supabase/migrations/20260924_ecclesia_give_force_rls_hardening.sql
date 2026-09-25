-- Harden ECCLESIA Give RLS even for table owners and privileged execution contexts.
alter table public.giving_funds force row level security;
alter table public.contributions force row level security;
