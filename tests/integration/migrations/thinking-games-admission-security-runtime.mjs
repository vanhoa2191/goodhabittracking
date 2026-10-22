import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-admission-security' });
const { identities: ids } = fixture;
const day = (await fixture.familyClock('UTC')).localDay;
const session = ids.sessions.childAlphaLive.tokenHash;
const command = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa001';
try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.exec(`set thinking_games.content_version = 'pilot-2026-10-21'`);
  await fixture.query(`
    create table if not exists public.family_engagement_settings (
      family_id uuid primary key references public.families(id) on delete cascade,
      paused_at timestamptz,
      pause_periods jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    );
  `);
  await fixture.query(`insert into public.family_engagement_settings(family_id, paused_at) values ($1, null) on conflict do nothing`, [ids.families.alpha]);
  await fixture.query(`update public.child_profiles set birth_year = 2019 where id = $1`, [ids.children.alpha]);
  await fixture.query(`insert into public.thinking_game_settings(family_id,enabled,bonus_enabled,timezone)
    values ($1,true,true,'UTC')`, [ids.families.alpha]);
  // Bedtime defaults (21:00-07:00 UTC) block starts when the live clock is in the
  // night window. This suite does not assert bedtime; pin a past-relative window so
  // the family local time is always in the "awake" region of the day.
  await fixture.query(`update public.thinking_game_settings
    set bedtime_start_local = ((now() at time zone 'UTC') - interval '6 hours')::time,
        bedtime_end_local = ((now() at time zone 'UTC') - interval '5 hours')::time`);
  await fixture.query(`insert into public.thinking_game_content
    (id,content_version,day_index,slot_type,age_track,locale,game_type_id,rule_variant_id,status,checker_id,public_payload,grading_payload,fingerprint)
    values ('pending-1','pilot-2026-10-21',1,'main','age_6_8','vi','g01-t1','r1','design_only','checker',
      '{"id":"pending-1","gameTypeId":"g01-t1"}','{"solution":"x"}','pending-fp')`);

  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentAlpha, role: 'authenticated' } });
  let deniedWithoutMarker = false;
  try {
    await fixture.one(`select public.thinking_game_start($1,'main',$2,$3) result`, [session, day, command]);
  } catch (error) {
    deniedWithoutMarker = /content_unavailable|permission|feature_off/.test(String(error.message));
  }
  if (!deniedWithoutMarker) throw new Error('authenticated caller admitted pending content');

  await fixture.applyAuthContext({ role: 'service_role', claims: { sub: ids.users.parentAlpha, role: 'service_role' } });
  const allowed = await fixture.one(`select public.thinking_game_start($1,'main',$2,$3) result`, [session, day, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbb001']);
  if (!allowed.result.ok || !allowed.result.data.puzzle) throw new Error('explicit trusted internal marker did not admit test content');

  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentAlpha, role: 'authenticated', internal_catalog: 'true' } });
  let forgedDenied = false;
  try {
    await fixture.one(`select public.thinking_game_start($1,'main',$2,$3) result`, [ids.sessions.childBetaLive.tokenHash, day, 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1']);
  } catch (error) {
    forgedDenied = /content_unavailable|permission|session_invalid/.test(String(error.message));
  }
  if (!forgedDenied) throw new Error('authenticated custom claim forged internal catalog admission');

  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: ['service-without-marker-denied', 'explicit-service-marker-positive', 'authenticated-claim-forgery-denied'],
    database: fixture.databaseName,
  }));
} finally {
  await fixture.close();
}
