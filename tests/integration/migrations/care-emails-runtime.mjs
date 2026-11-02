import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'care-emails' });
const { identities: ids } = fixture;
const check = (condition, message) => { if (!condition) throw new Error(message); };
const count = async (sql, params) => Number(await fixture.scalar(sql, params));
const A = ids.families.alpha;
const B = ids.families.beta;

try {
  // Stubs for the parts of the lifecycle migration's dependencies that the baseline fixture lacks.
  await fixture.exec(`
    alter table public.parent_profiles add column if not exists display_name text, add column if not exists phone text;
    create table if not exists public.payment_orders (order_code bigint primary key, user_id uuid, family_id uuid, plan_id text, amount integer, status text);
    create table if not exists public.user_subscriptions (user_id uuid, family_id uuid, plan text, status text, trial_ends_at timestamptz, updated_at timestamptz default now());
    create table if not exists public.billing_support_cases (id uuid primary key default gen_random_uuid(), family_id uuid, user_id uuid, case_type text, status text, resolution_code text, order_code bigint);
  `);
  const lifecycle = (await readFile('supabase/migrations/202609280001_lifecycle_revenue_operations.sql', 'utf8'))
    // Only the outbox, suppression table and enqueue function matter here.
    .split('create table if not exists public.billing_support_cases')[0] + '\ncommit;';
  await fixture.exec(lifecycle.replace(/create or replace function public\.schedule_trial_ending_messages[\s\S]*$/, 'commit;'));
  await fixture.exec(await readFile('supabase/migrations/202611020001_child_space.sql', 'utf8'));
  const migration = await readFile('supabase/migrations/202611030002_care_emails.sql', 'utf8');
  await fixture.exec(migration);
  await fixture.exec(migration); // replay is harmless

  await fixture.exec(`
    insert into public.parent_profiles (user_id, marketing_consent) values ('${ids.users.parentAlpha}', true), ('${ids.users.parentBeta}', true)
      on conflict (user_id) do update set marketing_consent = true;
    update public.families set created_at = now() - interval '4 days';
    update public.family_memberships set role = 'owner' where user_id in ('${ids.users.parentAlpha}', '${ids.users.parentBeta}');
  `);
  const careRows = (family) => count(`select count(*) from public.lifecycle_outbox where family_id=$1 and template_key like 'care\\_%'`, [family]);

  // Week 1 tips: no active task, family 3-7 days old.
  check(await fixture.scalar(`select public.schedule_care_messages()`) >= 1, 'no care message queued');
  const first = await fixture.one(`select template_key, category, locale, payload, dedupe_key, user_id from public.lifecycle_outbox where family_id=$1`, [A]);
  check(first.template_key === 'care_week1_tips' && first.category === 'marketing', `unexpected first message ${first.template_key}/${first.category}`);
  check(first.user_id === ids.users.parentAlpha, 'not addressed to the owner');
  check(/^care\/care_week1_tips\/.+\/\d{4}-W\d{2}$/.test(first.dedupe_key), `dedupe key shape ${first.dedupe_key}`);

  // Cap: re-running, and any other template, adds nothing within 7 days.
  await fixture.exec(`select public.schedule_care_messages()`);
  check(await careRows(A) === 1, 'rerun duplicated');
  check(await fixture.scalar(`select public.enqueue_care_message($1, 'care_space_alert', '{"status":"watch"}'::jsonb)`, [A]) === null, 'second care message inside 7 days');
  await fixture.exec(`update public.lifecycle_outbox set created_at = now() - interval '8 days' where family_id = '${A}'`);
  check(await fixture.scalar(`select public.enqueue_care_message($1, 'care_space_alert', '{"status":"watch"}'::jsonb)`, [A]) !== null, 'cap did not expire after 7 days');

  // Suppression and withdrawn consent block enqueue (clear beta's own week-1 row so the cap is not what blocks it).
  await fixture.exec(`delete from public.lifecycle_outbox where family_id = '${B}'`);
  await fixture.exec(`insert into public.email_suppressions (user_id, scope, reason) values ('${ids.users.parentBeta}', 'marketing', 'unsubscribe')`);
  check(await fixture.scalar(`select public.enqueue_care_message($1, 'care_weekly_summary', '{"completedCount":3,"activeDays":2}'::jsonb)`, [B]) === null, 'suppressed owner was queued');
  await fixture.exec(`delete from public.email_suppressions; update public.parent_profiles set marketing_consent = false where user_id = '${ids.users.parentBeta}'`);
  check(await fixture.scalar(`select public.enqueue_care_message($1, 'care_weekly_summary', '{}'::jsonb)`, [B]) === null, 'non-consenting owner was queued');
  check(await careRows(B) === 0, 'rows created for blocked family');

  // Only care templates and aggregate payload keys are accepted.
  let rejected = 0;
  try { await fixture.exec(`select public.enqueue_care_message('${B}', 'welcome_setup')`); } catch { rejected += 1; }
  try { await fixture.exec(`select public.enqueue_lifecycle_message('${ids.users.parentAlpha}', '${A}', 'care_space_alert', 'marketing', 'vi', '{"note":"x"}'::jsonb, 'k-bad')`); } catch { rejected += 1; }
  check(rejected === 2, 'forbidden template or payload key accepted');

  // Mood snapshot returns only date and mood for low moods of eligible families.
  await fixture.exec(`update public.parent_profiles set marketing_consent = true where user_id = '${ids.users.parentBeta}'`);
  await fixture.exec(`insert into public.child_space_moods (family_id, child_id, local_date, mood, reason) values
    ('${A}', '${ids.children.alpha}', (now() at time zone 'Asia/Ho_Chi_Minh')::date, 'sad', 'friends'),
    ('${A}', '${ids.children.alpha}', (now() at time zone 'Asia/Ho_Chi_Minh')::date - 1, 'happy', null)`);
  const snapshot = await fixture.rows(`select * from public.care_space_mood_snapshot()`);
  check(snapshot.length === 1 && Object.keys(snapshot[0]).sort().join() === 'child_id,family_id,local_date,mood', 'snapshot shape leaks columns');

  // Inactive child: active task and no completion for 3 days -> nudge; a completion yesterday -> none.
  await fixture.exec(`delete from public.lifecycle_outbox where family_id = '${B}'`);
  await fixture.exec(`insert into public.habit_activities (id, family_id, child_id, title) values ('dddddddd-0000-4000-8000-00000000000b', '${B}', '${ids.children.beta}', 'x')`);
  await fixture.exec(`select public.schedule_care_messages()`);
  check(await fixture.scalar(`select template_key from public.lifecycle_outbox where family_id=$1`, [B]) === 'care_child_inactive', 'inactive nudge not queued');
  await fixture.exec(`delete from public.lifecycle_outbox where family_id = '${B}'`);
  await fixture.exec(`insert into public.activity_logs (id, family_id, child_id, activity_id, log_date, status, completed_at) values ('ffffffff-0000-4000-8000-00000000000b', '${B}', '${ids.children.beta}', 'dddddddd-0000-4000-8000-00000000000b', (now() at time zone 'Asia/Ho_Chi_Minh')::date - 1, 'completed', now())`);
  await fixture.exec(`select public.schedule_care_messages()`);
  check(await count(`select count(*) from public.lifecycle_outbox where family_id=$1 and template_key='care_child_inactive'`, [B]) === 0, 'nudged a family whose child completed a task yesterday');

  // Producers are service-only.
  let denied = 0;
  for (const call of [`select public.schedule_care_messages()`, `select public.care_space_mood_snapshot()`]) {
    await fixture.exec(`set role authenticated`);
    try { await fixture.exec(call); } catch { denied += 1; } finally { await fixture.exec(`reset role`); }
  }
  check(denied === 2, 'authenticated could call a care producer');

  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', database: fixture.databaseName }));
} finally {
  await fixture.close();
}
