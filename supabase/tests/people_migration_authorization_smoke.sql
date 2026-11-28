-- ECCLESIA AI People migration authorization smoke tests.
-- Run against a disposable/test database or within a controlled maintenance session.
-- These tests do not insert church data; role changes are transaction-local.
-- Each DO block raises an error if the expected denial does not occur.

begin;
set local role authenticated;
do $$
begin
  begin
    perform public.import_ready_people_migration('00000000-0000-0000-0000-000000000000'::uuid);
    raise exception 'FAIL: import permitted without authenticated user identity';
  exception
    when others then
      if sqlerrm <> 'Authentication required' then raise; end if;
  end;
end $$;
rollback;

-- The anon role must have no EXECUTE grant on the SECURITY DEFINER function.
-- This query returns true only when the anon role lacks execution rights.
select not has_function_privilege('anon','public.import_ready_people_migration(uuid)','EXECUTE') as anon_execute_denied;

-- Verify database locking and early name validation are present in the function.
select
  position('for update' in lower(pg_get_functiondef(p.oid))) > 0 as job_row_lock_present,
  position('Ready records must include first and last names' in pg_get_functiondef(p.oid)) > 0 as name_preflight_present
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='import_ready_people_migration';
