import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const guard = await readFile('supabase/migrations/202610120002_parent_role_activity_guard.sql', 'utf8');
const game = await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8');
const reconcile = await readFile('supabase/migrations/202610280001_reconcile_thinking_games_guard.sql', 'utf8');
const preflight = await readFile('supabase/preflight/202610280001_reconcile_thinking_games_guard.verify.sql', 'utf8');
const requiredVersions = ['202610120001', '202610120002', '202610210001', '202610240001',
  '202610250001', '202610270001', '202610280001'];
const parentActivity = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const parentCommand = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const childCommand = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';

for (const [label, order] of [
  ['backfill-then-game', [guard, game]],
  ['game-then-backfill', [game, guard]],
]) {
  const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: `reconcile-${label}` });
  try {
    for (const migration of order) await fixture.exec(migration);
    await fixture.exec(reconcile);
    await fixture.exec(`
      create schema supabase_migrations;
      create table supabase_migrations.schema_migrations(version text primary key);
    `);
    for (const version of requiredVersions) {
      await fixture.query('insert into supabase_migrations.schema_migrations(version) values ($1)', [version]);
    }
    await fixture.exec(preflight);
    await fixture.query(`insert into public.habit_activities
      (id,family_id,child_id,title,points,requires_approval,is_parent_role)
      values ($1,$2,$3,'Parent role only',10,false,true)`,
    [parentActivity, fixture.identities.families.alpha, fixture.identities.children.alpha]);
    const today = await fixture.scalar('select current_date::text');
    await fixture.applyAuthContext({ role: 'authenticated', claims: {
      sub: fixture.identities.users.parentAlpha, role: 'authenticated',
    } });
    const parent = await fixture.one('select public.complete_habit_command($1,$2,$3,$4) result',
      [parentActivity, fixture.identities.children.alpha, today, parentCommand]);
    if (parent.result.status !== 'parent_role_activity') throw new Error(`${label}: parent RPC accepted parent-role activity`);
    await fixture.resetAuthContext();
    const child = await fixture.one('select public.complete_child_habit_command($1,$2,$3,$4) result',
      [fixture.identities.sessions.childAlphaLive.tokenHash, parentActivity, today, childCommand]);
    if (child.result.status !== 'parent_role_activity') throw new Error(`${label}: child RPC accepted parent-role activity`);
    const logCount = await fixture.scalar('select count(*)::integer from public.activity_logs where activity_id=$1', [parentActivity]);
    if (logCount !== 0) throw new Error(`${label}: rejected activity wrote a log`);
    await fixture.query('delete from supabase_migrations.schema_migrations where version=$1', ['202610120002']);
    const incomplete = await fixture.one('select public.schema_version() version');
    if (incomplete.version !== null) throw new Error(`${label}: incomplete ledger reported ready`);
    let rejected = false;
    try { await fixture.exec(preflight); } catch (error) { rejected = /required_migration_missing/.test(String(error.message)); }
    if (!rejected) throw new Error(`${label}: preflight accepted missing backfill`);
    console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', order: label, database: fixture.databaseName }));
  } finally {
    await fixture.close();
  }
}
