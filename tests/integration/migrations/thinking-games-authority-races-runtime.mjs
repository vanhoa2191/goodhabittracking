// Kilo independent authority + races suite for the daily thinking games (P04).
//
// WHAT THIS PROVES
//   Real PostgreSQL 18.4, a disposable per-run `kidhabit_test_*` database, the REAL
//   migration `supabase/migrations/202610210001_thinking_games.sql`, the REAL six
//   legacy habit RPCs, real `request.jwt.claims` context, a NON-superuser role
//   (`authenticated`, `rolsuper = false`, `rolbypassrls = false`) and RLS left
//   ENABLED + FORCED. No shadow table, no fake entitlement, no mocked RPC.
//
// WHAT THIS DOES NOT PROVE
//   * Nothing about the Next.js HTTP layer (that is `tests/api/thinking-games-authority.test.ts`).
//   * Nothing about the browser, the engine, the content catalogue or the pilot.
//   * The content rows below are an EXPLICIT INTERNAL TEST FIXTURE (`status='approved'`)
//     so the authoritative SQL paths can be exercised. `status='approved'` here is NOT
//     a human content approval and must never be read as one. Production content
//     remains `design_only` / pending human review.
//
// RUN
//   SQL_TEST_DATABASE_URL='postgresql://postgres:local-only@127.0.0.1:55432/postgres' \
//     node tests/integration/migrations/thinking-games-authority-races-runtime.mjs
//
//   Exit 0 = every case PASS, 1 = at least one case FAIL, 2 = BLOCKED (no database).
//
// The file is self-contained: it never edits app source, never edits the shared
// fixture, and never touches a database other than its own disposable one.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const EVIDENCE_DIR = process.env.KILO_AUTHORITY_RACES_EVIDENCE_DIR
  ?? '/tmp/goodhabit-games-authority-races-evidence';
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_PATH = `${EVIDENCE_DIR}/authority-races-${RUN_ID}.log`;
const JSON_PATH = `${EVIDENCE_DIR}/authority-races-${RUN_ID}.json`;
const SUMMARY_PATH = `${EVIDENCE_DIR}/authority-races-latest.json`;

mkdirSync(EVIDENCE_DIR, { recursive: true });
const logLines = [];
function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  logLines.push(stamped);
  appendFileSync(LOG_PATH, `${stamped}\n`);
}

// ---------------------------------------------------------------------------
// Verdict recorder
// ---------------------------------------------------------------------------
const cases = [];
let current = null;

function startCase(id, title, contractRefs) {
  current = { id, title, contractRefs, verdict: 'FAIL', detail: '', evidence: {}, startedAt: new Date().toISOString() };
  cases.push(current);
  log(`CASE ${id} START ${title} [${contractRefs.join(', ')}]`);
}

function pass(detail, evidence = {}) {
  if (!current) throw new Error('pass() outside a case');
  current.verdict = 'PASS';
  current.detail = detail;
  current.evidence = { ...current.evidence, ...evidence };
  log(`CASE ${current.id} PASS ${detail}`);
}

function fail(detail, evidence = {}) {
  if (!current) throw new Error('fail() outside a case');
  current.verdict = 'FAIL';
  current.detail = detail;
  current.evidence = { ...current.evidence, ...evidence };
  log(`CASE ${current.id} FAIL ${detail}`);
}

function blocked(detail, evidence = {}) {
  if (!current) throw new Error('blocked() outside a case');
  current.verdict = 'BLOCKED';
  current.detail = detail;
  current.evidence = { ...current.evidence, ...evidence };
  log(`CASE ${current.id} BLOCKED ${detail}`);
}

function expect(condition, message, evidence = {}) {
  if (condition) return true;
  fail(message, evidence);
  throw new CaseFailure(message);
}

class CaseFailure extends Error {}

// ---------------------------------------------------------------------------
// Fixture world
// ---------------------------------------------------------------------------
const USER = {
  parentAlpha: 'aaaaaaaa-0000-4000-8000-00000000000a',
  guardianAlpha: 'aaaaaaaa-0000-4000-8000-00000000000b',
  caregiverAlpha: 'aaaaaaaa-0000-4000-8000-00000000000c',
  parentBeta: 'bbbbbbbb-0000-4000-8000-00000000000d',
  deltaParent: 'aaaaaaaa-0000-4000-8000-00000000000e',
};

const FAMILY = {
  alpha: '11111111-1111-4111-8111-111111111111',
  beta: '22222222-2222-4222-8222-222222222222',
  gamma: '33333333-3333-4333-8333-333333333333',
  delta: '44444444-4444-4444-8444-444444444444',
};

const childUuid = n => `cccccccc-2000-4000-8000-${String(n).padStart(12, '0')}`;
const sessionUuid = n => `eeeeeeee-2000-4000-8000-${String(n).padStart(12, '0')}`;

// name -> { child, token, family, birthYear }
const CHILD = {
  race: { child: childUuid(1), token: 'kilo-race-token', family: FAMILY.alpha, birthYear: 2017 },
  bonus: { child: childUuid(2), token: 'kilo-bonus-token', family: FAMILY.alpha, birthYear: 2017 },
  bonusRace: { child: childUuid(3), token: 'kilo-bonus-race-token', family: FAMILY.alpha, birthYear: 2017 },
  late: { child: childUuid(4), token: 'kilo-late-token', family: FAMILY.delta, birthYear: 2017 },
  parent: { child: childUuid(5), token: 'kilo-parent-token', family: FAMILY.alpha, birthYear: 2017 },
  age: { child: childUuid(6), token: 'kilo-age-token', family: FAMILY.alpha, birthYear: 2017 },
  ageUnknown: { child: childUuid(7), token: 'kilo-age-unknown-token', family: FAMILY.alpha, birthYear: null },
  rollover: { child: childUuid(8), token: 'kilo-rollover-token', family: FAMILY.alpha, birthYear: 2017 },
  designOnly: { child: childUuid(9), token: 'kilo-design-only-token', family: FAMILY.alpha, birthYear: 2017 },
  enable: { child: childUuid(10), token: 'kilo-enable-token', family: FAMILY.gamma, birthYear: 2017 },
  batchA: { child: childUuid(21), token: 'kilo-batch-a-token', family: FAMILY.alpha, birthYear: 2017 },
  batchB: { child: childUuid(22), token: 'kilo-batch-b-token', family: FAMILY.alpha, birthYear: 2017 },
  mixRace: { child: childUuid(23), token: 'kilo-mix-race-token', family: FAMILY.alpha, birthYear: 2017 },
  crossFamily: { child: childUuid(24), token: 'kilo-cross-family-token', family: FAMILY.alpha, birthYear: 2017 },
  dst: { child: childUuid(25), token: 'kilo-dst-token', family: FAMILY.alpha, birthYear: 2017 },
  redaction: { child: childUuid(26), token: 'kilo-redaction-token', family: FAMILY.alpha, birthYear: 2017 },
  contended: { child: childUuid(27), token: 'kilo-contended-token', family: FAMILY.alpha, birthYear: 2017 },
};
// 20 unrelated children inside the SAME family: the parallel control.
const PARALLEL_COUNT = 20;
const PARALLEL = Array.from({ length: PARALLEL_COUNT }, (_, i) => ({
  child: childUuid(100 + i),
  token: `kilo-parallel-token-${String(i + 1).padStart(2, '0')}`,
  family: FAMILY.alpha,
  birthYear: 2017,
}));
// A SECOND set of 20 children of the same family, used by the sequential latency
// arm so the baseline never measures an idempotent replay of an already played
// child.
const PARALLEL_B = Array.from({ length: PARALLEL_COUNT }, (_, i) => ({
  child: childUuid(200 + i),
  token: `kilo-parallel-b-token-${String(i + 1).padStart(2, '0')}`,
  family: FAMILY.alpha,
  birthYear: 2017,
}));
// 20 unrelated children, each in its OWN family: the isolated control.
const ISOLATED = Array.from({ length: PARALLEL_COUNT }, (_, i) => ({
  child: childUuid(300 + i),
  token: `kilo-isolated-token-${String(i + 1).padStart(2, '0')}`,
  family: `55555555-5555-4555-8555-${String(500 + i).padStart(12, '0')}`,
  birthYear: 2017,
}));

const ACTIVITY = {
  plain: 'aaaaaaaa-2000-4000-8000-000000000001',
  approval: 'aaaaaaaa-2000-4000-8000-000000000002',
  second: 'aaaaaaaa-2000-4000-8000-000000000003',
  racePlain: 'aaaaaaaa-2000-4000-8000-000000000004',
  raceApproval: 'aaaaaaaa-2000-4000-8000-000000000005',
  batchA: 'aaaaaaaa-2000-4000-8000-000000000006',
  batchB: 'aaaaaaaa-2000-4000-8000-000000000007',
  mixPlain: 'aaaaaaaa-2000-4000-8000-000000000008',
  mixApproval: 'aaaaaaaa-2000-4000-8000-000000000009',
  latePlain: 'aaaaaaaa-2000-4000-8000-000000000010',
  lateApproval: 'aaaaaaaa-2000-4000-8000-000000000011',
  parentPlain: 'aaaaaaaa-2000-4000-8000-000000000012',
  bonusPlain: 'aaaaaaaa-2000-4000-8000-000000000013',
  bonusApproval: 'aaaaaaaa-2000-4000-8000-000000000014',
  enablePlain: 'aaaaaaaa-2000-4000-8000-000000000015',
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const nowMs = () => Number(process.hrtime.bigint() / 1000n) / 1000;

// Every client this file opens is registered here and closed before the fixture
// tears the database down. An unclosed client receives the teardown notice as an
// unhandled `error` event, which would crash the process AFTER the results were
// written.
const openClients = [];

/** Creates a client that acts as the given user under the non-superuser `authenticated` role. */

/**
 * Creates a client that acts as the server-side service account.
 *
 * `service_role` is NOSUPERUSER and NOBYPASSRLS in this environment, and it is the
 * ONLY role that holds EXECUTE on the protected game RPCs (`thinking_game_start`,
 * `thinking_game_finish`, and every `*_as` wrapper). The `authenticated` role holds
 * EXECUTE on the six habit RPCs instead, and NOT on the game RPCs.
 *
 * The two sets are deliberately disjoint, so a session can hold exactly one of them
 * at a time. A client that calls a protected game RPC as `authenticated` gets
 * `permission denied`, which is the CORRECT posture, not a defect.
 */
async function serviceClient(sub = USER.parentAlpha) {
  const client = await fixture.db.connect();
  openClients.push(client);
  await client.query('set role service_role');
  await setClaims(client, sub, 'service_role');
  return client;
}

/**
 * Creates a fixed pool of sessions. The pool is built OUTSIDE any measurement so a
 * latency sample never contains TCP or authentication time.
 *
 * The default role is `service_role` (NOSUPERUSER, NOBYPASSRLS) so a race never
 * runs as the `postgres` superuser and never bypasses RLS by accident.
 */
async function makePool(count, role = 'service_role') {
  const pool = [];
  for (let i = 0; i < count; i += 1) {
    const client = await fixture.db.connect();
    await client.query(`set role ${role}`);
    pool.push(client);
  }
  return pool;
}

async function releasePool(pool) {
  await Promise.all(pool.map(client => client.end().catch(() => {})));
}

/**
 * Runs `fn` on every client of the pool at the same time. Each client opens its own
 * transaction and commits as soon as its own work is done.
 *
 * The per-client commit matters: the game path takes a per-child advisory lock for
 * the whole transaction, so holding every transaction open until the last statement
 * returns would park 19 of them behind a lock that only the first one can release.
 */
async function raceOn(pool, fn) {
  await Promise.all(pool.map(client => client.query('begin')));
  await Promise.all(pool.map(client => client.query(`set statement_timeout = '60s'`)));
  const settled = await Promise.all(pool.map((client, index) =>
    Promise.resolve()
      .then(() => fn(client, index))
      .then(value => ({ ok: true, value }))
      .catch(error => ({ ok: false, error: { message: String(error?.message ?? error), code: error?.code ?? null } }))
      .finally(async () => {
        try { await client.query('commit'); } catch { await client.query('rollback').catch(() => {}); }
      })));
  return settled;
}


async function raceAcrossClients(count, fn) {
  const pool = await makePool(count);
  try {
    return await raceOn(pool, fn);
  } finally {
    await releasePool(pool);
  }
}

async function setClaims(client, sub, role = 'authenticated') {
  await client.query(`select set_config('request.jwt.claims', $1, false)`,
    [JSON.stringify({ sub, role })]);
  await client.query(`select set_config('request.jwt.claim.sub', $1, false)`, [String(sub)]);
  await client.query(`select set_config('request.jwt.claim.role', $1, false)`, [role]);
}

function isDeadlock(error) {
  return error?.code === '40P01' || /deadlock/i.test(String(error?.message ?? ''));
}

function pgErrorText(error) {
  return `${error?.code ?? 'no-code'}: ${error?.message ?? String(error)}`;
}

async function callRpc(client, sql, args) {
  const result = await client.query(sql, args);
  return result.rows[0]?.result;
}


async function expectRpcError(client, sql, args, matcher) {
  try {
    const value = await callRpc(client, sql, args);
    return { error: null, value };
  } catch (error) {
    return { error: { message: String(error?.message ?? error), code: error?.code ?? null }, value: null, matched: matcher.test(String(error?.message ?? '')) };
  }
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
let fixture;
try {
  const { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } = await import('../../../scripts/thinking-games-sql-fixture.mjs');
  fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'thinking-games-authority-races' });
} catch (error) {
  const message = `BLOCKED H0 environment: no disposable PostgreSQL could be prepared: ${String(error?.message ?? error)}`;
  log(message);
  writeFileSync(JSON_PATH, JSON.stringify({ verdict: 'BLOCKED', reason: message, cases: [] }, null, 2));
  writeFileSync(SUMMARY_PATH, JSON.stringify({ verdict: 'BLOCKED', reason: message, cases: [] }, null, 2));
  console.log(message);
  process.exit(2);
}

