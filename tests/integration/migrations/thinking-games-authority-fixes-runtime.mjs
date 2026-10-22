import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-authority-fixes' });
const { identities: ids } = fixture;

// ---------------------------------------------------------------------------
// Timezone helper: pick an IANA zone where the DB clock's local time is in the
// awake window (07:00-20:00), i.e. outside the bedtime blackout (21:00-07:00).
// Uses the DB clock (now()) and real IANA zones; no hardcoded dates or client clocks.
// ---------------------------------------------------------------------------
const AWAKE_ZONES = [
  'Etc/GMT+12', 'Etc/GMT+11', 'Etc/GMT+10', 'Etc/GMT+9', 'Etc/GMT+8',
  'Etc/GMT+7', 'Etc/GMT+6', 'Etc/GMT+5', 'Etc/GMT+4', 'Etc/GMT+3',
  'Etc/GMT+2', 'Etc/GMT+1', 'Etc/GMT', 'Etc/GMT-1', 'Etc/GMT-2',
  'Etc/GMT-3', 'Etc/GMT-4', 'Etc/GMT-5', 'Etc/GMT-6', 'Etc/GMT-7',
  'Etc/GMT-8', 'Etc/GMT-9', 'Etc/GMT-10', 'Etc/GMT-11', 'Etc/GMT-12',
];

async function pickAwakeZone(db) {
  for (const zone of AWAKE_ZONES) {
    const { local_hour } = await db.one(
      `select extract(hour from now() at time zone $1)::int as local_hour`, [zone]);
    if (local_hour >= 7 && local_hour <= 20) return zone;
  }
  // Fallback (should never happen with 25 zones covering all 24 offsets):
  return 'UTC';
}

try {
  await fixture.exec(await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8'));
  await fixture.exec(`set thinking_games.content_version = 'release-365-v1'`);

  // Pick an awake timezone and derive the family-local day from the DB clock.
  const TZ = await pickAwakeZone(fixture);
  const { localDay: SERVER_DAY } = await fixture.familyClock(TZ);

  await fixture.query(`
    insert into public.thinking_game_settings
      (family_id, enabled, bonus_enabled, timezone, cutoff_local, bedtime_start_local, bedtime_end_local)
    values ($1, true, true, $2, '19:00', '21:00', '07:00')
    on conflict (family_id) do update set enabled=true, bonus_enabled=true, timezone=$2,
      effective_from_local_day=null, pending_settings=null, pending_effective_local_day=null
  `, [ids.families.alpha, TZ]);
  await fixture.query(`
    insert into public.thinking_game_content
      (id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id,
       status, checker_id, public_payload, grading_payload, fingerprint)
    values ('authority-golden-main', 'release-365-v1', 1, 'main', 'age_9_12', 'vi', 'g01-t1', 'v1',
      'approved', 'golden', '{"ageTrack":"age_9_12","golden":true}', '{"solution":"hidden"}', 'golden-main')
    on conflict (id) do nothing
  `);
  await fixture.query(`update public.child_profiles set birth_year=2017 where id=$1`, [ids.children.alpha]);
  const track = await fixture.scalar(`select public.thinking_game_resolve_age_track_for_child($1,$2)`,
    [ids.children.alpha, ids.families.alpha]);
  assert.equal(track, 'age_9_12');
  const started = await fixture.one(
    `select public.thinking_game_start($1, 'main', $2::date, gen_random_uuid()) result`,
    [ids.sessions.childAlphaLive.tokenHash, SERVER_DAY],
  );
  assert.equal(started.result.ok, true);
  assert.equal(started.result.data.puzzle.ageTrack, 'age_9_12');
  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', cases: ['age-track-payload', 'main-start'] }));
} finally {
  await fixture.close();
}
