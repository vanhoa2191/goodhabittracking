import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-enable-immediately' });
const { identities: ids } = fixture;
const session = ids.sessions.childAlphaLive.tokenHash;
const { localDay: today, localYear: currentYear } = await fixture.familyClock('Asia/Ho_Chi_Minh');

const update = (enabled, cutoff = '19:00') => fixture.one(
  `select public.thinking_game_update_settings_as($1,$2,$3,false,'Asia/Ho_Chi_Minh',$4,'00:00','00:01',null,gen_random_uuid()) result`,
  [ids.users.parentAlpha, ids.families.alpha, enabled, cutoff],
);
async function startError() {
  try {
    await fixture.one(`select public.thinking_game_start($1,'main',$2::date,gen_random_uuid()) result`, [session, today]);
    return null;
  } catch (error) { return String(error?.message || error); }
}

try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.exec(await readFile('supabase/migrations/202610300001_thinking_games_age_tracks.sql', 'utf8'));
  await fixture.exec(await readFile('supabase/migrations/202610300002_thinking_games_release_v3.sql', 'utf8'));
  const migration = await readFile('supabase/migrations/202611010001_thinking_games_enable_immediately.sql', 'utf8');
  await fixture.exec(migration);
  await fixture.exec(await readFile('supabase/migrations/202611010001_thinking_games_enable_immediately.sql', 'utf8')); // replay is harmless
  await fixture.exec(`
    create or replace function public.act_as_user(actor_user_id uuid) returns void
    language plpgsql security definer set search_path = '' as $$
    begin
      perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
      perform set_config('request.jwt.claims', json_build_object('sub', actor_user_id, 'role', 'authenticated')::text, true);
    end $$;
    create table if not exists public.family_engagement_settings (
      family_id uuid primary key references public.families(id) on delete cascade,
      paused_at timestamptz, pause_periods jsonb not null default '[]'::jsonb, updated_at timestamptz not null default now()
    );
  `);
  await fixture.query(`update public.child_profiles set birth_year = $2 where id = $1`, [ids.children.alpha, currentYear - 7]);

  // 1. First enablement is playable the same day: the day gate no longer answers feature_off.
  const first = await update(true);
  if (first.result.status !== 'updated') throw new Error(`first enable returned ${first.result.status}`);
  let error = await startError();
  if (error && /feature_off/.test(error)) throw new Error('first enablement was still held back by the first-day gate');

  // 2. Disabling is immediate and blocks play.
  const disabled = await update(false);
  if (disabled.result.status !== 'disabled') throw new Error(`disable returned ${disabled.result.status}`);
  error = await startError();
  if (!error || !/feature_off/.test(error)) throw new Error('disabled family could still start a game');

  // 3. Switching back on is immediate too, not scheduled for tomorrow.
  const reenabled = await update(true);
  if (reenabled.result.status !== 'updated') throw new Error(`re-enable returned ${reenabled.result.status}`);
  const row = await fixture.one(`select enabled, pending_settings, effective_from_local_day::text as day from public.thinking_game_settings where family_id=$1`, [ids.families.alpha]);
  if (!row.enabled || row.pending_settings !== null || row.day !== String(today)) throw new Error('re-enable did not apply immediately');
  error = await startError();
  if (error && /feature_off/.test(error)) throw new Error('re-enabled family still blocked');

  // 4. Changing an already enabled configuration still waits for the next local day.
  const changed = await update(true, '18:00');
  if (changed.result.status !== 'scheduled') throw new Error(`change of an enabled config returned ${changed.result.status}`);

  // 5. The data fix releases a family stuck behind the first-day gate and leaves others alone.
  await fixture.query(`update public.thinking_game_settings set pending_settings = null, pending_effective_local_day = null,
    settings_version = 1, enabled = true, effective_from_local_day = (now() at time zone timezone)::date where family_id = $1`, [ids.families.alpha]);
  await fixture.exec(migration);
  const released = await fixture.scalar(`select (effective_from_local_day < (now() at time zone timezone)::date) from public.thinking_game_settings where family_id=$1`, [ids.families.alpha]);
  if (released !== true) throw new Error('data fix did not release the family held by the first-day gate');

  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', database: fixture.databaseName }));
} finally {
  await fixture.close();
}
