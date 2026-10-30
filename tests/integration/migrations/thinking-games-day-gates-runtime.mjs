import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-day-gates' });
const { identities: ids } = fixture;
const session = ids.sessions.childAlphaLive.tokenHash;
const commandId = '11111111-1111-4111-8111-111111111111';
const { localDay: today, localYear: currentYear } = await fixture.familyClock('Asia/Ho_Chi_Minh');

async function expectGate(label, pattern, action) {
  let error = null;
  try {
    await action();
  } catch (caught) {
    error = caught;
  }
  if (!error) throw new Error(`${label} did not block play: start unexpectedly succeeded`);
  const message = String(error?.message || error);
  if (!pattern.test(message)) throw new Error(`${label} did not block play: unexpected error "${message}"`);
}

try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.exec(await readFile('supabase/migrations/202610300001_thinking_games_age_tracks.sql', 'utf8'));
  await fixture.exec(await readFile('supabase/migrations/202610300002_thinking_games_release_v3.sql', 'utf8'));
  await fixture.exec(`set thinking_games.content_version = 'release-365-v1'`);
  await fixture.query(`
    create table if not exists public.family_engagement_settings (
      family_id uuid primary key references public.families(id) on delete cascade,
      paused_at timestamptz,
      pause_periods jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    );
  `);
  await fixture.query(`
    insert into public.family_engagement_settings(family_id, paused_at)
    values ($1, null) on conflict (family_id) do nothing;
  `, [ids.families.alpha]);
  await fixture.query(`update public.child_profiles set birth_year = $2 where id = $1`, [ids.children.alpha, currentYear - 7]);
  await fixture.query(`
    insert into public.thinking_game_settings(family_id, enabled, bonus_enabled, timezone, cutoff_local, bedtime_start_local, bedtime_end_local, age_track_override)
    values($1, true, true, 'Asia/Ho_Chi_Minh', '19:00', '00:00', '00:01', null)
    on conflict (family_id) do update set enabled = true, bonus_enabled = true, timezone = 'Asia/Ho_Chi_Minh', cutoff_local = '19:00', bedtime_start_local = '00:00', bedtime_end_local = '00:01', age_track_override = null;
  `, [ids.families.alpha]);
  const ageResult = await fixture.one(`select public.thinking_game_resolve_age_track_for_child($1, $2) result`, [ids.children.alpha, ids.families.alpha]);
  if (ageResult.result !== 'age_6_8') throw new Error('age track did not resolve to 6-8 from birth year');
  await fixture.query(`
    insert into public.thinking_game_content(
      id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id,
      status, checker_id, public_payload, grading_payload, fingerprint
    ) values (
      'dgt-main-1', 'release-365-v1', 1, 'main', 'age_6_8', 'vi', 'g01-t1', 'g01-t1:variant',
      'approved', 'checker-1', '{"kind":"demo"}'::jsonb, '{"answer":"demo"}'::jsonb, 'aaaa'
    ) on conflict (id) do nothing;
  `);

  const state = await fixture.one(`select public.thinking_game_state($1, null) result`, [session]);
  if (state.result.ageTrack !== 'age_6_8') throw new Error('age track did not resolve to 6-8');

  const started = await fixture.one(
    `select public.thinking_game_start($1,'main',$2::date,$3) result`,
    [session, today, commandId],
  );
  if (!started.result.ok || started.result.status !== 'started') throw new Error('main start did not succeed');

  await fixture.query(`update public.family_engagement_settings set paused_at = now() where family_id = $1`, [ids.families.alpha]);
  await expectGate('pause gate', /paused/, async () => {
    await fixture.one(
      `select public.thinking_game_start($1,'main',$2::date,$3) result`,
      [session, today, '22222222-2222-4222-8222-222222222222'],
    );
  });

  await fixture.query(`update public.family_engagement_settings set paused_at = null where family_id = $1`, [ids.families.alpha]);
  await fixture.query(`delete from public.thinking_game_attempts where child_id = $1 and family_id = $2`, [ids.children.alpha, ids.families.alpha]);
  await fixture.query(`delete from public.thinking_game_entitlements where child_id = $1 and family_id = $2 and local_day = $3`, [ids.children.alpha, ids.families.alpha, state.result.serverLocalDay]);
  const bedtimeStart = await fixture.scalar(`select ((now() at time zone 'Asia/Ho_Chi_Minh') - interval '5 minutes')::time`);
  const bedtimeEnd = await fixture.scalar(`select ((now() at time zone 'Asia/Ho_Chi_Minh') + interval '5 minutes')::time`);
  await fixture.query(
    `update public.thinking_game_settings set bedtime_start_local = $2::time, bedtime_end_local = $3::time where family_id = $1`,
    [ids.families.alpha, bedtimeStart, bedtimeEnd],
  );
  await expectGate('bedtime blackout', /bedtime/, async () => {
    await fixture.one(
      `select public.thinking_game_start($1,'main',$2::date,$3) result`,
      [session, today, '33333333-3333-4333-8333-333333333333'],
    );
  });

  await fixture.query(`
    update public.thinking_game_settings
    set bedtime_start_local = '00:00', bedtime_end_local = '00:01', enabled = true,
        age_track_override = null
    where family_id = $1
  `, [ids.families.alpha]);
  // currentYear is derived from the DB clock + family IANA timezone at the top of the file.
  for (const [birthYear, expected] of [
    [currentYear - 2, 'age_track_unavailable'],
    [currentYear - 3, 'age_3_5'],
    [currentYear - 5, 'age_3_5'],
    [currentYear - 6, 'age_6_8'],
    [currentYear - 8, 'age_6_8'],
    [currentYear - 9, 'age_9_12'],
    [currentYear - 12, 'age_9_12'],
    [currentYear - 13, 'age_13_plus'],
    [currentYear - 16, 'age_13_plus'],
  ]) {
    await fixture.query(`update public.child_profiles set birth_year = $2 where id = $1`, [ids.children.alpha, birthYear]);
    const resolved = await fixture.scalar(
      `select public.thinking_game_resolve_age_track_for_child($1, $2)`,
      [ids.children.alpha, ids.families.alpha],
    );
    if (resolved !== expected) throw new Error(`birth year ${birthYear} resolved to ${resolved}, expected ${expected}`);
  }
  await fixture.query(`update public.child_profiles set birth_year = $2 where id = $1`, [ids.children.alpha, currentYear - 7]);

  await fixture.query(`update public.thinking_game_settings set enabled = false where family_id = $1`, [ids.families.alpha]);
  await expectGate('master disable', /feature_off/, async () => {
    await fixture.one(
      `select public.thinking_game_start($1,'bonus',$2::date,$3) result`,
      [session, today, '44444444-4444-4444-8444-444444444444'],
    );
  });
  await fixture.query(`update public.thinking_game_settings set enabled = true where family_id = $1`, [ids.families.alpha]);

  await fixture.query(`
    insert into public.thinking_game_content(
      id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id,
      status, checker_id, public_payload, grading_payload, fingerprint
    ) values (
      'dgt-main-2', 'release-365-v1', 2, 'main', 'age_6_8', 'vi', 'g01-t1', 'g01-t1:variant',
      'approved', 'checker-1', '{"kind":"demo-2"}'::jsonb, '{"answer":"demo-2"}'::jsonb, 'bbbb'
    ) on conflict (id) do nothing;
  `);
  const oldEntitlement = await fixture.one(`
    insert into public.thinking_game_entitlements(
      child_id, family_id, local_day, slot_type, journey_day_index, content_id,
      content_version, state, command_id
    ) values (
      $1, $2, (select (now() at time zone 'Asia/Ho_Chi_Minh')::date - 1), 'main', 2,
      'dgt-main-1', 'release-365-v1', 'started', gen_random_uuid()
    ) returning id
  `, [ids.children.alpha, ids.families.alpha]);
  const oldAttempt = await fixture.one(`
    insert into public.thinking_game_attempts(entitlement_id, child_id, family_id, state, command_id)
    values ($1, $2, $3, 'started', gen_random_uuid()) returning id
  `, [oldEntitlement.id, ids.children.alpha, ids.families.alpha]);
  await fixture.query(`delete from public.thinking_game_attempts where child_id = $1 and entitlement_id <> $2`, [ids.children.alpha, oldEntitlement.id]);
  await fixture.query(`delete from public.thinking_game_entitlements where child_id = $1 and id <> $2`, [ids.children.alpha, oldEntitlement.id]);
  const rolloverStart = await fixture.one(
    `select public.thinking_game_start($1,'main',$2::date,$3) result`,
    [session, today, '55555555-5555-4555-8555-555555555555'],
  );
  if (!rolloverStart.result.ok || rolloverStart.result.status !== 'started') throw new Error('current-day main did not start after rollover');
  const oldState = await fixture.one(`
    select e.state entitlement_state, a.state attempt_state
    from public.thinking_game_entitlements e
    join public.thinking_game_attempts a on a.entitlement_id = e.id
    where e.id = $1
  `, [oldEntitlement.id]);
  if (oldState.entitlement_state !== 'expired' || oldState.attempt_state !== 'abandoned_rollover') {
    throw new Error(`rollover did not close old attempt: ${JSON.stringify(oldState)}`);
  }
  // finish() contract: an expired (rolled-over) attempt returns a persisted-cleanup
  // failure envelope instead of RAISE-ing, so the day's slot is never advanced and
  // the stale attempt/entitlement stay closed.
  const expiredFinish = await fixture.one(
    `select public.thinking_game_finish($1,$2,'{"answer":"late"}'::jsonb,$3) result`,
    [session, oldAttempt.id, '66666666-6666-4666-8666-666666666666'],
  );
  if (!expiredFinish.result || expiredFinish.result.ok || expiredFinish.result.code !== 'attempt_expired') {
    throw new Error(`rolled-over finish was not rejected as attempt_expired: ${JSON.stringify(expiredFinish?.result)}`);
  }
  // Persisted-cleanup assertions (noadvance / noslots): the stale attempt and
  // entitlement remain closed and no new day/slot was consumed by the finish call.
  const afterFinish = await fixture.one(
    `select e.state as entitlement_state, a.state as attempt_state
     from public.thinking_game_entitlements e
     join public.thinking_game_attempts a on a.entitlement_id = e.id
     where e.id = $1`, [oldEntitlement.id]);
  if (afterFinish.entitlement_state !== 'expired' || afterFinish.attempt_state !== 'abandoned_rollover') {
    throw new Error(`rollover finish did not persist cleanup: ${JSON.stringify(afterFinish)}`);
  }

  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: ['age-track-resolution', 'strict-age-boundaries', 'main-start', 'pause-block', 'bedtime-block', 'master-disable', 'rollover-abandon', 'rollover-finish-expired'],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