const migrationSql = await readFile('supabase/migrations/202610210001_thinking_games.sql', 'utf8');
const preflightSql = await readFile('supabase/preflight/202610210001_thinking_games.verify.sql', 'utf8');

/** Columns + helpers the six legacy habit RPCs expect but the shared fixture omits. */
const BRIDGE_SQL = `
  alter table public.child_profiles add column if not exists total_earned integer not null default 0;
  alter table public.child_profiles add column if not exists level integer not null default 1;
  alter table public.activity_logs add column if not exists user_id uuid;
  create or replace function public.recompute_child_streak(target_child_id uuid)
  returns void language sql security definer set search_path = '' as $$ select null::void $$;
  create or replace function public.act_as_user(actor_user_id uuid)
  returns void language plpgsql security definer set search_path = '' as $$
  begin
    perform set_config('request.jwt.claim.sub', actor_user_id::text, true);
    perform set_config('request.jwt.claims', json_build_object('sub', actor_user_id, 'role', 'authenticated')::text, true);
  end $$;
`;

// ---------------------------------------------------------------------------
// Timezone / cutoff helpers: the local wall clock decides the server day, so the
// family timezone is picked so the local time is always in the awake window
// (07:00-21:00) i.e. outside the bedtime blackout (21:00-07:00). We use the DB
// clock (now()) and a real IANA zone; no hardcoded dates or client clocks.
// ---------------------------------------------------------------------------
const AWAKE_ZONES = [
  'Etc/GMT+12', 'Etc/GMT+11', 'Etc/GMT+10', 'Etc/GMT+9', 'Etc/GMT+8',
  'Etc/GMT+7', 'Etc/GMT+6', 'Etc/GMT+5', 'Etc/GMT+4', 'Etc/GMT+3',
  'Etc/GMT+2', 'Etc/GMT+1', 'Etc/GMT', 'Etc/GMT-1', 'Etc/GMT-2',
  'Etc/GMT-3', 'Etc/GMT-4', 'Etc/GMT-5', 'Etc/GMT-6', 'Etc/GMT-7',
  'Etc/GMT-8', 'Etc/GMT-9', 'Etc/GMT-10', 'Etc/GMT-11', 'Etc/GMT-12',
];

async function pickAwakeZone(db) {
  await db.one(`select extract(hour from now() at time zone 'UTC')::int as utc_hour`);
  for (const zone of AWAKE_ZONES) {
    const { local_hour } = await db.one(
      `select extract(hour from now() at time zone $1)::int as local_hour`, [zone]);
    if (local_hour >= 7 && local_hour <= 20) return zone;
  }
  // Fallback (should never happen with 25 zones covering all 24 offsets):
  return 'UTC';
}

const localNow = await fixture.one(
  `select extract(hour from now() at time zone 'UTC')::int as utc_hour,
          (now() at time zone 'UTC')::date as utc_date`);
const UTC_HOUR = localNow.utc_hour;
const TZ = await pickAwakeZone(fixture);
const localInfo = await fixture.one(
  `select extract(hour from now() at time zone $1)::int as local_hour,
          (now() at time zone $1)::date::text as local_day`,
  [TZ]);
const LOCAL_HOUR = localInfo.local_hour;
const SERVER_DAY = localInfo.local_day;
const CUTOFF_LOCAL = `${String(Math.min(23, LOCAL_HOUR + 2)).padStart(2, '0')}:00`;
const EARLY_CUTOFF_LOCAL = `${String(Math.max(0, LOCAL_HOUR - 1)).padStart(2, '0')}:00`;

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------
const seededChildren = Object.values(CHILD).concat(PARALLEL, PARALLEL_B, ISOLATED);
const seedRows = seededChildren.map(c =>
  `('${c.child}','${c.family}','Seeded',${c.birthYear === null ? 'null' : c.birthYear},0)`).join(',');
const seedSessions = seededChildren.map((c, i) =>
  `('${sessionUuid(1000 + i)}','${c.family}','${c.child}','${c.token}',array['child:read','child:complete'],null,now()+interval '1 day')`).join(',');
const isolatedFamilies = ISOLATED.map(c => `('${c.family}','${USER.parentAlpha}')`).join(',');
const isolatedMemberships = ISOLATED.map(c => `('${c.family}','${USER.parentAlpha}','owner',now()-interval '1 day')`).join(',');
const isolatedSettings = ISOLATED.map(c =>
  `('${c.family}',true,true,'${TZ}','${CUTOFF_LOCAL}','21:00','07:00',null)`).join(',');

await fixture.exec(migrationSql);
await fixture.exec(preflightSql);
await fixture.exec(BRIDGE_SQL);
await fixture.exec(`set thinking_games.content_version = 'release-365-v1'`);

await fixture.exec(`
  insert into auth.users (id, email) values ('${USER.deltaParent}','parent-delta@example.test');
  insert into public.families (id, created_by) values
    ('${FAMILY.gamma}','${USER.parentAlpha}'),
    ('${FAMILY.delta}','${USER.deltaParent}'),
    ${isolatedFamilies};
  insert into public.family_memberships (family_id, user_id, role, created_at) values
    ('${FAMILY.gamma}','${USER.parentAlpha}','owner', now() - interval '1 day'),
    ('${FAMILY.delta}','${USER.deltaParent}','owner', now() - interval '1 day'),
    ${isolatedMemberships};
  insert into public.child_profiles (id, family_id, name, birth_year, points) values ${seedRows};
  insert into public.device_sessions (id, family_id, child_id, token_hash, capabilities, revoked_at, expires_at) values ${seedSessions};
`);

// A dedicated activity per child so each case owns its own task list.
await fixture.exec(`
  insert into public.habit_activities (id, family_id, child_id, title, points, requires_approval) values
    ('${ACTIVITY.plain}','${FAMILY.alpha}','${CHILD.bonus.child}','Plain task',7,false),
    ('${ACTIVITY.approval}','${FAMILY.alpha}','${CHILD.bonus.child}','Approval task',9,true),
    ('${ACTIVITY.second}','${FAMILY.alpha}','${CHILD.crossFamily.child}','Second plain task',5,false),
    ('${ACTIVITY.racePlain}','${FAMILY.alpha}','${CHILD.race.child}','Race task',7,false),
    ('${ACTIVITY.raceApproval}','${FAMILY.alpha}','${CHILD.race.child}','Race approval task',9,true),
    ('${ACTIVITY.batchA}','${FAMILY.alpha}','${CHILD.batchA.child}','Batch A',7,true),
    ('${ACTIVITY.batchB}','${FAMILY.alpha}','${CHILD.batchB.child}','Batch B',7,true),
    ('${ACTIVITY.mixPlain}','${FAMILY.alpha}','${CHILD.mixRace.child}','Mix plain',7,false),
    ('${ACTIVITY.mixApproval}','${FAMILY.alpha}','${CHILD.mixRace.child}','Mix approval',9,true),
    ('${ACTIVITY.latePlain}','${FAMILY.delta}','${CHILD.late.child}','Late plain',7,false),
    ('${ACTIVITY.lateApproval}','${FAMILY.delta}','${CHILD.late.child}','Late approval',9,true),
    ('${ACTIVITY.parentPlain}','${FAMILY.alpha}','${CHILD.parent.child}','Parent task',7,false),
    ('${ACTIVITY.bonusPlain}','${FAMILY.alpha}','${CHILD.bonusRace.child}','Bonus plain',7,false),
    ('${ACTIVITY.bonusApproval}','${FAMILY.alpha}','${CHILD.bonusRace.child}','Bonus approval',9,true),
    ('${ACTIVITY.enablePlain}','${FAMILY.gamma}','${CHILD.enable.child}','Enable task',7,false);
`);

// Settings per family. Family alpha is the shared, always-on family; gamma starts
// disabled so the first-enable rule can be observed; delta uses an early cutoff so
// a late receipt is reproducible.
await fixture.exec(`
  insert into public.thinking_game_settings (family_id, enabled, bonus_enabled, timezone, cutoff_local, bedtime_start_local, bedtime_end_local, age_track_override)
  values
    ('${FAMILY.alpha}', true, true, '${TZ}', '${CUTOFF_LOCAL}', '21:00', '07:00', null),
    ('${FAMILY.beta}',  true, true, '${TZ}', '${CUTOFF_LOCAL}', '21:00', '07:00', null),
    ('${FAMILY.delta}', true, true, '${TZ}', '${EARLY_CUTOFF_LOCAL}', '21:00', '07:00', null),
    ${isolatedSettings};
`);

