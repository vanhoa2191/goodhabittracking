// Monetary regression tests run on disposable native PostgreSQL, never Supabase.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSqlTestDatabase, stopSqlTestServer } from './sql-test-database.mjs';
const load = name => readFileSync(`supabase/migrations/${name}.sql`, 'utf8');
const section = (sql, from, to) => sql.slice(sql.indexOf(from), sql.indexOf(to));
const definition = (sql, name) => {
  const start = sql.indexOf(`create or replace function public.${name}(`);
  assert.ok(start >= 0, name);
  return sql.slice(start, sql.indexOf('\n$$;', start) + 4);
};
async function waitForLock(db, client) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    await db.query('select pg_stat_clear_snapshot()');
    const result = await db.query("select wait_event_type from pg_stat_activity where pid=$1",[client.processID]);
    if (result.rows[0]?.wait_event_type === 'Lock') return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  throw new Error('Second connection did not queue behind the locked transaction');
}
let db;
let other;
try {
  db = await createSqlTestDatabase();
  const family = load('202609190001_family_tenancy');
  const billing = load('202609190003_billing_integrity');
  const customer = load('202609210005_customer_admin');
  const cases = load('202609280001_lifecycle_revenue_operations');
  const admins = load('202609280003_admin_security_observability');
  const integrity = load('202609300005_billing_integrity');
  const pricing = load('202610070001_pricing_tiers_launch_offer');
  await db.exec(`create schema auth; create table auth.users(id uuid primary key, email text, created_at timestamptz default now(), raw_user_meta_data jsonb, raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    ${section(family,'create table if not exists public.user_subscriptions','create table if not exists public.parent_profiles')}
    alter table public.payment_orders add column family_id uuid references public.families(id) on delete set null;
    alter table public.user_subscriptions add column family_id uuid references public.families(id) on delete cascade;
    alter table public.family_memberships drop constraint family_memberships_role_check;
    alter table public.family_memberships add constraint family_memberships_role_check check(role in ('owner','parent','guardian','caregiver'));
    create unique index family_memberships_one_family_per_user on public.family_memberships(user_id);
    ${definition(family,'current_family_id')}
    ${definition(family,'can_manage_family')}
    ${section(billing,'alter table public.payment_orders','drop policy if exists subscriptions_insert_family')}
    ${section(customer,'create table if not exists public.coupons','create or replace function public.sync_customer_identity')}
    ${section(customer,'create table if not exists public.coupon_redemptions','create or replace function public.redeem_family_coupon')}
    ${section(integrity,'create table if not exists public.coupon_attempts','create or replace function public.process_payos_webhook')}
    ${section(cases,'create table if not exists public.billing_support_cases','create table if not exists public.billing_support_case_events')}
    ${section(admins,'create table if not exists public.operational_events','create index if not exists operational_events_signal_time_idx')}
    ${section(pricing,'create table public.launch_offers','create or replace function public.launch_offer_remaining')}
    ${definition(pricing,'claim_launch_offer')}
    ${definition(pricing,'admin_revoke_launch_offer_claim')}
    ${definition(pricing,'process_payos_webhook')}`);
  for (const name of ['202609300010_affiliate_program','202610010002_affiliate_hardening','202610010003_affiliate_audit_fixes', '202610010004_referral_discount', '202610090010_billing_payment_hardening','202610090020_affiliate_account_privacy_freeze']) await db.exec(load(name));
  await db.exec(definition(pricing,'process_payos_webhook'));
  db.client.on('notice', notice => { if (notice.message?.includes(':') || notice.message?.includes('verified')) console.log(notice.message); });
  await db.exec(readFileSync('supabase/preflight/202610090010_billing_payment_hardening.verify.sql','utf8'));
  console.log('PASS: full billing preflight (permissions, refunds, entitlement CAS, discounts and launch revocation)');

  const actor = crypto.randomUUID(), familyId = crypto.randomUUID();
  await db.query('insert into auth.users(id) values ($1)',[actor]);
  await db.query('insert into families(id,created_by) values ($1,$2)',[familyId,actor]);
  await db.query("insert into family_memberships(family_id,user_id,role) values ($1,$2,'owner')",[familyId,actor]);
  other = await db.connect();
  await other.query("set statement_timeout='10s'");
  const checkout = 'select * from create_family_payment_order($1,$2,$3,$4,now()+interval \'15 minutes\')';
  // A second connection must wait for the first reservation to commit, then reuse it.
  await db.exec('begin');
  await db.query(checkout,[familyId,actor,700001,'yearly']);
  const queued = other.query(checkout,[familyId,actor,700002,'solo_yearly']);
  await waitForLock(db, other);
  await db.exec('commit');
  const second = await queued;
  assert.equal(second.rows[0].existing_order_code,'700001');
  assert.equal((await db.query('select count(*)::integer as n from payment_orders where family_id=$1',[familyId])).rows[0].n,1);
  console.log('PASS: concurrent yearly reservations reuse one order');

  // A webhook committed while the admin is waiting must make its compare-and-set stale.
  await db.exec('begin');
  await db.query("select process_payos_webhook(700001,590000,'KIDHABIT 700001','concurrent-webhook','local-link','{}'::jsonb)");
  const adminUpdate = other.query("select admin_update_family_subscription($1,'free','inactive',null,null) as result",[familyId]);
  await waitForLock(db, other);
  await db.exec('commit');
  assert.equal((await adminUpdate).rows[0].result,'subscription_changed');
  assert.equal((await db.query('select plan from user_subscriptions where family_id=$1',[familyId])).rows[0].plan,'yearly');
  console.log('PASS: webhook wins stale admin entitlement update');

  const caseA=crypto.randomUUID(),caseB=crypto.randomUUID();
  await db.query("insert into billing_support_cases(id,family_id,user_id,order_code,case_type,reason_code,created_by) values ($1,$3,$4,700001,'refund','other',$4),($2,$3,$4,700001,'refund','other',$4)",[caseA,caseB,familyId,actor]);
  const refund = "select admin_resolve_billing_case($1,'completed','manual_refund_confirmed',$2,'Local concurrency regression') as result";
  await db.exec('begin');
  assert.equal((await db.query(refund,[caseA,actor])).rows[0].result.code,'updated');
  const queuedRefund = other.query(refund,[caseB,actor]);
  await waitForLock(db, other);
  await db.exec('commit');
  assert.equal((await queuedRefund).rows[0].result.code,'refund_already_confirmed');
  console.log('PASS: concurrent refund cases confirm only one refund');
} catch(error) { console.error(`FAIL: ${error.message}`); process.exitCode=1; }
finally { if(other) await other.end(); if(db) await db.close(); await stopSqlTestServer(); }

process.exit(process.exitCode ?? 0);
