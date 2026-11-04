import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/20261101000000_lock_people_migration_import.sql', import.meta.url), 'utf8');
const smoke = readFileSync(new URL('../supabase/tests/people_migration_authorization_smoke.sql', import.meta.url), 'utf8');

test('People migration serializes imports with a job row lock', () => {
  assert.match(migration, /from public\.migration_jobs where id=target_job_id for update/i);
});
test('People migration rejects unresolved exceptions and incomplete names', () => {
  assert.match(migration, /Unresolved migration exceptions remain/);
  assert.match(migration, /Ready records must include first and last names/);
});
test('People migration checks actor church role and maintains audit trail', () => {
  assert.match(migration, /private\.has_church_role/);
  assert.match(migration, /migration\.people_imported/);
});
test('Database authorization smoke test covers anonymous and missing-user access', () => {
  assert.match(smoke, /has_function_privilege\('anon'/);
  assert.match(smoke, /Authentication required/);
});