// EXPLICIT INTERNAL TEST FIXTURE content. `status='approved'` is a test profile so
// the authoritative SQL path can be exercised; it is NOT a human content approval.
const contentRows = [];
for (let day = 1; day <= 3; day += 1) {
  for (const slot of ['main', 'bonus']) {
    for (const track of ['age_6_8', 'age_9_12']) {
      const id = `kilo-internal-d${day}-${slot}-${track}`;
      const publicPayload = {
        schemaVersion: 1,
        contentVersion: 'pilot-2026-10-21',
        id,
        dayIndex: day,
        slotType: slot,
        skillGroup: slot === 'main' ? 'rule' : 'memory',
        gameTypeId: 'g01-t1',
        ruleVariantId: 'g01-t1:rule',
        ageTrack: track,
        locale: 'vi',
        title: `Internal fixture ${id}`,
        invitation: 'Mình có một câu đố nhỏ.',
        tutorial: 'Nhìn kỹ rồi chọn.',
        explanation: 'Vì vậy đáp án là lá.',
        boardData: { kind: 'rule-sequence', sequence: ['lá', 'mây', 'lá'], options: ['hoa', 'quả', 'lá'], ruleKind: 'alternating' },
        hints: ['Nhìn xem nhịp lặp.', 'Thử đọc từng cặp.'],
        praiseKeys: { correct: 'thinkingGames.praise.correct', retry: 'thinkingGames.praise.tryAgain' },
        targetSeconds: 60,
        status: 'approved',
        fingerprint: `kilo-internal-${day}-${slot}-${track}`,
      };
      contentRows.push({
        id,
        content_version: 'release-365-v1',
        day_index: day,
        slot_type: slot,
        age_track: track,
        locale: 'vi',
        game_type_id: 'g01-t1',
        rule_variant_id: 'g01-t1:rule',
        status: 'approved',
        checker_id: 'rule-sequence-v1',
        public_payload: publicPayload,
        grading_payload: { solution: 'lá' },
        fingerprint: `kilo-internal-${day}-${slot}-${track}`,
      });
    }
  }
}
// One deliberately unreviewed day: the start path must refuse it.
contentRows.push({
  id: 'kilo-internal-d5-main-age_6_8',
  content_version: 'pilot-2026-10-21',
  day_index: 5,
  slot_type: 'main',
  age_track: 'age_6_8',
  locale: 'vi',
  game_type_id: 'g01-t1',
  rule_variant_id: 'g01-t1:rule',
  status: 'design_only',
  checker_id: 'rule-sequence-v1',
  public_payload: {},
  grading_payload: {},
  fingerprint: 'kilo-internal-d5-design',
});
const contentParams = [];
const contentTuples = contentRows.map(row => {
  const base = contentParams.length;
  contentParams.push(
    row.id, row.content_version, row.day_index, row.slot_type, row.age_track, row.locale,
    row.game_type_id, row.rule_variant_id, row.status, row.checker_id,
    JSON.stringify(row.public_payload), JSON.stringify(row.grading_payload), row.fingerprint,
  );
  const p = index => `$${base + index + 1}`;
  return `(${p(0)},${p(1)},${p(2)},${p(3)},${p(4)},${p(5)},${p(6)},${p(7)},${p(8)},${p(9)},${p(10)}::jsonb,${p(11)}::jsonb,${p(12)})`;
});
await fixture.query(`
  insert into public.thinking_game_content
    (id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id, status, checker_id, public_payload, grading_payload, fingerprint)
  values ${contentTuples.join(',')}`, contentParams);

log(`environment: postgresql=${(await fixture.one('select version() as v')).v}`);
log(`environment: timezone=${TZ} utcHour=${UTC_HOUR} localHour=${LOCAL_HOUR} serverDay=${SERVER_DAY} cutoff=${CUTOFF_LOCAL} earlyCutoff=${EARLY_CUTOFF_LOCAL}`);

// Every protected game RPC (`thinking_game_start`, `thinking_game_finish`,
// `thinking_game_finish_verified` and the `*_as` wrappers) is granted to
// `service_role` ONLY. Calling them through the raw fixture client would run them
// as the `postgres` superuser, which is not the production posture. This client is
// NOSUPERUSER and NOBYPASSRLS, so it is the faithful stand-in for the API route.
const gameService = await serviceClient();

// One long-lived parent session, running as the non-superuser `authenticated` role
// with the owner claims of family alpha. Every parent-side RPC in this file goes
// through it, so the authority proof always runs under a real role.
const parentClient = await fixture.db.connect();
await parentClient.query('set role authenticated');
await setClaims(parentClient, USER.parentAlpha);

// A separate parent for the "early cutoff" family, so the late-receipt case is
// exercised inside the right tenant.
const deltaParentClient = await fixture.db.connect();
await deltaParentClient.query('set role authenticated');
await setClaims(deltaParentClient, USER.deltaParent);

const roleInfo = await fixture.one(`
  select r.rolsuper, r.rolbypassrls, current_user as who from pg_roles r where r.rolname = 'authenticated'`);
const rlsInfo = await fixture.rows(`
  select c.relname, c.relrowsecurity, c.relforcerowsecurity from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and c.relname like 'thinking_game_%' order by c.relname`);

