import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const migration = source('supabase/migrations/20261101000000_lock_people_migration_import.sql');
const smoke = source('supabase/tests/people_migration_authorization_smoke.sql');
const isolation = source('supabase/tests/tenant_isolation.sql');
const actions = source('app/migration/actions.ts');

test('People import locks the job before evaluating its state', () => {
  assert.match(migration, /from public\.migration_jobs where id=target_job_id for update/i);
  assert.match(migration, /if v_status<>'review'/);
});
test('People import refuses unresolved exceptions and blank names', () => {
  assert.match(migration, /Unresolved migration exceptions remain/);
  assert.match(migration, /Ready records must include first and last names/);
});
test('People import authorizes the caller and records an audit event', () => {
  assert.match(migration, /v_uid uuid:=auth\.uid\(\)/);
  assert.match(migration, /private\.has_church_role/);
  assert.match(migration, /migration\.people_imported/);
});
test('People import is an atomic SQL function with restricted search path', () => {
  assert.match(migration, /SECURITY DEFINER/i);
  assert.match(migration, /SET search_path TO ''/i);
  assert.match(migration, /insert into public\.migration_reconciliations/i);
});
test('Authorization SQL checks anonymous and unauthenticated access', () => {
  assert.match(smoke, /has_function_privilege\('anon'/);
  assert.match(smoke, /Authentication required/);
});
test('Tenant isolation SQL covers cross-church references and RLS', () => {
  for (const scenario of [
    'cross_church_household_rejected',
    'migration_file_cross_church_job_rejected',
    'staff_cannot_read_care',
    'staff_cannot_read_migration',
    'volunteer_cannot_write_people',
  ]) assert.ok(isolation.includes(scenario), 'Missing scenario: ' + scenario);
});
test('Application import delegates to the database RPC rather than inserting people directly', () => {
  assert.match(actions, /\.rpc\("import_ready_people_migration"/);
});

test('Mapping approval requires both first and last names', () => {
  assert.match(actions, /maps\.some\(x=>x\.target_field==="first_name"\)\|\|!maps\.some\(x=>x\.target_field==="last_name"\)/);
});
