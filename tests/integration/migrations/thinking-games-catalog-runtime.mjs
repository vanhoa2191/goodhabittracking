import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-catalog' });
const { identities: ids } = fixture;
const migration = await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8');
const pilot = JSON.parse(await readFile('content/thinking-games/pilot/pilot-manifest-v1.json', 'utf8'));
const day = (await fixture.familyClock('UTC')).localDay;
const command = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
try {
  await fixture.exec(migration);
  await fixture.exec(`set thinking_games.content_version = 'pilot-2026-10-21'`);
  await fixture.exec(`
    create or replace function public.act_as_user(actor_user_id uuid)
    returns void language plpgsql security definer set search_path = '' as $$
    begin
      perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
      perform set_config('request.jwt.claim.role', 'authenticated', true);
      perform set_config('request.jwt.claims', json_build_object('sub', actor_user_id, 'role', 'authenticated')::text, true);
    end $$;
  `);
  await fixture.query(`insert into public.thinking_game_settings(family_id,enabled,bonus_enabled,timezone)
    values ($1,true,true,'UTC')`, [ids.families.alpha]);
  await fixture.query(`insert into public.thinking_game_settings(family_id,enabled,bonus_enabled,timezone)
    values ($1,true,true,'UTC')`, [ids.families.beta]);
  // Bedtime defaults (21:00-07:00 UTC) block starts when the live clock is in the
  // night window. This suite does not assert bedtime; pin a past-relative window so
  // the family local time is always in the "awake" region of the day.
  await fixture.query(`update public.thinking_game_settings
    set bedtime_start_local = ((now() at time zone 'UTC') - interval '6 hours')::time,
        bedtime_end_local = ((now() at time zone 'UTC') - interval '5 hours')::time`);
  for (const item of pilot.items) {
    await fixture.query(`insert into public.thinking_game_content
      (id,content_version,day_index,slot_type,age_track,locale,game_type_id,rule_variant_id,status,checker_id,public_payload,grading_payload,fingerprint)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [item.id, item.contentVersion, item.dayIndex, item.slotType, item.ageTrack, item.locale,
        item.gameTypeId, item.ruleVariantId, item.status, item.validSolutionPredicate,
        item, { solution: item.solution, validSolutionPredicate: item.validSolutionPredicate }, item.fingerprint]);
  }
  const session = ids.sessions.childAlphaLive.tokenHash;
  await fixture.applyAuthContext({ role: 'service_role', claims: { sub: ids.users.parentAlpha, role: 'service_role' } });
  const childStart = await fixture.one(
    `select public.thinking_game_start($1,'main',$2,$3) result`, [session, day, command],
  );
  if (!childStart.result.ok || !childStart.result.data.puzzle) throw new Error('internal child start did not bind public puzzle');
  const wrongFinish = await fixture.one(`select public.thinking_game_finish_verified($1,$2,false,$3,$4) result`,
    [session, childStart.result.data.attemptId, JSON.stringify('wrong'), 'dddddddd-dddd-4ddd-8ddd-dddddddddddd']);
  if (wrongFinish.result.status !== 'retry') throw new Error('wrong answer retry regression');
  const correctFinish = await fixture.one(`select public.thinking_game_finish_verified($1,$2,true,$3,$4) result`,
    [session, childStart.result.data.attemptId, JSON.stringify('correct'), 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee']);
  if (correctFinish.result.status !== 'finished') throw new Error('correct answer finish regression');
  const parentStart = await fixture.one(
    `select public.thinking_game_parent_start_as($1,$2,'main',$3,$4) result`,
    [ids.users.parentBeta, ids.children.beta, day, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
  );
  if (!parentStart.result.ok || !parentStart.result.data.puzzle) throw new Error('internal parent start did not bind public puzzle');
  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentAlpha, role: 'authenticated' } });
  const anonAcl = await fixture.one(`select has_function_privilege('authenticated',
    'public.thinking_game_start(text,text,date,uuid)','execute') allowed`);
  if (anonAcl.allowed) throw new Error('authenticated direct start bypass remains');
  let productionDenied = false;
  try {
    await fixture.one(`select public.thinking_game_start($1,'main',$2,$3) result`,
      [ids.sessions.childBetaLive.tokenHash, day, 'ffffffff-ffff-4fff-8fff-ffffffffffff']);
  } catch (error) {
    productionDenied = /permission denied|content_unavailable|feature_off/.test(String(error.message));
  }
  if (!productionDenied) throw new Error('non-service profile admitted design-only catalog');

  await fixture.applyAuthContext({ role: 'service_role', claims: { sub: ids.users.parentAlpha, role: 'service_role' } });
  const retry = await fixture.one(`select public.thinking_game_start($1,'main',$2,$3) result`,
    [session, day, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc']);
  if (!retry.result.ok || retry.result.data.attemptId !== childStart.result.data.attemptId) throw new Error('deterministic restart lost pinned attempt');
  console.log(JSON.stringify({
    verdict: 'PASS', evidence: 'real-postgresql', profile: 'internal-pilot',
    cases: ['28-design-only-real-catalog-loaded', 'child-start-public-payload', 'parent-start-public-payload',
      'wrong-retry-correct-finish', 'direct-start-acl', 'same-attempt-restart'],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
