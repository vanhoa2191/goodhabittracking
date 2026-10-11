// Disposable PostgreSQL regression runner, also used by CI.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSqlTestDatabase, stopSqlTestServer } from './sql-test-database.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const load = path => readFileSync(`${root}/${path}`, 'utf8');
const definition = (sql, name) => {
  const start = sql.indexOf(`create or replace function public.${name}(`);
  if (start < 0) throw new Error(`Missing fixture function: ${name}`);
  return sql.slice(start, sql.indexOf('\n$$;', start) + 4);
};
let client;
let database;
const out = [];
try {
  database = await createSqlTestDatabase(); client = database.client;
  client.on('notice', n => { if (n.severity === 'WARNING') out.push(`WARNING: ${n.message}`); });
  const family = load('supabase/migrations/202609190001_family_tenancy.sql');
  const cases = load('supabase/migrations/202609280001_lifecycle_revenue_operations.sql');
  await client.query(`create schema auth;
    create table auth.users(id uuid primary key, created_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    ${family.slice(family.indexOf('create table if not exists public.user_subscriptions'), family.indexOf('create table if not exists public.parent_profiles'))}
    alter table public.payment_orders add column family_id uuid references public.families(id) on delete set null;
    alter table public.user_subscriptions add column family_id uuid references public.families(id) on delete cascade;
    create function public.current_family_id() returns uuid language sql stable as $$select nullif(current_setting('test.family_id', true), '')::uuid$$;
    create function public.can_manage_family(target uuid) returns boolean language sql stable as $$select exists(select 1 from public.family_memberships where family_id = target and user_id = auth.uid() and role in ('owner', 'parent', 'guardian'))$$;
    ${cases.slice(cases.indexOf('create table if not exists public.billing_support_cases'), cases.indexOf('create table if not exists public.billing_support_case_events'))}`);
  for (const name of ['202609300010_affiliate_program', '202610010002_affiliate_hardening', '202610010003_affiliate_audit_fixes', '202610010004_referral_discount']) {
    await client.query(load(`supabase/migrations/${name}.sql`));
  }
  await client.query(`insert into auth.users(id) select ('00000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid from generate_series(1,5) n;
    insert into public.families(id,created_by) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002'), ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004');
    insert into public.family_memberships(family_id,user_id,role) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','owner'), ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000003','guardian'), ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000004','owner');
    insert into public.affiliate_accounts(user_id,code,terms_version,payout_bank,payout_account_number,payout_account_name) values ('00000000-0000-0000-0000-000000000001','ABCDEFGH','2026-10-01','Bank','123456','Referrer');
    insert into public.referrals(referrer_user_id,referred_family_id,referred_user_id,code) values ('00000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','ABCDEFGH');
    insert into public.payment_orders(order_code,user_id,family_id,amount,status,plan_id) values (1,'00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',1000000,'PAID','yearly');
    insert into public.referral_commissions(referral_id,order_code,base_amount,rate_bps,amount,available_at) select id,1,1000000,3000,300000,now() - interval '1 day' from public.referrals;
    create temporary table test_original_release as select available_at as original_release from public.referral_commissions where order_code=1;`);
  await client.query(`insert into public.payment_orders(order_code,user_id,family_id,amount,status,plan_id) values (90,'00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',1000000,'PAID','yearly');
    insert into public.referral_commissions(referral_id,order_code,base_amount,rate_bps,amount,available_at) select id,90,1000000,3000,300000,now() - interval '1 day' from public.referrals;
    insert into public.billing_support_cases(family_id,user_id,order_code,status,case_type,reason_code,created_by,resolution_code,resolved_at) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',90,'completed','refund','other','00000000-0000-0000-0000-000000000002','manual_refund_confirmed',now());`);
  // An open case that predates the migration must be backfilled onto its commission.
  await client.query(`insert into public.payment_orders(order_code,user_id,family_id,amount,status,plan_id) values (91,'00000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',1000000,'PAID','yearly');
    insert into public.referral_commissions(referral_id,order_code,base_amount,rate_bps,amount,available_at) select id,91,1000000,3000,300000,now() - interval '1 day' from public.referrals;
    insert into public.billing_support_cases(family_id,user_id,order_code,status,case_type,reason_code,created_by) values ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',91,'reviewing','refund','other','00000000-0000-0000-0000-000000000002');`);
  await client.query('create temporary table test_original_refund_release as select available_at as original_release from public.referral_commissions where order_code = 90');
  await client.query(load('supabase/migrations/202610090020_affiliate_account_privacy_freeze.sql'));
  await client.query(load('supabase/preflight/202610090020_affiliate_account_privacy_freeze.verify.sql'));
  const adminSchema = load('supabase/migrations/202609280003_admin_security_observability.sql');
  await client.query(adminSchema.slice(adminSchema.indexOf('create table if not exists public.admin_memberships'), adminSchema.indexOf('create table if not exists public.operational_events')));
  const unfreeze = '202610090040_affiliate_commission_unfreeze';
  await client.query(load(`supabase/migrations/${unfreeze}.sql`));
  await client.query(load(`supabase/preflight/${unfreeze}.verify.sql`));
  out.push(`PostgreSQL: ${(await client.query('select version()')).rows[0].version}`);
  out.push('PASS: migration and preflight execute');
  const results = await client.query(load('tests/integration/migrations/affiliate-account-privacy-freeze.scenarios.sql'));
  for (const result of results) if (result.rows?.[0]?.result) out.push(result.rows[0].result);
  await client.query(load('tests/integration/migrations/affiliate-commission-unfreeze.scenarios.sql'));
  out.push('PASS: admin unfreeze permissions, orphan release, refund/open-case refusal and atomic audit');
  // Keep the historical regressions at their original migration boundary, then advance the fixture.
  const billing = load('supabase/migrations/202609190003_billing_integrity.sql');
  const pricing = load('supabase/migrations/202610070001_pricing_tiers_launch_offer.sql');
  const hardening = load('supabase/migrations/202610090010_billing_payment_hardening.sql');
  await client.query(billing.slice(billing.indexOf('alter table public.payment_orders'), billing.indexOf('drop policy if exists subscriptions_insert_family')));
  await client.query("alter table public.payment_orders add column family_owner_user_id uuid references auth.users(id) on delete set null");
  const discountStart = hardening.indexOf('create or replace function public.referral_discount_bps(target_family uuid, target_user uuid)');
  const discountEnd = hardening.indexOf('-- The family lock is shared with settlement', discountStart);
  await client.query(hardening.slice(discountStart, discountEnd));
  await client.query(pricing.slice(pricing.indexOf('create table public.launch_offers'), pricing.indexOf('create or replace function public.launch_offer_remaining')));
  await client.query(definition(pricing, 'claim_launch_offer'));
  await client.query(definition(pricing, 'process_payos_webhook'));
  // Snapshot actual 30% rows and create a referred owner's 59k pending order before deployment.
  await client.query(`create temporary table money_model_history as select id, to_jsonb(commission) as original from public.referral_commissions commission;
    create temporary table money_model_legacy_pending as select gen_random_uuid() as owner_id, gen_random_uuid() as family_id;
    insert into auth.users(id) select owner_id from money_model_legacy_pending;
    insert into public.families(id,created_by) select family_id,owner_id from money_model_legacy_pending;
    insert into public.family_memberships(family_id,user_id,role) select family_id,owner_id,'owner' from money_model_legacy_pending;
    insert into public.referrals(referrer_user_id,referred_family_id,referred_user_id,code)
      select '00000000-0000-0000-0000-000000000001',family_id,owner_id,'ABCDEFGH' from money_model_legacy_pending;
    insert into public.payment_orders(order_code,user_id,family_id,amount,status,plan_id,description)
      select 101000,owner_id,family_id,59000,'PENDING','monthly','KIDHABIT 101000' from money_model_legacy_pending;`);
  const moneyModel = '202610100001_money_model_v2';
  await client.query(load(`supabase/migrations/${moneyModel}.sql`));
  await client.query(load(`supabase/preflight/${moneyModel}.verify.sql`));
  const moneyResults = await client.query(load('tests/integration/migrations/money-model-v2.scenarios.sql'));
  const expectedScenarios = new Set(['pro_yearly_referred', 'solo_yearly_referred', 'monthly_no_commission',
    'monthly_then_yearly', 'lifetime_referred', 'history_untouched', 'old_price_pending_settles']);
  for (const result of moneyResults) {
    for (const row of result.rows ?? []) {
      if (!row.scenario) continue;
      if (!expectedScenarios.delete(row.scenario)) throw new Error(`Unexpected or duplicate scenario: ${row.scenario}`);
      if (row.ok !== true) throw new Error(`Money Model v2 scenario failed: ${row.scenario} (ok=${row.ok})`);
      out.push(`PASS: ${row.scenario} ok=true`);
    }
  }
  if (expectedScenarios.size) throw new Error(`Missing Money Model v2 scenarios: ${[...expectedScenarios].join(', ')}`);

  const customer = load('supabase/migrations/202609210005_customer_admin.sql');
  const integrity = load('supabase/migrations/202609300005_billing_integrity.sql');
  await client.query(`create table public.child_profiles (family_id uuid);
    create table public.activity_logs (family_id uuid, status text, log_date date);
    ${customer.slice(customer.indexOf('create table if not exists public.coupons'), customer.indexOf('create or replace function public.sync_customer_identity'))}
    ${customer.slice(customer.indexOf('create table if not exists public.coupon_redemptions'), customer.indexOf('create or replace function public.redeem_family_coupon'))}
    ${integrity.slice(integrity.indexOf('create table if not exists public.coupon_attempts'), integrity.indexOf('create or replace function public.process_payos_webhook'))}`);

  const parentAi = load('supabase/migrations/202610040004_parent_ai.sql');
  const wrappers = load('supabase/migrations/202610050001_pin_gated_server_wrappers.sql');
  // Replace the historical fixture's setting-based helpers with the production
  // membership checks before exercising the server's acting-parent wrapper.
  await client.query(`drop function public.current_family_id(); drop function public.can_manage_family(uuid);
    alter table public.family_memberships drop constraint family_memberships_role_check;
    alter table public.family_memberships add constraint family_memberships_role_check
      check(role in ('owner','parent','guardian','caregiver'));`);
  await client.query(`${parentAi.slice(parentAi.indexOf('create table public.ai_usage'), parentAi.indexOf('commit;'))}
    ${definition(family, 'current_family_id')}
    ${definition(family, 'can_manage_family')}
    ${definition(wrappers, 'act_as_user')}
    revoke all on function public.act_as_user(uuid) from public, anon, authenticated, service_role;`);

  const addons = '202610110001_pro_plus_and_addons';
  await client.query(load(`supabase/migrations/${addons}.sql`));
  await client.query(load('supabase/preflight/202610110001_pro_plus_and_addons.verify.sql'));
  const addonResults = await client.query(load('tests/integration/migrations/pro-plus-and-addons.scenarios.sql'));
  const expectedAddons = new Set(['pro_plus_prices', 'pro_plus_commission', 'pro_plus_child_limit', 'pro_to_pro_plus',
    'addon_requires_plan', 'addon_then_pro_plus', 'addon_extends', 'addon_duplicate_webhook',
    'addon_no_commission_no_discount', 'printables_once', 'founding_tier', 'refund_revokes_addon',
    'snapshot_shape', 'regression_existing_plans', 'higher_plan_active', 'lifetime_active', 'printables_pending_reused',
    'founding_already_included', 'founding_expires_after_year', 'pro_plus_yearly_adds_year',
    'pro_plus_yearly_pending_lock', 'pro_plus_yearly_prior_paid_no_discount', 'addon_expired_plan_refused',
    'addon_allowed_lifetime', 'founding_revoked_basic', 'tier_free_trial_standard_plus', 'monthly_free_10', 'monthly_standard_20',
    'month_boundary', 'plus_unlimited_month', 'plus_daily_safety', 'tier_after_founding', 'system_cap',
    'monthly_quota_validation', 'monthly_quota_order_and_gap', 'monthly_quota_authorization', 'monthly_quota_authenticated_denied']);
  for (const result of addonResults) {
    for (const row of result.rows ?? []) {
      if (!row.scenario) continue;
      if (!expectedAddons.delete(row.scenario)) throw new Error(`Unexpected or duplicate add-on scenario: ${row.scenario}`);
      if (row.ok !== true) throw new Error(`Pro Plus/add-on scenario failed: ${row.scenario} (ok=${row.ok})`);
      out.push(`PASS: ${row.scenario} ok=true`);
    }
  }
  if (expectedAddons.size) throw new Error(`Missing Pro Plus/add-on scenarios: ${[...expectedAddons].join(', ')}`);

} catch(e) { out.push(`FAIL: ${e.message}`); process.exitCode=1; }
finally { if(database) await database.close(); await stopSqlTestServer(); out.push('Disposable PostgreSQL removed'); console.log(out.join('\n')); }

process.exit(process.exitCode ?? 0);
