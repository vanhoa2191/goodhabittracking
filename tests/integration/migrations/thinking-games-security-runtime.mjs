import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-security' });
const migration = await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8');
const preflight = await readFile('supabase/preflight/202610210001_thinking_games.verify.sql', 'utf8');
const tables = [
  'thinking_game_settings', 'thinking_game_journeys', 'thinking_game_day_snapshots',
  'thinking_game_content', 'thinking_game_entitlements', 'thinking_game_attempts',
  'thinking_game_habit_receipts', 'thinking_game_audit_events',
];
try {
  await fixture.exec(migration);
  await fixture.exec(preflight);
  const security = await fixture.query(`
    select c.relname, c.relrowsecurity, c.relforcerowsecurity
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname = any($1::text[])
    order by c.relname
  `, [tables]);
  if (security.rows.length !== tables.length || security.rows.some((row) => !row.relrowsecurity || !row.relforcerowsecurity)) {
    throw new Error('not every thinking-game table has enabled and forced RLS');
  }
  await fixture.query(`insert into public.thinking_game_journeys(child_id,family_id) values ($1,$2)`,
    [fixture.identities.children.alpha, fixture.identities.families.alpha]);
  await fixture.query('grant select on public.thinking_game_journeys to authenticated');
  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: fixture.identities.users.parentAlpha, role: 'authenticated' } });
  const ownJourney = await fixture.query(`select child_id from public.thinking_game_journeys where family_id=$1`,
    [fixture.identities.families.alpha]);
  const foreignJourney = await fixture.query(`select child_id from public.thinking_game_journeys where family_id=$1`,
    [fixture.identities.families.beta]);
  if (ownJourney.rows.length !== 1 || foreignJourney.rows.length !== 0) throw new Error('journey tenant policy mismatch');
  const foreignPolicies = await fixture.query(`
    select tablename, policyname, qual
    from pg_policies where schemaname='public' and tablename = any($1::text[])
  `, [tables]);
  if (foreignPolicies.rows.some((row) => row.qual?.includes('true'))) throw new Error('permissive game policy');
  const acl = await fixture.query(`
    select has_function_privilege('anon','public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid)','execute') as anon_parent,
           has_function_privilege('authenticated','public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid)','execute') as auth_parent,
           has_function_privilege('anon','public.thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid)','execute') as anon_finish
  `);
  if (acl.rows[0].anon_parent || acl.rows[0].auth_parent || acl.rows[0].anon_finish) throw new Error('protected RPC ACL exposed');

  await fixture.resetAuthContext();
  await fixture.query('alter table public.thinking_game_journeys disable row level security');
  let unsafeRejected = false;
  try { await fixture.exec(preflight); } catch (error) { unsafeRejected = /rls_not_enabled|rls_not_forced/.test(String(error.message)); }
  if (!unsafeRejected) throw new Error('preflight accepted intentionally unsafe schema');
  await fixture.query('alter table public.thinking_game_journeys enable row level security');
  await fixture.query('alter table public.thinking_game_journeys force row level security');
  await fixture.exec(preflight);

  const rollback = await readFile('supabase/rollbacks/202610210001_thinking_games.rollback.sql', 'utf8');
  await fixture.exec(rollback);
  const audit = await fixture.query(`select to_regclass('public.thinking_game_audit_events') as audit_table, to_regclass('public.activity_logs') as habit_table`);
  if (audit.rows[0].audit_table !== null || audit.rows[0].habit_table === null) throw new Error('rollback removed wrong data surface');
  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: ['all-game-tables-rls-force', 'nonpermissive-policies', 'protected-rpc-acl', 'unsafe-preflight-rejection', 'rollback-preserves-habits'],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
