import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const game = await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8');
const v2 = await readFile('supabase/migrations/202610290001_thinking_games_release_v2.sql', 'utf8');
const tracks = await readFile('supabase/migrations/202610300001_thinking_games_age_tracks.sql', 'utf8');
const release = await readFile('supabase/migrations/202610300002_thinking_games_release_v3.sql', 'utf8');
const tracksRollback = await readFile('supabase/rollbacks/202610300001_thinking_games_age_tracks.rollback.sql', 'utf8');
const releaseRollback = await readFile('supabase/rollbacks/202610300002_thinking_games_release_v3.rollback.sql', 'utf8');
const verify = await readFile('supabase/preflight/202610300002_thinking_games_release_v3.verify.sql', 'utf8');

const insertRow = (id, version, day, slot, track) => `insert into public.thinking_game_content
  (id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id, status, checker_id,
   public_payload, grading_payload, fingerprint)
  values ('${id}', '${version}', ${day}, '${slot}', '${track}', 'vi', 'g01-t1', 'g01-t1:v', 'approved',
   'rule-sequence-v1', '{}'::jsonb, '{}'::jsonb, '${id}')`;

async function rejects(fixture, sql, pattern) {
  try { await fixture.exec(sql); } catch (error) {
    await fixture.exec('rollback'); // a failed migration leaves its explicit transaction open
    return pattern.test(String(error.message));
  }
  return false;
}

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'release-v3' });
try {
  await fixture.exec(game);
  await fixture.exec(v2);

  if (!await rejects(fixture, insertRow('X1', 'release-365-v3', 1, 'main', 'age_3_5'), /age_track_check/)) {
    throw new Error('the two-track content constraint should reject age_3_5 before the widening migration');
  }
  await fixture.exec(tracks);
  await fixture.exec(tracks); // replaying the widening migration is harmless
  for (const track of ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus']) {
    await fixture.exec(insertRow(`probe-${track}`, 'probe', 1, 'main', track));
  }
  if (!await rejects(fixture, insertRow('X2', 'probe', 2, 'main', 'age_14_plus'), /age_track_check/)) {
    throw new Error('the widened content constraint accepted an unknown track');
  }
  const overrideDef = await fixture.scalar(`select pg_get_constraintdef(oid) from pg_constraint
    where conname = 'thinking_game_settings_age_track_override_check'`);
  if (!/age_3_5/.test(overrideDef) || !/age_13_plus/.test(overrideDef)) throw new Error('settings override constraint not widened');
  await fixture.exec(`delete from public.thinking_game_content where content_version = 'probe'`);

  if (await fixture.scalar('select public.thinking_game_resolve_trusted_release_version()') !== 'release-365-v2') {
    throw new Error('expected v2 before the v3 flip');
  }
  await fixture.exec(release);
  await fixture.exec(release); // replaying the forward migration is harmless
  if (await fixture.scalar('select public.thinking_game_resolve_trusted_release_version()') !== 'release-365-v3') {
    throw new Error('trusted release version did not flip to v3');
  }
  if (await fixture.scalar('select public.thinking_game_resolve_content_version()') !== 'release-365-v3') {
    throw new Error('content version resolver did not follow the trusted version');
  }
  const acl = await fixture.one(`select
    has_function_privilege('anon','public.thinking_game_resolve_trusted_release_version()','execute') as anon,
    has_function_privilege('authenticated','public.thinking_game_resolve_trusted_release_version()','execute') as authenticated,
    has_function_privilege('service_role','public.thinking_game_resolve_trusted_release_version()','execute') as service_role,
    has_function_privilege('authenticated','public.thinking_game_resolve_age_track_for_child(uuid,uuid)','execute') as resolver_authenticated`);
  if (acl.anon || !acl.authenticated || !acl.service_role || acl.resolver_authenticated) throw new Error('release function ACL changed');
  const resolverDef = await fixture.scalar(`select pg_get_functiondef('public.thinking_game_resolve_age_track_for_child(uuid,uuid)'::regprocedure)`);
  if (!/'age_3_5'/.test(resolverDef) || !/'age_13_plus'/.test(resolverDef)) throw new Error('resolver does not cover all four tracks');

  await fixture.exec(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations(version text primary key);
    insert into supabase_migrations.schema_migrations(version) values ('202610300001'), ('202610300002');
  `);
  if (!await rejects(fixture, verify, /release_v3_content_incomplete/)) {
    throw new Error('verification accepted a missing v3 content import');
  }
  await fixture.exec(`insert into public.thinking_game_content
    (id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id, status, checker_id,
     public_payload, grading_payload, fingerprint)
    select 'F' || lpad(d::text, 3, '0') || '-' || s || '-' || t, 'release-365-v3', d, s, t, 'vi', 'g01-t1', 'g01-t1:v', 'approved',
      'rule-sequence-v1', '{}'::jsonb, '{}'::jsonb, lpad(to_hex(d), 16, '0')
    from generate_series(1, 365) d, unnest(array['main','bonus']) s,
      unnest(array['age_3_5','age_6_8','age_9_12','age_13_plus']) t`);
  await fixture.exec(verify);

  await fixture.exec(releaseRollback);
  if (await fixture.scalar('select public.thinking_game_resolve_trusted_release_version()') !== 'release-365-v2') {
    throw new Error('rollback did not restore v2');
  }
  const rolledBack = await fixture.scalar(`select pg_get_functiondef('public.thinking_game_resolve_age_track_for_child(uuid,uuid)'::regprocedure)`);
  if (/'age_3_5'|'age_13_plus'/.test(rolledBack)) throw new Error('rollback did not restore the two-track resolver');

  if (!await rejects(fixture, tracksRollback, /age_track_check/)) {
    throw new Error('narrowing the constraint must fail while age_3_5 / age_13_plus rows exist');
  }
  await fixture.exec(`delete from public.thinking_game_content where content_version = 'release-365-v3'`);
  await fixture.exec(tracksRollback);
  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', database: fixture.databaseName }));
} finally {
  await fixture.close();
}