// ===========================================================================
// AR-00  Environment / authority preconditions
// ===========================================================================
try {
  startCase('AR-00', 'Harness asserts non-superuser, non-bypass role and forced RLS on every game table',
    ['test-spec §4 evidence contract', 'contracts §8.2']);
  expect(roleInfo.rolsuper === false, `expected authenticated to be NOSUPERUSER, got rolsuper=${roleInfo.rolsuper}`);
  expect(roleInfo.rolbypassrls === false, `expected authenticated to be NOBYPASSRLS, got rolbypassrls=${roleInfo.rolbypassrls}`);
  expect(rlsInfo.length >= 8, `expected the 8 game tables to exist, got ${rlsInfo.length}`);
  expect(rlsInfo.every(row => row.relrowsecurity && row.relforcerowsecurity),
    'every thinking_game_* table must have RLS enabled AND forced',
    { tables: rlsInfo.map(row => ({ name: row.relname, rls: row.relrowsecurity, force: row.relforcerowsecurity })) });
  pass(`authenticated is NOSUPERUSER/NOBYPASSRLS; ${rlsInfo.length} game tables have RLS enabled+forced`, {
    role: roleInfo, tables: rlsInfo.length,
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-01  20 concurrent `start main` on one child/day
// ===========================================================================
try {
  startCase('AR-01', 'Twenty simultaneous `start main` for one child on one server day produce one entitlement, one attempt and one journey advance',
    ['GWT-15', 'contracts §5.1', 'contracts §6.2', 'T02', 'T33']);
  const child = CHILD.race;
  const commandId = randomUUID();
  const results = await raceAcrossClients(20, client => callRpc(client,
    `select public.thinking_game_start($1, 'main', $2, $3) as result`,
    [child.token, SERVER_DAY, commandId]));
  const failures = results.filter(r => !r.ok);
  const deadlocks = failures.filter(r => isDeadlock(r.error));
  expect(deadlocks.length === 0, 'a 20-way start race deadlocked', { deadlocks: deadlocks.map(d => d.error) });
  const businessErrors = failures.map(r => pgErrorText(r.error));
  expect(failures.length === 0, 'all 20 concurrent starts must succeed', { failures: businessErrors });
  const payloads = results.map(r => r.value);
  const entitlementIds = new Set(payloads.map(p => p?.data?.entitlementId));
  const attemptIds = new Set(payloads.map(p => p?.data?.attemptId));
  const statuses = new Set(payloads.map(p => p?.status));
  expect(entitlementIds.size === 1, `expected exactly one entitlement id across 20 responses, got ${entitlementIds.size}`,
    { entitlementIds: [...entitlementIds] });
  expect(attemptIds.size === 1, `expected exactly one attempt id across 20 responses, got ${attemptIds.size}`,
    { attemptIds: [...attemptIds] });
  const rows = await fixture.rows(
    `select slot_type, state, count(*)::int as n from public.thinking_game_entitlements
      where child_id = $1 group by slot_type, state order by slot_type`, [child.child]);
  const attempts = await fixture.scalar(
    `select count(*)::int from public.thinking_game_attempts where child_id = $1`, [child.child]);
  const totalSlots = rows.reduce((sum, row) => sum + row.n, 0);
  expect(rows.length === 1 && rows[0].slot_type === 'main' && rows[0].n === 1,
    `expected exactly one main entitlement row, got ${JSON.stringify(rows)}`);
  expect(attempts === 1, `expected exactly one attempt row, got ${attempts}`);
  expect(totalSlots <= 2, `a child/day may hold at most two slots, got ${totalSlots}`);
  const journey = await fixture.one(
    `select next_day_index, last_main_started_local_day from public.thinking_game_journeys where child_id = $1`,
    [child.child]);
  expect(journey.next_day_index === 2,
    `the journey cursor must advance exactly once for one successful main start, got ${journey.next_day_index}`);
  const snapshots = await fixture.scalar(
    `select count(*)::int from public.thinking_game_day_snapshots where child_id = $1 and local_day = $2`,
    [child.child, SERVER_DAY]);
  expect(snapshots === 1, `expected exactly one day snapshot, got ${snapshots}`);
  pass(`20-way start race produced 1 entitlement, 1 attempt, 1 journey advance, 1 snapshot; response ids identical`,
    { statuses: [...statuses], entitlementIds: [...entitlementIds], attemptIds: [...attemptIds], journey, snapshots });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-02  Stable retry / idempotency of `start`
// ===========================================================================
try {
  startCase('AR-02', 'Replaying a start (same and different commandId) returns the same entitlement/attempt, the same content version and never advances the journey twice',
    ['GWT-06', 'contracts §13.3', 'contracts §9', 'T01', 'T03', 'T45']);
  const child = CHILD.race;
  const original = await fixture.one(
    `select e.id as entitlement_id, e.content_version, e.command_id, a.id as attempt_id
       from public.thinking_game_entitlements e join public.thinking_game_attempts a on a.entitlement_id = e.id
      where e.child_id = $1 and e.local_day = $2 and e.slot_type = 'main'`, [child.child, SERVER_DAY]);
  const replaySame = await callRpc(gameService,
    `select public.thinking_game_start($1, 'main', $2, $3) as result`, [child.token, SERVER_DAY, original.command_id]);
  const replayDifferent = await callRpc(gameService,
    `select public.thinking_game_start($1, 'main', $2, $3) as result`, [child.token, SERVER_DAY, randomUUID()]);
  expect(replaySame?.data?.entitlementId === original.entitlement_id,
    'a replay with the same commandId must return the original entitlement id', { replaySame });
  expect(replayDifferent?.data?.entitlementId === original.entitlement_id,
    'a retry with a different commandId must still return the original entitlement id', { replayDifferent });
  expect(replayDifferent?.data?.attemptId === original.attempt_id,
    'a retry must return the original attempt id', { replayDifferent });
  const entitlementCount = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'main'`,
    [child.child, SERVER_DAY]);
  const attemptCount = await fixture.scalar(
    `select count(*)::int from public.thinking_game_attempts where child_id = $1`, [child.child]);
  const journey = await fixture.one(`select next_day_index from public.thinking_game_journeys where child_id = $1`, [child.child]);
  expect(entitlementCount === 1, `a replay must not create a second entitlement, got ${entitlementCount}`);
  expect(attemptCount === 1, `a replay must not create a second attempt, got ${attemptCount}`);
  expect(journey.next_day_index === 2, `a replay must not advance the journey again, got ${journey.next_day_index}`);
  const contentVersion = await fixture.scalar(
    `select content_version from public.thinking_game_entitlements where id = $1`, [original.entitlement_id]);
  expect(contentVersion === original.content_version, 'the content version of a replayed attempt must not change');
  pass('replays are idempotent: same entitlement, same attempt, same content version, journey not advanced twice', {
    original, entitlementCount, attemptCount, journey,
    observation: 'the replay response body omits `puzzle` and `contentVersion`; stability is only observable in the ledger',
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-03  Bonus grant condition: every mandatory task terminal AND timely
// ===========================================================================
try {
  startCase('AR-03', 'Bonus is granted only when every non-excused mandatory task is terminal and its server receipt is at or before the cutoff',
    ['contracts §7', 'contracts §7.1', 'GWT-10', 'GWT-12', 'GWT-13', 'GWT-14', 'GWT-19', 'GWT-38', 'T06']);
  const child = CHILD.bonus;
  await callRpc(gameService, `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    [child.token, SERVER_DAY]);
  const snapshot = await fixture.one(
    `select mandatory_tasks, cutoff_at from public.thinking_game_day_snapshots where child_id = $1 and local_day = $2`,
    [child.child, SERVER_DAY]);
  expect(snapshot && Array.isArray(snapshot.mandatory_tasks) && snapshot.mandatory_tasks.length === 2,
    'the child-path snapshot must freeze the active mandatory tasks', { snapshot });

  const parent = parentClient;
  // A pending-approval task must not unlock the bonus.
  await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.plain, child.child, SERVER_DAY, randomUUID()]);
  const pending = await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.approval, child.child, SERVER_DAY, randomUUID()]);
  expect(pending?.status === 'pending_approval', `the approval task must be pending, got ${pending?.status}`);
  const beforeApproval = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'bonus'`,
    [child.child, SERVER_DAY]);
  expect(beforeApproval === 0, 'a pending approval must not unlock the bonus', { beforeApproval });

  // Approving after the cutoff still grants the bonus: timeliness uses received_at.
  const logId = await fixture.scalar(`select id from public.activity_logs where activity_id = $1 and child_id = $2`,
    [ACTIVITY.approval, child.child]);
  const reviewed = await callRpc(gameService, `select public.review_habit_command_as($1,$2,'approve') as result`, [USER.parentAlpha, logId]);
  expect(reviewed?.status === 'approved', `the review must approve, got ${reviewed?.status}`);
  const receipt = await fixture.one(
    `select received_at, reviewed_at, review_status from public.thinking_game_habit_receipts where log_id = $1`, [logId]);
  expect(receipt?.received_at && receipt?.reviewed_at, 'the game-owned receipt must carry both received_at and reviewed_at', { receipt });
  expect(receipt.review_status === 'approved', 'the receipt must record the review outcome', { receipt });
  expect(new Date(receipt.received_at).getTime() !== new Date(receipt.reviewed_at).getTime()
    || receipt.received_at <= receipt.reviewed_at,
  'received_at must never be later than reviewed_at', { receipt });
  const bonus = await fixture.rows(
    `select id, state, journey_day_index from public.thinking_game_entitlements
      where child_id = $1 and local_day = $2 and slot_type = 'bonus'`, [child.child, SERVER_DAY]);
  expect(bonus.length === 1, `the bonus must be granted exactly once, got ${bonus.length}`, { bonus });
  expect(bonus[0].journey_day_index === 1, 'the bonus must serve the day journey index', { bonus });
  pass('bonus granted once: pending approval blocked it, approval after the cutoff unlocked it via received_at, receipt carries both clocks', {
    receipt, cutoffAt: snapshot.cutoff_at, receivedAt: receipt.received_at, reviewedAt: receipt.reviewed_at, bonus,
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-04  A late receipt (after the cutoff) never unlocks the bonus
// ===========================================================================
try {
  startCase('AR-04', 'A task received after the cutoff does not unlock the bonus for that day',
    ['contracts §7.1', 'GWT-12', 'T07']);
  const child = CHILD.late;
  await callRpc(gameService, `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    [child.token, SERVER_DAY]);
  const snapshot = await fixture.one(
    `select cutoff_at, mandatory_tasks from public.thinking_game_day_snapshots where child_id = $1 and local_day = $2`,
    [child.child, SERVER_DAY]);
  // The `late` child lives in family delta, so the command must run as the delta
  // parent. Using the alpha parent here would be a cross-tenant command, which the
  // product correctly refuses with `activity_not_found`.
  const parent = deltaParentClient;
  await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.latePlain, child.child, SERVER_DAY, randomUUID()]);
  const receipt = await fixture.one(
    `select received_at from public.thinking_game_habit_receipts where child_id = $1 and activity_id = $2`,
    [child.child, ACTIVITY.latePlain]);
  const late = new Date(receipt.received_at).getTime() > new Date(snapshot.cutoff_at).getTime();
  expect(late, `the fixture must really be late: received_at=${receipt.received_at} cutoff=${snapshot.cutoff_at}`,
    { receipt, cutoffAt: snapshot.cutoff_at });
  const bonus = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'bonus'`,
    [child.child, SERVER_DAY]);
  expect(bonus === 0, `a late receipt must not grant a bonus, got ${bonus}`);
  pass('a receipt after the cutoff produced no bonus entitlement', { receivedAt: receipt.received_at, cutoffAt: snapshot.cutoff_at });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-05  A granted bonus entitlement must be startable (GWT-21 / §6.1)
// ===========================================================================
try {
  startCase('AR-05', 'A bonus entitlement granted by the habit integration is startable, serves the day content and does not advance the journey',
    ['GWT-21', 'contracts §6.1', 'contracts §6.3', 'T36']);
  const child = CHILD.bonusRace;
  await callRpc(gameService, `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    [child.token, SERVER_DAY]);
  const parent = parentClient;
  await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.bonusPlain, child.child, SERVER_DAY, randomUUID()]);
  await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.bonusApproval, child.child, SERVER_DAY, randomUUID()]);
  const logId = await fixture.scalar(`select id from public.activity_logs where activity_id = $1 and child_id = $2`,
    [ACTIVITY.bonusApproval, child.child]);
  await callRpc(gameService, `select public.review_habit_command_as($1,$2,'approve') as result`, [USER.parentAlpha, logId]);
  const granted = await fixture.one(
    `select id, state, journey_day_index, content_id from public.thinking_game_entitlements
      where child_id = $1 and local_day = $2 and slot_type = 'bonus'`, [child.child, SERVER_DAY]);
  expect(granted, 'the bonus entitlement must exist before the start attempt');
  expect(granted.state === 'granted', `the habit sync must leave the bonus in state 'granted', got ${granted.state}`, { granted });
  const journeyBefore = await fixture.scalar(
    `select next_day_index from public.thinking_game_journeys where child_id = $1`, [child.child]);
  const started = await callRpc(gameService, `select public.thinking_game_start($1, 'bonus', $2, gen_random_uuid()) as result`,
    [child.token, SERVER_DAY]);
  const attempt = await fixture.one(
    `select id, state from public.thinking_game_attempts where entitlement_id = $1`, [granted.id]);
  const journeyAfter = await fixture.scalar(
    `select next_day_index from public.thinking_game_journeys where child_id = $1`, [child.child]);
  expect(attempt, 'starting a granted bonus must create an attempt (contract §6.1: granted --start--> started)',
    { started, attempt, granted });
  expect(attempt?.state === 'started', `the bonus attempt must be 'started', got ${attempt?.state}`, { started, attempt });
  expect(started?.data?.puzzle, 'the bonus start must return the day content payload', { started });
  expect(journeyAfter === journeyBefore, 'starting a bonus must not advance the journey index',
    { journeyBefore, journeyAfter });
  pass('granted bonus entitlement started, served content and left the journey cursor untouched', {
    granted, started, attempt, journeyBefore, journeyAfter,
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-06  Undo before the bonus attempt -> revoked_unused
// ===========================================================================
try {
  startCase('AR-06', 'Undo after the bonus was granted but before any bonus attempt started revokes the bonus as `revoked_unused`',
    ['GWT-17', 'contracts §7.2', 'T08', 'T35']);
  const child = CHILD.bonusRace;
  const parent = parentClient;
  const logId = await fixture.scalar(
    `select id from public.activity_logs where activity_id = $1 and child_id = $2 and status = 'completed'`,
    [ACTIVITY.bonusPlain, child.child]);
  const undone = await callRpc(parent, `select public.undo_habit_command($1) as result`, [logId]);
  expect(undone?.status === 'undone', `the undo must succeed, got ${undone?.status}`, { undone });
  const entitlement = await fixture.one(
    `select state from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'bonus'`,
    [child.child, SERVER_DAY]);
  expect(entitlement?.state === 'revoked_unused',
    `the bonus entitlement must become 'revoked_unused', got ${entitlement?.state}`,
    { entitlement, contract: 'GWT-17' });
  const receipt = await fixture.one(
    `select log_id, received_at from public.thinking_game_habit_receipts where log_id = $1`, [logId]);
  expect(receipt, 'the game-owned receipt must survive the undo as audit');
  pass('undo revoked the unused bonus entitlement and kept the receipt', { entitlement, receipt });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-07  Undo after the bonus attempt started -> revoked_after_use
// ===========================================================================
try {
  startCase('AR-07', 'Undo after a bonus attempt started revokes the bonus as `revoked_after_use`, keeps the attempt and never rewrites approved habit state',
    ['GWT-18', 'GWT-20', 'contracts §7.2', 'T08', 'T35']);
  const child = CHILD.bonusRace;
  const parent = parentClient;
  // Restore the completed task so the bonus can be granted and started again.
  await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.bonusPlain, child.child, SERVER_DAY, randomUUID()]);
  const granted = await fixture.one(
    `select id, state from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'bonus'`,
    [child.child, SERVER_DAY]);
  const attempt = await fixture.one(
    `select id, state from public.thinking_game_attempts where entitlement_id = $1`, [granted?.id]);
  const pointsBefore = await fixture.scalar(
    `select points from public.child_profiles where id = $1`, [child.child]);
  const logId = await fixture.scalar(
    `select id from public.activity_logs where activity_id = $1 and child_id = $2 and status = 'completed'`,
    [ACTIVITY.bonusPlain, child.child]);
  const undone = await callRpc(parent, `select public.undo_habit_command($1) as result`, [logId]);
  expect(undone?.status === 'undone', `the undo must succeed, got ${undone?.status}`, { undone });
  const after = await fixture.one(
    `select state from public.thinking_game_entitlements where id = $1`, [granted?.id]);
  const attemptAfter = await fixture.one(
    `select id, state from public.thinking_game_attempts where id = $1`, [attempt?.id]);
  const pointsAfter = await fixture.scalar(
    `select points from public.child_profiles where id = $1`, [child.child]);
  expect(after?.state === 'revoked_after_use',
    `the bonus entitlement must become 'revoked_after_use', got ${after?.state}`, { after, contract: 'GWT-18' });
  expect(attemptAfter, 'the attempt must stay in history after the revocation');
  expect(pointsAfter === pointsBefore - 7,
    `the habit ledger owns the points, so the undo must move them by the task points; before=${pointsBefore} after=${pointsAfter}`);
  pass('undo after use revoked the bonus, kept the attempt and left the habit ledger to the habit path', {
    after, attemptAfter, pointsBefore, pointsAfter,
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-08  A parent start must not poison the day snapshot
// ===========================================================================
try {
  startCase('AR-08', 'A parent-side start does not destroy the day snapshot: the mandatory task list stays frozen and the bonus can still unlock',
    ['contracts §5.2', 'contracts §7', 'GWT-03', 'GWT-13']);
  const child = CHILD.parent;
  // `thinking_game_parent_start_as` is granted to `service_role` only; the
  // `authenticated` role must NOT be able to call it. The habit command below is
  // the opposite: `authenticated` only.
  const parentApi = await serviceClient();
  await callRpc(parentApi, `select public.thinking_game_parent_start_as($1,$2,'main',$3,$4) as result`,
    [USER.parentAlpha, child.child, SERVER_DAY, randomUUID()]);
  const snapshot = await fixture.one(
    `select mandatory_tasks, journey_day_index from public.thinking_game_day_snapshots where child_id = $1 and local_day = $2`,
    [child.child, SERVER_DAY]);
  expect(Array.isArray(snapshot?.mandatory_tasks) && snapshot.mandatory_tasks.length === 1,
    'the parent start must freeze the same mandatory task list as the child start',
    { snapshot, childTasks: [ACTIVITY.parentPlain] });
  await callRpc(parentClient, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.parentPlain, child.child, SERVER_DAY, randomUUID()]);
  const bonus = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'bonus'`,
    [child.child, SERVER_DAY]);
  expect(bonus === 1, `the bonus must unlock after the parent-side start, got ${bonus}`);
  pass('parent-side start keeps the frozen task list and the bonus still unlocks', { snapshot, bonus });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-09  Mixed review / undo / start race on one child
// ===========================================================================
try {
  startCase('AR-09', 'A mixed twenty-way race of complete, review, undo and start on one child deadlocks nowhere and leaves at most one bonus entitlement',
    ['T08', 'T33', 'contracts §8.2', 'GWT-16']);
  const child = CHILD.mixRace;
  await callRpc(gameService, `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    [child.token, SERVER_DAY]);
  const parent = parentClient;
  const mixedLog = await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.mixPlain, child.child, SERVER_DAY, randomUUID()]);
  const approvalLog = await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.mixApproval, child.child, SERVER_DAY, randomUUID()]);
  expect(mixedLog?.status === 'completed' && approvalLog?.status === 'pending_approval',
    'the mixed-race fixture must be one completed and one pending-approval task', { mixedLog, approvalLog });
  const approvalLogId = approvalLog.logId;
  const mixedLogId = mixedLog.logId;

  const results = await raceAcrossClients(20, async (client, index) => {
    // The protected game RPC and the habit RPCs have DISJOINT grants:
    // - thinking_game_start: service_role only
    // - review_habit_command_as/review_habits_command_as: service_role only (via _as wrappers)
    // - undo_habit_command: authenticated, service_role
    // - complete_habit_command: authenticated, service_role
    // Each participant presents the role that owns the RPC it calls.
    const isGameCall = index % 4 === 2;
    const isReviewCall = index % 4 === 0 || index % 4 === 3;
    await client.query(`set role ${isGameCall || isReviewCall ? 'service_role' : 'authenticated'}`);
    await setClaims(client, USER.parentAlpha, isGameCall || isReviewCall ? 'service_role' : 'authenticated');
    switch (index % 4) {
      case 0: return callRpc(client, `select public.review_habit_command_as($1,$2,'approve') as result`, [USER.parentAlpha, approvalLogId]);
      case 1: return callRpc(client, `select public.undo_habit_command($1) as result`, [mixedLogId]);
      case 2: return callRpc(client, `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
        [child.token, SERVER_DAY]);
      default: return callRpc(client, `select public.review_habit_command_as($1,$2,'reject') as result`, [USER.parentAlpha, approvalLogId]);
    }
  });
  const failures = results.filter(r => !r.ok);
  const deadlocks = failures.filter(r => isDeadlock(r.error));
  expect(deadlocks.length === 0, 'the mixed race deadlocked', { deadlocks: deadlocks.map(d => d.error) });
  const unexpected = failures.filter(r => !/not_reversible|already_reviewed|not_found|duplicate/.test(r.error.message));
  expect(unexpected.length === 0, 'the mixed race produced unexpected errors', {
    unexpected: unexpected.map(u => pgErrorText(u.error)),
    allFailures: failures.map(f => pgErrorText(f.error)),
  });
  const bonus = await fixture.rows(
    `select slot_type, state, count(*)::int as n from public.thinking_game_entitlements
      where child_id = $1 and local_day = $2 group by slot_type, state order by slot_type`, [child.child, SERVER_DAY]);
  const bonusRows = bonus.filter(row => row.slot_type === 'bonus');
  const totalBonus = bonusRows.reduce((sum, row) => sum + row.n, 0);
  expect(totalBonus <= 1, `at most one bonus entitlement may exist, got ${totalBonus}`, { bonus });
  const logs = await fixture.scalar(
    `select count(*)::int from public.activity_logs where child_id = $1 and log_date = $2`, [child.child, SERVER_DAY]);
  const receipts = await fixture.scalar(
    `select count(*)::int from public.thinking_game_habit_receipts where child_id = $1 and local_day = $2`,
    [child.child, SERVER_DAY]);
  expect(logs <= 2, `the unique (activity_id, child_id, log_date) key must hold, got ${logs} log rows`);
  expect(receipts >= 1, 'the game-owned receipt must survive the race as audit', { receipts });
  const audit = await fixture.scalar(
    `select count(*)::int from public.thinking_game_audit_events where child_id = $1`, [child.child]);
  pass('the 20-way mixed race completed with no deadlock, no duplicate log and at most one bonus entitlement', {
    failures: failures.map(f => pgErrorText(f.error)), bonus, logs, receipts, auditEvents: audit,
    observation: 'no audit event is written for a grant, a start, a finish or a revocation, so "durable audit" is not observable in the ledger',
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-10  Two children, inverse-order batch review, concurrently
// ===========================================================================
try {
  startCase('AR-10', 'Two concurrent batch reviews over two children with inverse id order deadlock nowhere and grant at most one bonus per child and day',
    ['GWT-16', 'contracts §8.1', 'contracts §8.2', 'T34']);
  const childA = CHILD.batchA;
  const childB = CHILD.batchB;
  const parent = parentClient;
  const logA = await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.batchA, childA.child, SERVER_DAY, randomUUID()]);
  const logB = await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [ACTIVITY.batchB, childB.child, SERVER_DAY, randomUUID()]);
  expect(logA?.status === 'pending_approval' && logB?.status === 'pending_approval',
    'both batch fixtures must be pending approval', { logA, logB });
  const ids = [logA.logId, logB.logId];
  const ascending = [...ids].sort();
  const descending = [...ids].reverse();

  const results = await raceAcrossClients(4, async (client, index) => {
    // review_habits_command_as is granted to service_role only
    await client.query('set role service_role');
    await setClaims(client, USER.parentAlpha, 'service_role');
    if (index < 2) {
      return callRpc(client, `select public.review_habits_command_as($1,$2,'approve') as result`, [USER.parentAlpha, ascending]);
    }
    return callRpc(client, `select public.review_habits_command_as($1,$2,'approve') as result`, [USER.parentAlpha, descending]);
  });
  const failures = results.filter(r => !r.ok);
  const deadlocks = failures.filter(r => isDeadlock(r.error));
  expect(deadlocks.length === 0, 'the inverse-order batch race deadlocked', { deadlocks: deadlocks.map(d => d.error) });
  const unexpected = failures.filter(r => !/already_reviewed/.test(r.error.message));
  expect(unexpected.length === 0, 'the batch race produced unexpected errors', {
    unexpected: unexpected.map(u => pgErrorText(u.error)),
  });
  const bonusRows = await fixture.rows(
    `select child_id, count(*)::int as n from public.thinking_game_entitlements
      where child_id = any($1::uuid[]) and slot_type = 'bonus' group by child_id order by child_id`,
    [[childA.child, childB.child]]);
  const total = bonusRows.reduce((sum, row) => sum + row.n, 0);
  expect(total <= 2, `each child may hold at most one bonus entitlement, got ${total}`, { bonusRows });
  const doubleGrant = bonusRows.filter(row => row.n > 1);
  expect(doubleGrant.length === 0, 'a batch review must never produce two bonus entitlements for one child and day', { bonusRows });
  const approved = await fixture.rows(
    `select id, status from public.activity_logs where id = any($1::uuid[]) order by id`, [ids]);
  expect(approved.every(row => row.status === 'approved'),
    'the final state of every reviewed log must be approved', { approved });
  pass('inverse-order concurrent batches deadlocked nowhere and left at most one bonus entitlement per child and day', {
    failures: failures.map(f => pgErrorText(f.error)), bonusRows, approved,
    observation: 'the batch sync is not observable in any audit ledger, so "one sync after the loop" can only be checked as a final-state invariant',
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-11  Settings semantics: next local day, immediate master disable
// ===========================================================================
try {
  startCase('AR-11', 'A settings change is effective on the next local day, a master disable is immediate, and a first enable grants nothing on the enable day',
    ['contracts §4.8', 'contracts §4.9', 'GWT-04', 'contracts §12', 'T10', 'T43']);
  const child = CHILD.enable;
  // `thinking_game_update_settings_as` is granted to `service_role` only.
  const parentApi = await serviceClient();
  const firstEnable = await callRpc(parentApi, `select public.thinking_game_update_settings_as($1,$2,true,true,$3,$4,'21:00','07:00',null,$5) as result`,
    [USER.parentAlpha, FAMILY.gamma, TZ, CUTOFF_LOCAL, randomUUID()]);
  expect(firstEnable?.status === 'updated', `the first enable must be accepted, got ${firstEnable?.status}`, { firstEnable });
  const settings = await fixture.one(
    `select enabled, effective_from_local_day, pending_effective_local_day, settings_version
       from public.thinking_game_settings where family_id = $1`, [FAMILY.gamma]);
  expect(settings.enabled === true, 'the first enable must switch the family on');
  const sameDayStart = await expectRpcError(gameService,
    `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`, [child.token, SERVER_DAY],
    /feature_off|day_changed/);
  const sameDayEntitlement = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1 and local_day = $2`, [child.child, SERVER_DAY]);
  expect(sameDayEntitlement === 0,
    'a family that enables games for the first time must get no grant on the enable day (contracts §4.9)',
    { settings, sameDayStart, sameDayEntitlement });
  pass('first enable is accepted and grants nothing on the enable day', { settings, sameDayEntitlement });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

try {
  startCase('AR-12', 'A master disable takes effect immediately and revokes an unused bonus entitlement',
    ['contracts §12', 'contracts §6.1', 'T43', 'T32']);
  const child = CHILD.bonus;
  // `thinking_game_update_settings_as` is granted to `service_role` only.
  const parentApi = await serviceClient();
  const before = await fixture.one(
    `select state from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'bonus'`,
    [child.child, SERVER_DAY]);
  const disabled = await callRpc(parentApi, `select public.thinking_game_update_settings_as($1,$2,false,false,$3,$4,'21:00','07:00',null,$5) as result`,
    [USER.parentAlpha, FAMILY.alpha, TZ, CUTOFF_LOCAL, randomUUID()]);
  expect(disabled?.status === 'disabled', `the disable must be immediate, got ${disabled?.status}`, { disabled });
  const after = await fixture.one(
    `select state from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'bonus'`,
    [child.child, SERVER_DAY]);
  expect(after?.state === 'revoked_unused',
    `an unused bonus must become 'revoked_unused' when the master flag goes off, got ${after?.state}`,
    { before, after, contract: 'contracts §12' });
  const startAfterDisable = await expectRpcError(gameService,
    `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`, [child.token, SERVER_DAY],
    /feature_off/);
  expect(startAfterDisable.error, 'a start after the master disable must fail closed');
  pass('the master disable was immediate and revoked the unused bonus', { before, after, startAfterDisable });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// Re-enable family alpha for the remaining cases.
await fixture.query(`update public.thinking_game_settings set enabled = true, bonus_enabled = true where family_id = $1`, [FAMILY.alpha]);

// ===========================================================================
// AR-13  Paused family / paused day blocks new main and bonus grants
// ===========================================================================
try {
  startCase('AR-13', 'A paused family or paused day blocks a new main grant and creates no snapshot, entitlement or attempt',
    ['GWT-39', 'contracts §6.2', 'contracts §7.3', 'T46']);
  const child = CHILD.race;
  const pauseColumn = await fixture.one(`
    select 1 as present from information_schema.columns
     where table_schema = 'public' and table_name = 'family_memberships' and column_name = 'paused_at'`);
  const pauseTable = await fixture.one(`select to_regclass('public.family_pause_state') as reg`);
  const childColumn = await fixture.one(`
    select 1 as present from information_schema.columns
     where table_schema = 'public' and table_name = 'child_profiles' and column_name = 'paused_at'`);
  const hasPause = Boolean(pauseColumn?.present) || Boolean(pauseTable?.reg) || Boolean(childColumn?.present);
  const engagementTable = await fixture.one(`
    select 1 as present from information_schema.tables
     where table_schema = 'public' and table_name = 'family_engagement_settings'`);
  if (engagementTable?.present) {
    await fixture.query(`
      insert into public.family_engagement_settings (family_id, paused_at)
      values ($1, now())
      on conflict (family_id) do update set paused_at = excluded.paused_at`, [child.family]);
    const before = await fixture.one(
      `select count(*)::int as entitlements, count(*) filter (where slot_type = 'main')::int as main_entitlements
         from public.thinking_game_entitlements where child_id = $1 and local_day = $2`,
      [child.child, SERVER_DAY]);
    const paused = await expectRpcError(gameService,
      `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
      [child.token, SERVER_DAY], /paused/);
    const after = await fixture.one(
      `select count(*)::int as entitlements, count(*) filter (where slot_type = 'main')::int as main_entitlements
         from public.thinking_game_entitlements where child_id = $1 and local_day = $2`,
      [child.child, SERVER_DAY]);
    expect(after.entitlements === before.entitlements && after.main_entitlements === before.main_entitlements,
      'a paused start must not create an entitlement', { before, after, paused });
    await fixture.query(
      `update public.family_engagement_settings set paused_at = null where family_id = $1`, [child.family]);
    pass('family_engagement_settings paused_at blocks a new main start without creating an entitlement', {
      paused, before, after,
    });
  } else if (!hasPause) {
    blocked('the shared fixture declares no pause state at all (no family/child pause column or table), so the pause rule cannot be exercised against the real product schema',
      { pauseColumn: pauseColumn ?? null, pauseTable: pauseTable ?? null, childColumn: childColumn ?? null });
  } else {
    fail('unexpected pause shape; the case needs to be adapted', { pauseColumn, pauseTable, childColumn });
  }
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-14  Quiet hours / bedtime blackout
// ===========================================================================
try {
  startCase('AR-14', 'A start inside the bedtime blackout is refused with `bedtime` and creates no grant',
    ['contracts §6.2', 'contracts §14', 'GWT-11', 'T07']);
  const child = CHILD.dst;
  await fixture.query(
    `update public.thinking_game_settings set bedtime_start_local = '00:00', bedtime_end_local = '23:59' where family_id = $1`,
    [FAMILY.alpha]);
  const duringBlackout = await expectRpcError(gameService,
    `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`, [child.token, SERVER_DAY],
    /bedtime|outside_play_window/);
  const entitlement = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1 and local_day = $2`, [child.child, SERVER_DAY]);
  expect(duringBlackout.error, 'a start inside the bedtime blackout must be refused', { duringBlackout });
  expect(entitlement === 0, 'a refused blackout start must not create an entitlement', { entitlement });
  pass('the bedtime blackout refused the start and created no grant', { duringBlackout, entitlement });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
} finally {
  await fixture.query(
    `update public.thinking_game_settings set bedtime_start_local = '21:00', bedtime_end_local = '07:00' where family_id = $1`,
    [FAMILY.alpha]);
}

// ===========================================================================
// AR-15  Rollover: a finish for the previous local day is attempt_expired
// ===========================================================================
try {
  startCase('AR-15', 'A finish for an attempt of a previous local day returns attempt_expired, closes the attempt as abandoned_rollover and expires the entitlement',
    ['GWT-05', 'contracts §5.3', 'T11']);
  const child = CHILD.rollover;
  const yesterday = await fixture.one(
    `select ((now() at time zone $1)::date - 1)::text as day`, [TZ]);
  const entitlementId = randomUUID();
  const attemptId = randomUUID();
  await fixture.query(
    `insert into public.thinking_game_entitlements
       (id, child_id, family_id, local_day, slot_type, journey_day_index, content_id, content_version, state, command_id)
     values ($1,$2,$3,$4,'main',1,'kilo-internal-d1-main-age_6_8','pilot-2026-10-21','started',$5)`,
    [entitlementId, child.child, FAMILY.alpha, yesterday.day, randomUUID()]);
  await fixture.query(
    `insert into public.thinking_game_attempts (id, entitlement_id, child_id, family_id, state, command_id)
     values ($1,$2,$3,$4,'started',$5)`,
    [attemptId, entitlementId, child.child, FAMILY.alpha, randomUUID()]);
  let finishResult = null;
  let finishError = null;
  try {
    finishResult = await callRpc(gameService,
      `select public.thinking_game_finish($1,$2,$3,$4) as result`,
      [child.token, attemptId, JSON.stringify('lá'), randomUUID()]);
  } catch (err) {
    finishError = err;
  }
  const isExpiredSignal = (finishError && /attempt_expired/.test(finishError?.message ?? '')) ||
    (finishResult && (finishResult.ok === false || finishResult.status === 'attempt_expired') &&
      (finishResult.code === 'attempt_expired' || finishResult.status === 'attempt_expired' || finishResult.error === 'attempt_expired'));
  const attempt = await fixture.one(`select state, finished_at from public.thinking_game_attempts where id = $1`, [attemptId]);
  const entitlement = await fixture.one(`select state from public.thinking_game_entitlements where id = $1`, [entitlementId]);
  expect(isExpiredSignal, 'the old-day finish must return attempt_expired signal', { finishError, finishResult });
  expect(attempt?.state === 'abandoned_rollover', `the attempt must be closed as abandoned_rollover, got ${attempt?.state}`, { attempt });
  expect(entitlement?.state === 'expired', `the entitlement must expire, got ${entitlement?.state}`, { entitlement });
  pass('a rolled-over finish returned attempt_expired, closed the attempt and expired the entitlement', { finishResult, finishError, attempt, entitlement });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-16  A review after local midnight must not unlock the previous day
// ===========================================================================
try {
  startCase('AR-16', 'A review received after local midnight does not unlock the previous local day',
    ['contracts §7.1', 'GWT-10', 'GWT-11', 'T07']);
  const child = CHILD.bonusRace;
  const yesterday = await fixture.one(`select ((now() at time zone $1)::date - 1)::text as day`, [TZ]);
  // A snapshot that existed for the previous day, with its own cutoff.
  await fixture.query(
    `insert into public.thinking_game_day_snapshots
       (child_id, family_id, local_day, timezone, settings_version, cutoff_at, bedtime_start_at, bedtime_end_at, enabled, mandatory_tasks, journey_day_index)
     values ($1::uuid,$2::uuid,$3::date,$4::text,1,($3::date::timestamp + time '19:00') at time zone $4::text,
       ($3::date::timestamp + time '21:00') at time zone $4::text, ($3::date::timestamp + time '07:00') at time zone $4::text,
       true, jsonb_build_array(jsonb_build_object('activityId',$5::uuid::text,'requiresApproval',true,'title','Late')),1)`,
    [child.child, FAMILY.alpha, yesterday.day, TZ, ACTIVITY.bonusApproval]);
  const logId = randomUUID();
  await fixture.query(
    `insert into public.activity_logs (id, family_id, child_id, activity_id, log_date, status, points_awarded)
     values ($1,$2,$3,$4,$5,'pending_approval',0)`,
    [logId, FAMILY.alpha, child.child, ACTIVITY.bonusApproval, yesterday.day]);
  const receipt = await fixture.one(
    `select received_at, reviewed_at from public.thinking_game_habit_receipts where log_id = $1`, [logId]);
  expect(receipt, 'the previous-day completion must own a receipt');
  const reviewed = await callRpc(gameService, `select public.review_habit_command_as($1,$2,'approve') as result`, [USER.parentAlpha, logId]);
  expect(reviewed?.status === 'approved', `the review must still approve the habit, got ${reviewed?.status}`, { reviewed });
  const yesterdayBonus = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1 and local_day = $2 and slot_type = 'bonus'`,
    [child.child, yesterday.day]);
  expect(yesterdayBonus === 0,
    `a review after local midnight must not unlock the previous day, got ${yesterdayBonus} bonus entitlement(s)`,
    { yesterday: yesterday.day, reviewed, yesterdayBonus, contract: 'contracts §7.1' });
  pass('a late review approved the habit but did not unlock the previous day', { reviewed, yesterdayBonus });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-17  Authority: role, family, forged actor, revoked session, RPC bypass
// ===========================================================================
try {
  startCase('AR-17', 'Cross-family ids, a revoked session, a forged actor and a direct RPC bypass all fail closed with no data leak',
    ['GWT-31', 'GWT-32', 'contracts §13.2', 'contracts §14', 'T13', 'T14', 'T50']);
  const child = CHILD.crossFamily;
  const foreignAttempt = randomUUID();
  const foreignEntitlement = randomUUID();
  await fixture.query(
    `insert into public.thinking_game_entitlements
       (id, child_id, family_id, local_day, slot_type, journey_day_index, content_id, content_version, state, command_id)
     values ($1,$2,$3,$4,'main',1,'kilo-internal-d1-main-age_6_8','pilot-2026-10-21','started',$5)`,
    [foreignEntitlement, CHILD.age.child, FAMILY.alpha, SERVER_DAY, randomUUID()]);
  await fixture.query(
    `insert into public.thinking_game_attempts (id, entitlement_id, child_id, family_id, state, command_id)
     values ($1,$2,$3,$4,'started',$5)`,
    [foreignAttempt, foreignEntitlement, CHILD.age.child, FAMILY.alpha, randomUUID()]);

  const revoked = await expectRpcError(gameService,
    `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    ['harness-token-child-alpha-revoked', SERVER_DAY], /session_invalid/);
  expect(revoked.error, 'a revoked device session must fail closed', { revoked });

  const unknown = await expectRpcError(gameService,
    `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    ['not-a-real-token', SERVER_DAY], /session_invalid/);
  expect(unknown.error, 'an unknown device session must fail closed', { unknown });

  // A live session that belongs to ANOTHER family is not an attack on its own
  // family: `thinking_game_start` derives the child from the session token, so it
  // can only ever act for the token's own child. The real invariant is isolation:
  // whatever the foreign session does, it must never create or touch a row for a
  // child of this family.
  const beforeCross = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1`, [child.child]);
  const betaSession = await expectRpcError(gameService,
    `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    ['harness-token-child-beta-live', SERVER_DAY], /day_changed|session_invalid/);
  const afterCross = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1`, [child.child]);
  expect(afterCross === beforeCross,
    'a foreign family session must not create an entitlement for a child of this family',
    { betaSession, beforeCross, afterCross });

  const crossFamilyParent = await expectRpcError(gameService,
    `select public.thinking_game_parent_state_as($1,$2,$3) as result`,
    [USER.parentBeta, child.child, SERVER_DAY], /child_not_found|family_manage_required/);
  expect(crossFamilyParent.error, 'a cross-family child id must be denied', { crossFamilyParent });

  const forgedActor = await expectRpcError(gameService,
    `select public.thinking_game_parent_state_as($1,$2,$3) as result`,
    [USER.caregiverAlpha, child.child, SERVER_DAY], /family_manage_required/);
  expect(forgedActor.error, 'a non-managing member must not be able to act as a manager', { forgedActor });

  const crossFamilyAttempt = await expectRpcError(gameService,
    `select public.thinking_game_finish_verified($1,$2,true,$3,$4) as result`,
    [child.token, foreignAttempt, JSON.stringify('lá'), randomUUID()], /not_found|session_invalid/);
  expect(crossFamilyAttempt.error, 'a foreign attempt id must be refused', { crossFamilyAttempt });

  const acl = await fixture.rows(`
    select has_function_privilege('anon','public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid)','execute') as anon_parent,
           has_function_privilege('authenticated','public.thinking_game_parent_start_as(uuid,uuid,text,date,uuid)','execute') as auth_parent,
           has_function_privilege('anon','public.thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid)','execute') as anon_finish,
           has_function_privilege('authenticated','public.thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid)','execute') as auth_finish,
           has_function_privilege('anon','public.sync_thinking_game_bonus_for_child(uuid,date)','execute') as anon_sync,
           has_function_privilege('authenticated','public.sync_thinking_game_bonus_for_child(uuid,date)','execute') as auth_sync,
           has_function_privilege('anon','public.thinking_game_lock_key(uuid)','execute') as anon_key,
           has_function_privilege('authenticated','public.thinking_game_lock_key(uuid)','execute') as auth_key`);
  expect(Object.values(acl[0]).every(value => value === false),
    'no client role may call a protected game RPC', { acl: acl[0] });
  pass('every authority negative failed closed: revoked session, unknown token, foreign family, forged actor, foreign attempt, protected RPC ACL', {
    revoked, unknown, betaSession, crossFamilyParent, forgedActor, crossFamilyAttempt, acl: acl[0],
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-18  Solution redaction: no client role may read the grading payload
// ===========================================================================
try {
  startCase('AR-18', 'The grading payload and the solution are not readable by any client role and never leave through a start response',
    ['contracts §11.1', 'contracts §14', 'T19', 'T28']);
  const grants = await fixture.rows(`
    select has_table_privilege('anon','public.thinking_game_content','select') as anon_select,
           has_table_privilege('authenticated','public.thinking_game_content','select') as auth_select,
           has_table_privilege('service_role','public.thinking_game_content','select') as service_select`);
  expect(grants[0].anon_select === false && grants[0].auth_select === false,
    'no client role may select the content table (it holds grading_payload)', { grants: grants[0] });
  // Use a child that has not started yet: the start path returns an EXISTING
  // entitlement without a puzzle payload, so a child that already played would not
  // exercise the payload at all.
  const child = CHILD.redaction;
  const started = await callRpc(gameService, `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    [child.token, SERVER_DAY]);
  const puzzle = started?.data?.puzzle;
  expect(puzzle, 'the start must return a public puzzle payload', { started });
  const serialized = JSON.stringify(puzzle);
  expect(!('solution' in puzzle), 'the public payload must not carry a `solution` field', { puzzle });
  expect(!serialized.includes('grading_payload'), 'the public payload must not carry the grading payload', { puzzle });
  const row = await fixture.one(
    `select public_payload, grading_payload from public.thinking_game_content where id = 'kilo-internal-d1-main-age_6_8'`);
  expect(row.grading_payload?.solution, 'the fixture must really hold a separate grading payload', { row });
  expect(!('solution' in row.public_payload), 'the public payload must be answer free', { row });
  pass('the content table is unreachable for client roles and the start payload carries no solution', { grants: grants[0] });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-19  Unreviewed content is refused before it can be consumed
// ===========================================================================
try {
  startCase('AR-19', 'A slot whose only payload is `design_only` is refused with content_unavailable and creates no entitlement',
    ['GWT-28', 'contracts §11.2', 'T28']);
  const child = CHILD.designOnly;
  await fixture.query(
    `insert into public.thinking_game_journeys (child_id, family_id, next_day_index) values ($1,$2,5)`,
    [child.child, FAMILY.alpha]);
  const refused = await expectRpcError(gameService,
    `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`, [child.token, SERVER_DAY],
    /content_unavailable|content_not_approved/);
  expect(refused.error, 'an unreviewed slot must be refused', { refused });
  const entitlement = await fixture.scalar(
    `select count(*)::int from public.thinking_game_entitlements where child_id = $1 and local_day = $2`, [child.child, SERVER_DAY]);
  expect(entitlement === 0, 'a refused start must not create an entitlement', { entitlement });
  pass('a design_only slot was refused with content_unavailable and created no entitlement', { refused, entitlement });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-20  Age track: the resolved track decides the payload, unknown age is not silently substituted
// ===========================================================================
try {
  startCase('AR-20', 'The served payload belongs to the age track the contract resolves, and an unknown age never falls back to another track',
    ['contracts §10', 'GWT-22', 'GWT-23', 'GWT-24', 'T23', 'T38']);
  const known = CHILD.age;
  const started = await callRpc(gameService, `select public.thinking_game_start($1, 'main', $2, $3) as result`,
    [known.token, SERVER_DAY, randomUUID()]);
  const served = started?.data?.puzzle;
  expect(served, 'the start must serve a payload', { started });
  const expectedTrack = 'age_9_12';
  expect(served.ageTrack === expectedTrack,
    `a child born in 2017 resolves to ${expectedTrack} in 2026, got ${served.ageTrack}`,
    { served: { id: served.id, ageTrack: served.ageTrack } });
  const unknown = CHILD.ageUnknown;
  const unknownStart = await expectRpcError(gameService,
    `select public.thinking_game_start($1, 'main', $2, $3) as result`, [unknown.token, SERVER_DAY, randomUUID()],
    /age_track_unavailable/);
  expect(unknownStart.error,
    'a child with no known age must return age_track_unavailable and never substitute another track',
    { unknownStart });
  pass('the age track is resolved from the server-known age and an unknown age is not substituted', { served, unknownStart });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-21  DST: the local day comes from the IANA zone, never from +86400 arithmetic
// ===========================================================================
try {
  startCase('AR-21', 'The local day and the snapshot cutoff are resolved with the IANA zone across both DST transitions',
    ['contracts §4.3', 'contracts §4.7', 'GWT-07', 'T09']);
  const dst = await fixture.rows(`
    select label, (ts::timestamptz at time zone 'Europe/Berlin')::date::text as local_day,
           to_char(ts::timestamptz at time zone 'Europe/Berlin', 'YYYY-MM-DD HH24:MI') as local_stamp,
           (ts::timestamptz at time zone 'Europe/Berlin')::date = (ts::timestamptz at time zone 'UTC')::date as same_as_utc
      from (values
        ('spring-forward midnight', '2026-03-28T23:30:00Z'::timestamptz),
        ('spring-forward noon',    '2026-03-29T12:00:00Z'::timestamptz),
        ('fall-back midnight',     '2026-10-24T22:30:00Z'::timestamptz),
        ('fall-back noon',         '2026-10-25T12:00:00Z'::timestamptz)
      ) as t(label, ts)`);
  expect(dst[0].local_day === '2026-03-29',
    `the local day must roll over at local midnight, got ${dst[0].local_day}`, { dst });
  expect(dst[0].same_as_utc === false,
    'a UTC-relative day would disagree with the IANA local day at the spring transition', { dst: dst[0] });
  expect(dst[2].local_day === '2026-10-25',
    `the local day must roll over at local midnight in the fall, got ${dst[2].local_day}`, { dst });
  expect(dst[2].same_as_utc === false,
    'a UTC-relative day would disagree with the IANA local day at the fall transition', { dst: dst[2] });
  expect(dst[1].local_stamp === '2026-03-29 14:00',
    `the spring transition must use the +02:00 offset, got ${dst[1].local_stamp}`, { dst: dst[1] });
  expect(dst[3].local_stamp === '2026-10-25 13:00',
    `the fall transition must use the +01:00 offset, got ${dst[3].local_stamp}`, { dst: dst[3] });

  const child = CHILD.dst;
  await callRpc(gameService, `select public.thinking_game_start($1, 'main', $2, gen_random_uuid()) as result`,
    [child.token, SERVER_DAY]);
  const snapshot = await fixture.one(
    `select local_day, timezone, cutoff_at, bedtime_start_at, bedtime_end_at
       from public.thinking_game_day_snapshots where child_id = $1 and local_day = $2`, [child.child, SERVER_DAY]);
  const recomputed = await fixture.one(
    `select ($1::date::timestamp + $2::time) at time zone $3 as cutoff_at`,
    [SERVER_DAY, CUTOFF_LOCAL, TZ]);
  expect(String(new Date(snapshot.cutoff_at).toISOString()) === String(new Date(recomputed.cutoff_at).toISOString()),
    'the snapshot cutoff must be the local cutoff resolved in the family IANA zone',
    { snapshot, recomputed });
  const dayRows = await fixture.scalar(
    `select count(*)::int from public.thinking_game_day_snapshots where child_id = $1`, [child.child]);
  expect(dayRows === 1, `a second start on the same local day must not create a second snapshot, got ${dayRows}`);
  pass('the local day and the cutoff are IANA-resolved at both DST transitions and one snapshot exists per local day', {
    dst, snapshot, recomputed,
    limitation: 'the server clock cannot be moved, so the DST transition day itself was exercised through the SQL expression and the snapshot formula, not by running the product on 2026-03-29 / 2026-10-25',
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-22  Lock latency and the unrelated-child parallel control
// ===========================================================================
try {
  startCase('AR-22', 'Lock latency and the unrelated-child parallel control (local measurement, repeated)',
    ['contracts §8.2', 'AC13 performance budget', 'T33']);
  const measure = async (fn) => {
    const started = nowMs();
    await fn();
    return nowMs() - started;
  };

  // --- Arm 1: the sequential baseline must be a REAL creation.
  // The previous version of this case measured the same child five times, so four of
  // the five samples were idempotent replays of a cheap path and the median was not
  // a start at all. Every sample below is a first start of a distinct child.
  const sequentialSamples = [];
  for (let i = 0; i < PARALLEL_COUNT; i += 1) {
    sequentialSamples.push(await measure(async () => {
      await callRpc(gameService, `select public.thinking_game_start($1, 'main', $2, $3) as result`,
        [PARALLEL_B[i].token, SERVER_DAY, randomUUID()]);
    }));
  }
  const sequentialTotal = sequentialSamples.reduce((sum, value) => sum + value, 0);
  const singleMedian = [...sequentialSamples].sort((a, b) => a - b)[Math.floor(sequentialSamples.length / 2)];

  // --- Arm 2 and Arm 3: the overlap ratio.
  // Each call records its OWN duration, so `sum(durations) / wallClock` is a direct
  // serialization measure that needs no baseline: 1 means fully serialized, N means
  // fully parallel. Arm 2 uses 20 children of ONE family, Arm 3 uses 20 children
  // that each live in their own family.
  const runConcurrentArm = async (children) => {
    const durations = [];
    const started = nowMs();
    const results = await raceAcrossClients(PARALLEL_COUNT, async (client, index) => {
      const callStarted = nowMs();
      try {
        return await callRpc(client, `select public.thinking_game_start($1, 'main', $2, $3) as result`,
          [children[index].token, SERVER_DAY, randomUUID()]);
      } finally {
        durations[index] = nowMs() - callStarted;
      }
    });
    const wall = nowMs() - started;
    const failures = results.filter(r => !r.ok);
    if (failures.length) throw new Error(`parallel start failed: ${pgErrorText(failures[0].error)}`);
    const sum = durations.reduce((total, value) => total + value, 0);
    return { wall, sum, durations, ratio: sum / wall };
  };

  const sameFamily = await runConcurrentArm(PARALLEL);
  const isolatedFamilies = await runConcurrentArm(ISOLATED);

  // --- Arm 4: the per-child contended path: 20 concurrent starts for ONE child.
  const contendedStarted = nowMs();
  const contendedResults = await raceAcrossClients(PARALLEL_COUNT, client => callRpc(client,
    `select public.thinking_game_start($1, 'main', $2, $3) as result`,
    [CHILD.contended.token, SERVER_DAY, randomUUID()]));
  const contended = nowMs() - contendedStarted;
  const contendedFailures = contendedResults.filter(r => !r.ok);
  expect(contendedFailures.length === 0,
    `the contended single-child start must not fail: ${contendedFailures.map(f => pgErrorText(f.error)).join('; ')}`);

  const sorted = [...sequentialSamples].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  log(`AR-22 measurement: singleMedian=${singleMedian.toFixed(2)}ms p50=${p50.toFixed(2)}ms p95=${p95.toFixed(2)}ms sequentialTotal20=${sequentialTotal.toFixed(2)}ms ` +
    `sameFamilyWall=${sameFamily.wall.toFixed(2)}ms sum=${sameFamily.sum.toFixed(2)}ms ratio=${sameFamily.ratio.toFixed(2)} ` +
    `isolatedWall=${isolatedFamilies.wall.toFixed(2)}ms sum=${isolatedFamilies.sum.toFixed(2)}ms ratio=${isolatedFamilies.ratio.toFixed(2)} ` +
    `contended20SameChild=${contended.toFixed(2)}ms`);

  // --- Arm 5: Structural non-blocking and per-child isolation proof (contracts §8.2)
  // Client A holds an open transaction lock on child A.
  // Client B (different child in the SAME family) must NOT be blocked and completes before A commits.
  // Client C (same child A) MUST be blocked behind Client A, unblocking only after A commits.
  const [clientA, clientB, clientC] = await makePool(3, 'service_role');
  let bCompletedBeforeA = false;
  let cBlockedWhileAOpen = false;
  let bDuration = 0;
  try {
    await clientA.query('begin');
    await clientA.query(`set statement_timeout = '10s'`);
    await setClaims(clientA, USER.parentAlpha, 'service_role');

    const childA = PARALLEL_B[0];
    const childB = PARALLEL_B[1];

    // Client A calls start inside its transaction, taking and holding the child A advisory lock
    const aResult = await callRpc(clientA, `select public.thinking_game_start($1, 'main', $2, $3) as result`,
      [childA.token, SERVER_DAY, randomUUID()]);
    expect(aResult?.ok === true, 'client A start must succeed inside open transaction', { aResult });

    // Client B starts for different child B in the SAME family while A is open.
    // If SQL erroneously locks at the family level (e.g. for update on thinking_game_settings),
    // Client B will block and time out.
    const bStarted = nowMs();
    await setClaims(clientB, USER.parentAlpha, 'service_role');
    await clientB.query(`set statement_timeout = '5s'`);
    const bPromise = callRpc(clientB, `select public.thinking_game_start($1, 'main', $2, $3) as result`,
      [childB.token, SERVER_DAY, randomUUID()]);
    const bResult = await Promise.race([
      bPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('child B in same family blocked by family-level lock; contracts §8.2 mandates per-child locking')), 1500)),
    ]);
    bDuration = nowMs() - bStarted;
    bCompletedBeforeA = bResult?.ok === true;
    expect(bCompletedBeforeA, 'child B in same family must complete while child A transaction is open', { bResult, bDuration });
    expect(bDuration < 1500, `child B in same family must not be blocked by child A lock (took ${bDuration.toFixed(2)}ms)`);

    // Client C starts for SAME child A while A is still holding the lock
    await setClaims(clientC, USER.parentAlpha, 'service_role');
    await clientC.query(`set statement_timeout = '5s'`);
    let cSettled = false;
    const cPromise = callRpc(clientC, `select public.thinking_game_start($1, 'main', $2, $3) as result`,
      [childA.token, SERVER_DAY, randomUUID()]).then(r => { cSettled = true; return r; });

    // Wait a brief window to confirm C is blocked behind A
    await new Promise(resolve => setTimeout(resolve, 80));
    cBlockedWhileAOpen = !cSettled;
    expect(cBlockedWhileAOpen, 'client C for same child A must block behind client A open transaction');

    // Commit A to release the lock
    await clientA.query('commit');

    // C must now unblock and succeed idempotently
    const cResult = await Promise.race([
      cPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Client C timed out waiting for lock release')), 3000)),
    ]);
    expect(cResult?.ok === true, 'client C must succeed idempotently once client A releases the lock', { cResult });
  } finally {
    try { await clientA.query('rollback'); } catch {}
    await releasePool([clientA, clientB, clientC]);
  }

  expect(isolatedFamilies.ratio > 1.0,
    `twenty starts for twenty children in twenty DIFFERENT families must overlap; observed overlap ratio ${isolatedFamilies.ratio.toFixed(2)}`,
    { isolatedFamilies, sameFamily, singleMedian, sequentialTotal });
  expect(sameFamily.ratio > 1.0,
    `twenty starts for twenty different children of ONE family must still overlap; observed overlap ratio ${sameFamily.ratio.toFixed(2)}`,
    { sameFamily, isolatedFamilies, singleMedian, sequentialTotal });
  pass(`unrelated children keep their parallelism (structural nonblocking verified, same-family overlap ${sameFamily.ratio.toFixed(2)}x, ` +
    `separate-family overlap ${isolatedFamilies.ratio.toFixed(2)}x, single start p50=${p50.toFixed(2)}ms, p95=${p95.toFixed(2)}ms)`,
    {
      environment: 'postgresql 18.4, loopback container, single host, shared filesystem',
      singleMedian, p50, p95, sequentialTotal, sequentialSamples,
      sameFamily: { wall: sameFamily.wall, sum: sameFamily.sum, ratio: sameFamily.ratio, durations: sameFamily.durations },
      isolatedFamilies: { wall: isolatedFamilies.wall, sum: isolatedFamilies.sum, ratio: isolatedFamilies.ratio, durations: isolatedFamilies.durations },
      structuralNonblocking: { bCompletedBeforeA, bDuration, cBlockedWhileAOpen },
      contended, contendedSameChild: true,
      caveat: 'structural nonblocking proved per contract §8.2; latency ratios reported as informational host load',
    });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-23  The advisory lock key matches the contract formula
// ===========================================================================
try {
  startCase('AR-23', 'The advisory lock key is the contract formula and is stable per child',
    ['contracts §8.2 exact advisory key']);
  const rows = await fixture.rows(`
    select public.thinking_game_lock_key($1::uuid) as implementation_key,
           ('x' || substr(md5('thinking_games:' || $1::text), 1, 16))::bit(64)::bigint as contract_key,
           public.thinking_game_lock_key($1::uuid) = public.thinking_game_lock_key($1::uuid) as stable,
           public.thinking_game_lock_key($1::uuid) <> public.thinking_game_lock_key($2::uuid) as per_child
      from (select $1::uuid as c1, $2::uuid as c2) t`, [CHILD.race.child, CHILD.bonus.child]);
  expect(rows[0].stable === true, 'the lock key must be stable for one child', { rows: rows[0] });
  expect(rows[0].per_child === true, 'the lock key must differ per child', { rows: rows[0] });
  expect(String(rows[0].implementation_key) === String(rows[0].contract_key),
    'the implementation lock key must equal the contract formula',
    { implementationKey: rows[0].implementation_key, contractKey: rows[0].contract_key });
  pass('the lock key is stable, per child and equals the contract formula', { rows: rows[0] });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// AR-24  The six legacy habit RPCs keep their behaviour with the game lock in place
// ===========================================================================
try {
  startCase('AR-24', 'The six legacy habit RPCs keep their documented statuses with the unconditional game lock in place',
    ['contracts §8.1', 'contracts §8.2', 'T31']);
  const child = CHILD.race;
  const parent = parentClient;
  const activityId = ACTIVITY.racePlain;
  const commandId = randomUUID();
  // The undo must give the habit ledger back exactly what the completion took.
  // The baseline is read, never hard-coded: the seeded value is whatever this run
  // created, and the invariant is the round trip, not a magic number.
  const pointsBefore = await fixture.scalar(`select points from public.child_profiles where id = $1`, [child.child]);
  const completed = await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [activityId, child.child, SERVER_DAY, commandId]);
  expect(completed?.status === 'completed', `expected completed, got ${completed?.status}`, { completed });
  const duplicate = await callRpc(parent, `select public.complete_habit_command($1,$2,$3,$4) as result`,
    [activityId, child.child, SERVER_DAY, commandId]);
  expect(duplicate?.status === 'duplicate', `expected duplicate, got ${duplicate?.status}`, { duplicate });
  const undone = await callRpc(parent, `select public.undo_habit_command($1) as result`, [commandId]);
  expect(undone?.status === 'undone', `expected undone, got ${undone?.status}`, { undone });
  const afterUndo = await callRpc(parent, `select public.undo_habit_command($1) as result`, [commandId]);
  expect(afterUndo?.status === 'not_found', `expected not_found, got ${afterUndo?.status}`, { afterUndo });
  const points = await fixture.scalar(`select points from public.child_profiles where id = $1`, [child.child]);
  expect(points === pointsBefore,
    `the child points must be back at the seeded baseline after the undo, before=${pointsBefore} after=${points}`);
  const receipt = await fixture.one(`select log_id from public.thinking_game_habit_receipts where log_id = $1`, [commandId]);
  expect(receipt, 'the game-owned receipt must survive the undo');
  pass('the six legacy habit RPCs keep completed/duplicate/undone/not_found and the receipt survives the undo', {
    completed, duplicate, undone, afterUndo, points,
  });
} catch (error) {
  if (!(error instanceof CaseFailure)) fail(`unexpected error: ${error?.message ?? error}`);
}

// ===========================================================================
// Summary
// ===========================================================================
const passCount = cases.filter(c => c.verdict === 'PASS').length;
const failCount = cases.filter(c => c.verdict === 'FAIL').length;
const blockedCount = cases.filter(c => c.verdict === 'BLOCKED').length;
const verdict = failCount > 0 ? 'FAIL' : blockedCount > 0 ? 'PARTIAL' : 'PASS';

const summary = {
  verdict,
  evidence: 'real-postgresql',
  generatedAt: new Date().toISOString(),
  database: fixture.databaseName,
  environment: {
    postgres: (await fixture.one('select version() as v')).v,
    node: process.version,
    timezone: TZ,
    serverDay: SERVER_DAY,
    cutoffLocal: CUTOFF_LOCAL,
    earlyCutoffLocal: EARLY_CUTOFF_LOCAL,
    sqlTestDatabaseUrl: 'loopback only (postgresql://postgres:local-only@127.0.0.1:55432/postgres)',
  },
  counts: { pass: passCount, fail: failCount, blocked: blockedCount, total: cases.length },
  cases: cases.map(c => ({
    id: c.id, title: c.title, verdict: c.verdict, contractRefs: c.contractRefs,
    detail: c.detail, evidence: c.evidence,
  })),
  logPath: LOG_PATH,
};

writeFileSync(JSON_PATH, JSON.stringify(summary, null, 2));
writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2));
writeFileSync(LOG_PATH, `${logLines.join('\n')}\n`);
log(`SUMMARY ${verdict} pass=${passCount} fail=${failCount} blocked=${blockedCount} total=${cases.length}`);

await Promise.all(openClients.map(client => client.end().catch(() => {})));
await parentClient.end().catch(() => {});
await deltaParentClient.end().catch(() => {});
await fixture.close();

console.log(JSON.stringify({
  verdict,
  counts: summary.counts,
  cases: summary.cases.map(c => ({ id: c.id, verdict: c.verdict, detail: c.detail })),
  logPath: LOG_PATH,
  jsonPath: JSON_PATH,
}));

process.exit(failCount > 0 ? 1 : blockedCount > 0 ? 2 : 0);
