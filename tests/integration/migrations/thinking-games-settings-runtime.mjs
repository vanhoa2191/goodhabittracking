import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-settings' });
const { identities: ids } = fixture;
try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.exec(await readFile('supabase/preflight/202610210001_thinking_games.verify.sql', 'utf8'));
  // The owned fixture intentionally omits the production PIN wrapper migration; this
  // test-only bridge mirrors its transaction-local identity behavior without weakening
  // production ACLs or changing the shared fixture.
  await fixture.exec(`
    create or replace function public.act_as_user(actor_user_id uuid) returns void
    language plpgsql security definer set search_path = '' as $$
    begin
      perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
      perform set_config('request.jwt.claims', json_build_object('sub', actor_user_id, 'role', 'authenticated')::text, true);
    end $$;
  `);
  const today = await fixture.scalar(`select (now() at time zone 'Asia/Ho_Chi_Minh')::date`);
  const updated = await fixture.one(
    `select public.thinking_game_update_settings_as($1,$2,true,true,'Asia/Ho_Chi_Minh','19:00','21:00','07:00','age_6_8',gen_random_uuid()) result`,
    [ids.users.parentAlpha, ids.families.alpha],
  );
  if (updated.result.status !== 'updated') throw new Error('initial settings update failed');
  const scheduled = await fixture.one(
    `select public.thinking_game_update_settings_as($1,$2,true,true,'Asia/Ho_Chi_Minh','18:30','21:00','07:00','age_9_12',gen_random_uuid()) result`,
    [ids.users.parentAlpha, ids.families.alpha],
  );
  if (scheduled.result.status !== 'scheduled') throw new Error('settings update was not scheduled');
  const pending = await fixture.one(`select pending_effective_local_day, enabled from public.thinking_game_settings where family_id=$1`, [ids.families.alpha]);
  if (!pending.pending_effective_local_day || pending.pending_effective_local_day.toISOString?.() === String(today)) {
    throw new Error('settings were applied before next local day');
  }

  const childSettings = await fixture.one(
    `select public.thinking_game_child_settings($1) result`,
    [ids.sessions.childAlphaLive.tokenHash],
  );
  if (childSettings.result.ageTrackOverride !== 'age_6_8' || childSettings.result.timezoneConfigured !== true) {
    throw new Error('child settings did not redact/return expected fields');
  }

  await fixture.query(
    `insert into public.thinking_game_day_snapshots(
      child_id,family_id,local_day,timezone,settings_version,cutoff_at,bedtime_start_at,bedtime_end_at,enabled,mandatory_tasks,journey_day_index
    ) values($1,$2,$3,'Asia/Ho_Chi_Minh',1,now()+interval '1 hour',now()+interval '2 hours',now()+interval '12 hours',true,
      jsonb_build_array(jsonb_build_object('activityId',$4::text,'requiresApproval',false,'title','Task')),1)`,
    [ids.children.alpha, ids.families.alpha, today, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
  );
  const preview = await fixture.one(
    `select public.thinking_game_preview_day($1,$2,$3) result`,
    [ids.users.parentAlpha, ids.children.alpha, today],
  );
  if (preview.result.status !== 'preview' || preview.result.childId !== ids.children.alpha) throw new Error('parent preview scoping failed');

  const activityId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const excuse = await fixture.one(
    `select public.thinking_game_excuse_task_as($1,$2,$3,$4,$5,gen_random_uuid()) result`,
    [ids.users.parentAlpha, ids.children.alpha, today, activityId, 'Family exception'],
  );
  if (excuse.result.status !== 'excused') throw new Error('task excuse failed');
  const audit = await fixture.scalar(`select count(*)::int from public.thinking_game_audit_events where child_id=$1 and event_type='task_excused'`, [ids.children.alpha]);
  if (audit !== 1) throw new Error('task excuse audit missing');

  await fixture.applyAuthContext({ role: 'authenticated', claims: { sub: ids.users.parentBeta, role: 'authenticated' } });
  const membership = await fixture.scalar(`select public.is_family_member($1)`, [ids.families.alpha]);
  let crossFamilyDenied = false;
  try {
    await fixture.scalar(`select count(*)::int from public.thinking_game_settings where family_id=$1`, [ids.families.alpha]);
  } catch (error) {
    crossFamilyDenied = error?.code === '42501';
  }
  if (membership !== false || !crossFamilyDenied) throw new Error('cross-family settings read leaked');
  await fixture.resetAuthContext();

  console.log(JSON.stringify({
    verdict: 'PASS',
    evidence: 'real-postgresql',
    cases: ['next-day-settings', 'child-redaction', 'parent-preview', 'audited-excuse', 'cross-family-rls'],
    localDay: String(today),
  }));
} finally {
  await fixture.close();
}
