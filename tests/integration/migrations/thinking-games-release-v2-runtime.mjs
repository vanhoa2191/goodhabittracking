import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const game = await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8');
const release = await readFile('supabase/migrations/202610290001_thinking_games_release_v2.sql', 'utf8');
const rollback = await readFile('supabase/rollbacks/202610290001_thinking_games_release_v2.rollback.sql', 'utf8');
const verify = await readFile('supabase/preflight/202610290001_thinking_games_release_v2.verify.sql', 'utf8');

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'release-v2' });
try {
  await fixture.exec(game);
  const before = await fixture.scalar('select public.thinking_game_resolve_trusted_release_version()');
  if (before !== 'release-365-v1') throw new Error(`expected v1 before the flip, got ${before}`);

  await fixture.exec(release);
  await fixture.exec(release); // replaying the forward migration is harmless
  if (await fixture.scalar('select public.thinking_game_resolve_trusted_release_version()') !== 'release-365-v2') {
    throw new Error('trusted release version did not flip to v2');
  }
  if (await fixture.scalar('select public.thinking_game_resolve_content_version()') !== 'release-365-v2') {
    throw new Error('content version resolver did not follow the trusted version');
  }
  const acl = await fixture.one(`select
    has_function_privilege('anon','public.thinking_game_resolve_trusted_release_version()','execute') as anon,
    has_function_privilege('authenticated','public.thinking_game_resolve_trusted_release_version()','execute') as authenticated,
    has_function_privilege('service_role','public.thinking_game_resolve_trusted_release_version()','execute') as service_role`);
  if (acl.anon || !acl.authenticated || !acl.service_role) throw new Error('trusted version ACL changed');

  await fixture.exec(`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations(version text primary key);
    insert into supabase_migrations.schema_migrations(version) values ('202610290001');
  `);
  let rejected = false;
  try { await fixture.exec(verify); } catch (error) { rejected = /release_v2_content_incomplete/.test(String(error.message)); }
  if (!rejected) throw new Error('verification accepted a missing v2 content import');

  await fixture.exec(`insert into public.thinking_game_content
    (id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id, status, checker_id,
     public_payload, grading_payload, fingerprint)
    select 'E' || lpad(d::text, 3, '0') || '-' || s || '-' || t, 'release-365-v2', d, s, t, 'vi', 'g01-t1', 'g01-t1:v', 'approved',
      'rule-sequence-v1', '{}'::jsonb, '{}'::jsonb, lpad(to_hex(d), 16, '0')
    from generate_series(1, 365) d, unnest(array['main','bonus']) s, unnest(array['age_6_8','age_9_12']) t`);
  await fixture.exec(verify);

  await fixture.exec(rollback);
  if (await fixture.scalar('select public.thinking_game_resolve_trusted_release_version()') !== 'release-365-v1') {
    throw new Error('rollback did not restore v1');
  }
  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', database: fixture.databaseName }));
} finally {
  await fixture.close();
}
