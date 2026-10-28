// Disposable loopback PostgreSQL only; no production SQL or provider calls.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { BASELINE_SCHEMA_SQL, createThinkingGamesFixture } from '../../../scripts/thinking-games-sql-fixture.mjs';

const read = path => readFile(path, 'utf8');
const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'daily-living-template-refs' });
const { families, children, users } = fixture.identities;
const migration = await read('supabase/migrations/202610250001_daily_living_template_refs.sql');
const verification = await read('supabase/preflight/202610250001_daily_living_template_refs.verify.sql');
const rollback = await read('supabase/rollbacks/202610250001_daily_living_template_refs.rollback.sql');
const cases = [];
const insert = (template, family = families.alpha, child = children.alpha, id = randomUUID()) => fixture.query(
  'insert into public.habit_activities(id, family_id, child_id, legacy_template_id) values ($1,$2,$3,$4)',
  [id, family, child, template],
);
const rejectsCode = (promise, code) => assert.rejects(promise, error => error.code === code);

try {
  // The shared fixture omits this existing production FK: use its exact tracked DDL.
  const tenancy = await read('supabase/migrations/202609190001_family_tenancy.sql');
  const childFamilyFk = tenancy.match(/alter table public\.habit_activities\s+add constraint habit_activities_child_family_fk[\s\S]*?;/)?.[0];
  assert.ok(childFamilyFk);
  await fixture.exec(childFamilyFk);
  await fixture.exec(await read('supabase/migrations/202609240001_legacy_template_refs.sql'));
  for (const namespace of ['NUT', 'GIV', 'VIR', 'MIN', 'PER', 'WIS', 'CAP', 'PHY']) await insert(`WIT-${namespace}-01`);
  await insert(null);
  await rejectsCode(insert('WIT-DLY-01'), '23514');
  cases.push('old-namespaces-and-null-accepted-dly-rejected-before-migration');

  const security = () => fixture.rows(`select relrowsecurity, relforcerowsecurity, relacl::text
    from pg_class where oid='public.habit_activities'::regclass`);
  const before = await security();
  await fixture.exec(migration);
  await fixture.exec(migration);
  await fixture.exec(verification);
  assert.deepEqual(await security(), before);
  cases.push('migration-reapply-and-preflight-preserve-acl-and-rls');

  for (let number = 1; number <= 10; number++) await insert(`WIT-DLY-${String(number).padStart(2, '0')}`);
  for (const invalid of ['WIT-DLY-1', 'WIT-DLY-001', 'WIT-DLY-AA', 'WIT-OTHER-01', 'WIT-DLY-01x']) {
    await rejectsCode(insert(invalid), '23514');
  }
  await rejectsCode(insert('WIT-DLY-01', families.alpha, children.beta), '23503');
  cases.push('dly-01-through-10-accepted-malformed-and-foreign-child-rejected');

  const collisionId = randomUUID();
  await insert('WIT-DLY-01', families.alpha, null, collisionId);
  await rejectsCode(insert('WIT-DLY-01', families.alpha, null, collisionId), '23505');
  const pendingId = randomUUID();
  await rejectsCode(fixture.query(`insert into public.habit_activities(id, family_id, child_id, legacy_template_id)
    values ($1,$3,null,'WIT-DLY-01'),($2,$3,null,'WIT-DLY-02')`, [collisionId, pendingId, families.alpha]), '23505');
  assert.equal(await fixture.scalar('select count(*)::int from public.habit_activities where id=$1', [collisionId]), 1);
  assert.equal(await fixture.scalar('select count(*)::int from public.habit_activities where id=$1', [pendingId]), 0);
  cases.push('primary-key-retry-and-bundle-conflict-are-atomic-no-duplicate-or-partial-insert');

  const concurrentId = randomUUID();
  const otherConnection = await fixture.db.connect();
  try {
    const sql = "insert into public.habit_activities(id, family_id, legacy_template_id) values ($1,$2,'WIT-DLY-03')";
    const results = await Promise.allSettled([
      fixture.query(sql, [concurrentId, families.alpha]),
      otherConnection.query(sql, [concurrentId, families.alpha]),
    ]);
    assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
    const rejected = results.find(result => result.status === 'rejected');
    assert.equal(rejected?.reason.code, '23505');
    assert.equal(await fixture.scalar('select count(*)::int from public.habit_activities where id=$1', [concurrentId]), 1);
    cases.push('two-concurrent-connections-create-exactly-one-row');
  } finally {
    await otherConnection.end();
  }

  await insert('WIT-DLY-01', families.beta, children.beta);
  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: users.parentAlpha, role: 'authenticated' } });
  assert.deepEqual(await fixture.rows('select id from public.habit_activities where family_id=$1', [families.beta]), []);
  await rejectsCode(insert('WIT-DLY-02', families.beta, children.beta), '42501');
  await fixture.resetAuthContext();
  cases.push('authenticated-foreign-family-read-and-write-denied');

  await rejectsCode(fixture.exec(rollback), 'P0001');
  await fixture.exec('rollback');
  await fixture.exec(verification);
  await fixture.exec("delete from public.habit_activities where legacy_template_id like 'WIT-DLY-%'");
  await fixture.exec(rollback);
  await rejectsCode(insert('WIT-DLY-01'), '23514');
  await insert('WIT-NUT-01');
  await insert(null);
  await fixture.exec(migration);
  await fixture.exec(verification);
  cases.push('rollback-fails-closed-with-dly-rows-restores-old-check-only-after-fixture-cleanup');

  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', cases, database: fixture.databaseName }));
} finally {
  await fixture.close();
}
