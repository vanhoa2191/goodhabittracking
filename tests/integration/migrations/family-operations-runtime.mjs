// Local, disposable PostgreSQL WASM regression harness; never connects to Supabase.
// npm install --prefix /tmp/fix-ops-db --no-save @electric-sql/pglite@0.3.14
// PGLITE_MODULE_PATH=/tmp/fix-ops-db/node_modules/@electric-sql/pglite/dist/index.js node tests/integration/migrations/family-operations-runtime.mjs
// OPS_RUNTIME_BASELINE=1 demonstrates failures against the latest pre-fix definitions.
import { readFileSync, readdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const { PGlite } = await import(process.env.PGLITE_MODULE_PATH ?? '@electric-sql/pglite');
const baseline = process.env.OPS_RUNTIME_BASELINE === '1';
const migrationPath = 'supabase/migrations/202610090030_family_operations_hardening.sql';
const baselineFiles = readdirSync('supabase/migrations').filter((name) => name.endsWith('.sql') && !name.startsWith('20261009003')).sort();
const names = ['complete_habit_command', 'complete_child_habit_command', 'undo_habit_command', 'undo_child_habit_command',
  'review_habit_command', 'redeem_reward_command', 'redeem_child_reward_command', 'transition_redemption_command',
  'get_parent_pin_status', 'verify_parent_pin', 'set_parent_pin', 'claim_lifecycle_messages', 'get_child_session', 'open_daily_mascot_letter'];
const oldDefinitions = names.map((name) => {
  let definition;
  for (const file of baselineFiles) {
    const match = readFileSync(`supabase/migrations/${file}`, 'utf8').match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`, 'i'));
    if (match) definition = match[0];
  }
  assert.ok(definition, name);
  return definition;
}).join('\n');
const family = '00000000-0000-4000-8000-000000000001';
const child = '00000000-0000-4000-8000-000000000002';
const activity = '00000000-0000-4000-8000-000000000003';
const reward = '00000000-0000-4000-8000-000000000004';
const user = '00000000-0000-4000-8000-000000000005';
const uuid = () => crypto.randomUUID();
const fixture = `
create role anon; create role authenticated; create role service_role;
create schema auth; create schema extensions;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql as $$ select '${user}'::uuid $$;
create function public.current_family_id() returns uuid language sql as $$ select '${family}'::uuid $$;
create function public.can_manage_family(uuid) returns boolean language sql as $$ select $1 = '${family}'::uuid $$;
-- Stub cryptographic primitives only: tests cover RPC locking/version contracts, not bcrypt.
create function extensions.crypt(text,text) returns text language sql as $$ select $1 $$;
create function extensions.gen_salt(text,integer) returns text language sql as $$ select 'salt' $$;
create table families (id uuid primary key);
create table child_profiles (id uuid primary key, family_id uuid, points integer default 100, total_earned integer default 100,
 level integer default 2, streak integer default 0, last_active_date date, name text, nickname text, avatar text,
 theme_color text, birth_year integer, age_stage text, age_band_override text, league_tier text, created_at timestamptz default now());
create table habit_activities (id uuid primary key, family_id uuid, child_id uuid, user_id uuid, points integer default 10,
 requires_approval boolean default false, is_active boolean default true, recurrence_type text default 'daily', recurrence_days integer[],
 title text, description text, instructions text, icon text, category text, time_of_day text, duration_minutes integer,
 target_age_stage text, is_parent_role boolean, portrait16_key text, bo_thi7_key text, framework_habit_id text, framework_content_version text,
 legacy_template_id text, graduated_at timestamptz, offered_for_focus boolean, created_at timestamptz default now());
create table activity_logs (id uuid primary key, family_id uuid, user_id uuid, activity_id uuid, child_id uuid,
 log_date date, status text, points_awarded integer, completed_at timestamptz default now(), proof_note text,
 unique(activity_id, child_id, log_date));
create table rewards (id uuid primary key, family_id uuid, stock integer default 1, cost_points integer default 40,
 is_active boolean default true, title text, description text, icon text, created_at timestamptz default now());
create table redemptions (id uuid primary key, family_id uuid, user_id uuid, reward_id uuid references rewards(id) on delete cascade,
 child_id uuid, points_spent integer, status text, resolved_at timestamptz, requested_at timestamptz default now());
create table device_sessions (id uuid primary key, family_id uuid, child_id uuid, token_hash text, revoked_at timestamptz,
 expires_at timestamptz, capabilities text[], last_seen_at timestamptz);
create table child_weekly_focus (family_id uuid, child_id uuid, week_start date, activity_ids uuid[], chosen_by text);
create table daily_mascot_letters (family_id uuid, child_id uuid, local_date date, template_key text, read_at timestamptz, unique(child_id,local_date));
create table parent_settings (family_id uuid primary key, parent_pin_hash text, parent_pin_configured_at timestamptz,
 parent_pin_failed_attempts integer default 0, parent_pin_locked_until timestamptz, updated_at timestamptz);
create table parent_profiles (user_id uuid primary key, marketing_consent boolean);
create table lifecycle_outbox (id uuid primary key, user_id uuid, status text, locked_at timestamptz, updated_at timestamptz,
 last_error_code text, attempts integer, category text, available_at timestamptz, created_at timestamptz,
 template_key text, locale text, payload jsonb, dedupe_key text);
create table email_suppressions (user_id uuid, scope text);
grant all on habit_activities to authenticated;
`;
async function database() {
  const db = new PGlite();
  await db.exec(fixture);
  await db.exec(oldDefinitions);
  await db.exec(`revoke all on function transition_redemption_command(uuid,text) from public, anon, authenticated, service_role;
  grant execute on function get_child_session(text) to anon,authenticated;
  grant execute on function get_parent_pin_status(uuid) to authenticated;
  grant execute on function verify_parent_pin(uuid,text) to authenticated;
  grant execute on function set_parent_pin(uuid,text,text) to authenticated;
  revoke all on function claim_lifecycle_messages(integer) from public,anon,authenticated;
  grant execute on function claim_lifecycle_messages(integer) to service_role;`);
  if (!baseline) await db.exec(readFileSync(migrationPath, 'utf8'));
  await db.exec(`insert into families values ('${family}'); insert into auth.users values ('${user}','parent@example.test');
    insert into child_profiles(id,family_id) values ('${child}','${family}');
    insert into habit_activities(id,family_id,child_id,recurrence_days) values ('${activity}','${family}','${child}',array[0,1,2,3,4,5,6]);
    insert into rewards(id,family_id) values ('${reward}','${family}');
    insert into device_sessions values ('${uuid()}','${family}','${child}','token',null,now()+interval '1 day',array['child:read','child:complete'],timestamp '2000-01-01');`);
  return db;
}
async function scalar(db, sql, args=[]) { return (await db.query(sql,args)).rows[0].value; }
async function command(db, name, args) {
  return scalar(db, `select public.${name}(${args.map((_,i)=>`$${i+1}`).join(',')}) as value`, args);
}
let failures = 0;
async function test(name, work) {
  const db = await database();
  try { await work(db); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.log(`FAIL ${name}: ${error.message}`); }
  finally { await db.close(); }
}
await test('O1 authenticated direct activity policy write is denied', async (db) => {
  assert.equal(await scalar(db,"select has_table_privilege('authenticated','habit_activities','UPDATE') as value"), false);
});
await test('O2 off-schedule child rejected; parent backfill accepted', async (db) => {
  await db.exec("update habit_activities set recurrence_type='custom',recurrence_days=array[(extract(dow from current_date)::integer+1)%7]");
  const today = await scalar(db,'select current_date::text as value');
  await assert.rejects(command(db,'complete_child_habit_command',['token',activity,today,uuid()]), /activity_not_scheduled/);
  assert.equal(await scalar(db,'select count(*)::integer as value from activity_logs'), 0);
  assert.equal((await command(db,'complete_habit_command',[activity,child,today,uuid()])).status, 'completed');
});
await test('O2 daily/weekday/weekend/custom due dates accepted and excluded weekdays rejected', async (db) => {
  const days = (await db.query('select day::date::text as date, extract(dow from day)::integer as dow from generate_series(current_date-2,current_date+1,interval \'1 day\') day')).rows;
  for (const type of ['daily','weekdays','weekends','custom']) {
    for (const day of days) {
      await db.exec('delete from activity_logs');
      await db.query('update habit_activities set recurrence_type=$1,recurrence_days=array[1,3,5]',[type]);
      const due = type === 'daily' || (type === 'weekdays' && day.dow >= 1 && day.dow <= 5)
        || (type === 'weekends' && [0,6].includes(day.dow)) || (type === 'custom' && [1,3,5].includes(day.dow));
      const call = command(db,'complete_child_habit_command',['token',activity,day.date,uuid()]);
      if (due) assert.equal((await call).status,'completed'); else await assert.rejects(call,/activity_not_scheduled/);
    }
  }
});
await test('O2 malformed custom days fail closed', async (db) => {
  const today = await scalar(db,'select current_date::text as value');
  await db.exec("update habit_activities set recurrence_type='custom',recurrence_days=null");
  await assert.rejects(command(db,'complete_child_habit_command',['token',activity,today,uuid()]),/activity_not_scheduled/);
});
await test('O3 delete refunds pending and approved, excludes delivered/rejected, audits surviving cascade', async (db) => {
  for (const status of ['pending','approved','delivered','rejected']) {
    await db.query('insert into redemptions(id,family_id,reward_id,child_id,points_spent,status) values ($1,$2,$3,$4,40,$5)',[uuid(),family,reward,child,status]);
  }
  await db.exec(`delete from rewards where id='${reward}'`);
  assert.equal(await scalar(db,`select points as value from child_profiles where id='${child}'`),180);
  assert.equal(await scalar(db,'select count(*)::integer as value from redemptions'),0);
  assert.equal(await scalar(db,"select count(*)::integer as value from reward_refund_events where reason='reward_deleted'"),2);
});
await test('O4 verify/set returns its own version rather than later status', async (db) => {
  const initial = await command(db,'set_parent_pin',[family,null,'1234']);
  assert.ok(initial.version);
  const verified = await command(db,'verify_parent_pin',[family,'1234']);
  assert.equal(verified.version, initial.version);
  const next = await command(db,'set_parent_pin',[family,'1234','5678']);
  assert.ok(next.version);
  assert.notEqual(next.version,verified.version);
  assert.equal((await command(db,'get_parent_pin_status',[family])).version,next.version);
  assert.equal((await command(db,'verify_parent_pin',[family,'1234'])).status,'invalid');
});
await test('O5 finite rejection restores one slot and points exactly once (parent and child)', async (db) => {
  for (const mode of ['parent','child']) {
    await db.exec('update rewards set stock=1');
    const id=uuid();
    await command(db, mode==='parent'?'redeem_reward_command':'redeem_child_reward_command',mode==='parent'?[reward,child,id]:['token',reward,id]);
    assert.equal(await scalar(db,'select stock as value from rewards'),0);
    await command(db,'transition_redemption_command',[id,'reject']);
    assert.equal(await scalar(db,'select stock as value from rewards'),1);
    assert.equal(await scalar(db,'select points as value from child_profiles'),100);
    assert.equal((await command(db,'transition_redemption_command',[id,'reject'])).status,'invalid_transition');
    assert.equal(await scalar(db,'select stock as value from rewards'),1);
  }
});
await test('O5 infinite reservation stays infinite; switching to finite does not invent a slot', async (db) => {
  await db.exec('update rewards set stock=-1');
  const id=uuid(); await command(db,'redeem_reward_command',[reward,child,id]);
  await db.exec('update rewards set stock=3');
  await command(db,'transition_redemption_command',[id,'reject']);
  assert.equal(await scalar(db,'select stock as value from rewards'),3);
});
await test('O6 zero-star completion, approval, backfill and undo recompute distinct verified days', async (db) => {
  const today=await scalar(db,'select current_date::text as value');
  const yesterday=await scalar(db,'select (current_date-1)::text as value');
  await db.exec('update habit_activities set points=0');
  const todayId=uuid(); await command(db,'complete_habit_command',[activity,child,today,todayId]);
  assert.equal(await scalar(db,'select streak as value from child_profiles'),1);
  const priorId=uuid(); await command(db,'complete_habit_command',[activity,child,yesterday,priorId]);
  assert.equal(await scalar(db,'select streak as value from child_profiles'),2);
  assert.equal(await scalar(db,'select last_active_date::text as value from child_profiles'),today);
  await command(db,'undo_habit_command',[todayId]);
  assert.equal(await scalar(db,'select streak as value from child_profiles'),1);
  assert.equal(await scalar(db,'select last_active_date::text as value from child_profiles'),yesterday);
  await db.exec('update habit_activities set requires_approval=true');
  const pendingId=uuid(); await command(db,'complete_habit_command',[activity,child,today,pendingId]);
  assert.equal(await scalar(db,'select streak as value from child_profiles'),1);
  await command(db,'review_habit_command',[pendingId,'approve']);
  assert.equal(await scalar(db,'select streak as value from child_profiles'),2);
});
await test('O6 child zero-star completion and undo repair cache', async (db) => {
  const today=await scalar(db,'select current_date::text as value');
  await db.exec('update habit_activities set points=0');
  const id=uuid(); await command(db,'complete_child_habit_command',['token',activity,today,id]);
  assert.equal(await scalar(db,'select streak as value from child_profiles'),1);
  await command(db,'undo_child_habit_command',['token',id]);
  assert.equal(await scalar(db,'select streak as value from child_profiles'),0);
  assert.equal(await scalar(db,'select last_active_date::text as value from child_profiles'),null);
});
await test('O7 reclaim applies suppression and revoked marketing consent, leaves fresh processing alone', async (db) => {
  await db.exec(`insert into parent_profiles values ('${user}',false);
    insert into lifecycle_outbox(id,user_id,status,locked_at,attempts,category,available_at,created_at) values
    ('${uuid()}','${user}','processing',now()-interval '11 minutes',1,'marketing',now()-interval '1 day',now());`);
  assert.equal((await db.query('select * from claim_lifecycle_messages(25)')).rows.length,0);
  assert.equal(await scalar(db,'select status as value from lifecycle_outbox'),'suppressed');
  await db.exec(`delete from lifecycle_outbox; insert into email_suppressions values ('${user}','all');
    insert into lifecycle_outbox(id,user_id,status,locked_at,attempts,category,available_at,created_at) values
    ('${uuid()}','${user}','processing',now()-interval '11 minutes',1,'transactional',now()-interval '1 day',now()),
    ('${uuid()}','${user}','processing',now(),1,'transactional',now()-interval '1 day',now());`);
  assert.equal((await db.query('select * from claim_lifecycle_messages(25)')).rows.length,0);
  assert.equal(await scalar(db,"select count(*)::integer as value from lifecycle_outbox where status='suppressed'"),1);
  assert.equal(await scalar(db,"select count(*)::integer as value from lifecycle_outbox where status='processing'"),1);
});
await test('S1 GET session leaves last_seen unchanged and POST touch updates it', async (db) => {
  const before=await scalar(db,'select last_seen_at::text as value from device_sessions');
  assert.ok(await command(db,'get_child_session',['token']));
  assert.equal(await scalar(db,'select last_seen_at::text as value from device_sessions'),before);
  assert.equal(await command(db,'touch_child_session',['token']),true);
  assert.notEqual(await scalar(db,'select last_seen_at::text as value from device_sessions'),before);
});
await test('S2 preview creates no letter; POST creates and reads it exactly once', async (db) => {
  const today=await scalar(db,'select current_date::text as value');
  const preview=await command(db,'open_daily_mascot_letter',[child,today,false,'token']);
  assert.equal(preview.status,'ready');
  assert.equal(await scalar(db,'select count(*)::integer as value from daily_mascot_letters'),0);
  const opened=await command(db,'open_daily_mascot_letter',[child,today,true,'token']);
  assert.equal(opened.template_key,preview.template_key); assert.equal(opened.newly_read,true);
  assert.equal((await command(db,'open_daily_mascot_letter',[child,today,true,'token'])).newly_read,false);
});
await test('S3 PIN status with no settings row returns unconfigured without insertion', async (db) => {
  assert.equal((await command(db,'get_parent_pin_status',[family])).configured,false);
  assert.equal(await scalar(db,'select count(*)::integer as value from parent_settings'),0);
});
if (!baseline) await test('migration catalog preflight passes with closed original command grants', async (db) => {
  await db.exec(readFileSync('supabase/preflight/202610090030_family_operations_hardening.verify.sql','utf8'));
});
console.log(`${baseline?'BASELINE':'FIXED'}: ${failures} failures`);
process.exitCode = failures ? 1 : 0;
