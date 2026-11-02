import { readFile } from 'node:fs/promises';
import { createThinkingGamesFixture, BASELINE_SCHEMA_SQL } from '../../../scripts/thinking-games-sql-fixture.mjs';

const fixture = await createThinkingGamesFixture({ schema: BASELINE_SCHEMA_SQL, label: 'onboarding-emails' });
const { identities: ids } = fixture;
const check = (condition, message) => { if (!condition) throw new Error(message); };
const count = async (sql, params) => Number(await fixture.scalar(sql, params));
const A = ids.families.alpha;
const B = ids.families.beta;

try {
  await fixture.exec(`
    alter table public.parent_profiles add column if not exists display_name text, add column if not exists phone text;
    create table if not exists public.payment_orders (order_code bigint primary key, user_id uuid, family_id uuid, plan_id text, amount integer, status text);
    create table if not exists public.user_subscriptions (user_id uuid, family_id uuid, plan text, status text, trial_ends_at timestamptz, updated_at timestamptz default now());
    create table if not exists public.billing_support_cases (id uuid primary key default gen_random_uuid(), family_id uuid, user_id uuid, case_type text, status text, resolution_code text, order_code bigint);
  `);
  const lifecycle = (await readFile('supabase/migrations/202609280001_lifecycle_revenue_operations.sql', 'utf8'))
    .split('create table if not exists public.billing_support_cases')[0] + '\ncommit;';
  await fixture.exec(lifecycle.replace(/create or replace function public\.schedule_trial_ending_messages[\s\S]*$/, 'commit;'));
  await fixture.exec(await readFile('supabase/migrations/202611020001_child_space.sql', 'utf8'));
  await fixture.exec(await readFile('supabase/migrations/202611030002_care_emails.sql', 'utf8'));
  const migration = await readFile('supabase/migrations/202611040001_onboarding_emails.sql', 'utf8');
  await fixture.exec(migration);
  await fixture.exec(migration); // replay is harmless

  await fixture.exec(`
    insert into public.parent_profiles (user_id, marketing_consent) values ('${ids.users.parentAlpha}', true), ('${ids.users.parentBeta}', true)
      on conflict (user_id) do update set marketing_consent = true;
    update public.family_memberships set role = 'owner' where user_id in ('${ids.users.parentAlpha}', '${ids.users.parentBeta}');
    update public.families set created_at = now() - interval '36 hours';
  `);
  const rows = (family) => fixture.rows(`select template_key, category, locale, payload, dedupe_key, user_id from public.lifecycle_outbox where family_id=$1 and template_key like 'onboarding\\_%' order by template_key`, [family]);
  const age = (interval) => fixture.exec(`update public.families set created_at = now() - interval '${interval}'; update public.lifecycle_outbox set created_at = created_at - interval '2 days'`);

  // Day 1: queued once, owner, marketing, once-per-family dedupe key.
  check(await fixture.scalar(`select public.schedule_onboarding_messages()`) >= 2, 'day1 not queued');
  let a = await rows(A);
  check(a.length === 1 && a[0].template_key === 'onboarding_day1' && a[0].category === 'marketing', 'unexpected day1 row');
  check(a[0].user_id === ids.users.parentAlpha, 'not addressed to the owner');
  check(a[0].dedupe_key === `onboarding/onboarding_day1/${A}`, `dedupe key ${a[0].dedupe_key}`);
  await fixture.exec(`select public.schedule_onboarding_messages()`);
  check((await rows(A)).length === 1, 'rerun duplicated day1');

  // Too early for day 3, too old for day 1 and not yet day 7.
  await fixture.exec(`update public.families set created_at = now() - interval '2 days'`);
  await fixture.exec(`select public.schedule_onboarding_messages()`);
  check((await rows(A)).length === 1, 'day3 queued too early');

  // Day 3: another calendar day (day1 row moved back), family now 3.5 days old.
  await age('84 hours');
  await fixture.exec(`select public.schedule_onboarding_messages()`);
  check((await rows(A)).map((r) => r.template_key).join() === 'onboarding_day1,onboarding_day3', 'day3 not queued');

  // 1 per Vietnam day: day7 due while the day3 row is from today -> blocked, retried the next day.
  await fixture.exec(`update public.families set created_at = now() - interval '8 days'`);
  await fixture.exec(`select public.schedule_onboarding_messages()`);
  check(!(await rows(A)).some((r) => r.template_key === 'onboarding_day7'), 'second onboarding mail on the same day');
  await fixture.exec(`update public.lifecycle_outbox set created_at = now() - interval '1 day' where family_id = '${A}'`);
  await fixture.exec(`select public.schedule_onboarding_messages()`);
  check((await rows(A)).map((r) => r.template_key).join() === 'onboarding_day1,onboarding_day3,onboarding_day7', 'day7 not queued after the day rolled over');

  // Never back-filled: a long-standing family gets nothing, and nothing repeats.
  await fixture.exec(`update public.families set created_at = now() - interval '40 days'; update public.lifecycle_outbox set created_at = now() - interval '5 days'`);
  await fixture.exec(`delete from public.lifecycle_outbox where family_id = '${B}'`);
  await fixture.exec(`select public.schedule_onboarding_messages()`);
  check((await rows(B)).length === 0 && (await rows(A)).length === 3, 'old family back-filled or repeated');

  // Not subject to the 7-day care cap: a care mail 2 days ago does not block, one today does (both directions).
  await fixture.exec(`update public.families set created_at = now() - interval '2 days' where id = '${B}'`);
  await fixture.exec(`insert into public.lifecycle_outbox (user_id, family_id, template_key, category, locale, payload, dedupe_key, created_at)
    values ('${ids.users.parentBeta}', '${B}', 'care_weekly_summary', 'marketing', 'vi', '{}', 'k-care-old', now() - interval '2 days')`);
  check(await fixture.scalar(`select public.enqueue_onboarding_message($1, 'onboarding_day1')`, [B]) !== null, 'care cap applied to onboarding');
  await fixture.exec(`delete from public.lifecycle_outbox where family_id = '${B}'`);
  await fixture.exec(`insert into public.lifecycle_outbox (user_id, family_id, template_key, category, locale, payload, dedupe_key)
    values ('${ids.users.parentBeta}', '${B}', 'care_weekly_summary', 'marketing', 'vi', '{}', 'k-care-today')`);
  check(await fixture.scalar(`select public.enqueue_onboarding_message($1, 'onboarding_day1')`, [B]) === null, 'onboarding sent on the same day as a care mail');
  await fixture.exec(`delete from public.lifecycle_outbox where family_id = '${B}'`);
  check(await fixture.scalar(`select public.enqueue_onboarding_message($1, 'onboarding_day1')`, [B]) !== null, 'onboarding not queued');
  check(await fixture.scalar(`select public.enqueue_care_message($1, 'care_weekly_summary', '{"completedCount":1,"activeDays":1}'::jsonb)`, [B]) === null, 'care mail sent on the same day as onboarding');

  // Suppression and withdrawn consent block it.
  await fixture.exec(`delete from public.lifecycle_outbox where family_id = '${B}'`);
  await fixture.exec(`insert into public.email_suppressions (user_id, scope, reason) values ('${ids.users.parentBeta}', 'marketing', 'unsubscribe')`);
  check(await fixture.scalar(`select public.enqueue_onboarding_message($1, 'onboarding_day1')`, [B]) === null, 'suppressed owner was queued');
  await fixture.exec(`delete from public.email_suppressions; update public.parent_profiles set marketing_consent = false where user_id = '${ids.users.parentBeta}'`);
  check(await fixture.scalar(`select public.enqueue_onboarding_message($1, 'onboarding_day1')`, [B]) === null, 'non-consenting owner was queued');
  check((await rows(B)).length === 0, 'rows created for blocked family');

  // Only onboarding templates are accepted.
  let rejected = 0;
  try { await fixture.exec(`select public.enqueue_onboarding_message('${B}', 'welcome_setup')`); } catch { rejected += 1; }
  try { await fixture.exec(`select public.enqueue_onboarding_message('${B}', 'care_week1_tips')`); } catch { rejected += 1; }
  check(rejected === 2, 'forbidden template accepted');

  // Service-only.
  let denied = 0;
  for (const call of [`select public.schedule_onboarding_messages()`, `select public.enqueue_onboarding_message('${A}', 'onboarding_day1')`]) {
    await fixture.exec(`set role authenticated`);
    try { await fixture.exec(call); } catch { denied += 1; } finally { await fixture.exec(`reset role`); }
  }
  check(denied === 2, 'authenticated could call an onboarding producer');

  // Rollback restores the previous gate and template list.
  await fixture.exec(await readFile('supabase/rollbacks/202611040001_onboarding_emails.rollback.sql', 'utf8'));
  check(await count(`select count(*) from public.lifecycle_outbox where template_key like 'onboarding\\_%'`) === 0, 'rollback left onboarding rows');
  check(await count(`select count(*) from pg_proc where proname in ('schedule_onboarding_messages','enqueue_onboarding_message')`) === 0, 'rollback left functions');
  await fixture.exec(migration); // and it re-applies cleanly

  console.log(JSON.stringify({ verdict: 'PASS', evidence: 'real-postgresql', database: fixture.databaseName }));
} finally {
  await fixture.close();
}
