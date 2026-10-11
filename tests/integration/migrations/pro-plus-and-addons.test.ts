import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const path = resolve('supabase/migrations/202610110001_pro_plus_and_addons.sql');
const preflightPath = resolve('supabase/preflight/202610110001_pro_plus_and_addons.verify.sql');
const migration = existsSync(path) ? readFileSync(path, 'utf8') : '';
const preflight = existsSync(preflightPath) ? readFileSync(preflightPath, 'utf8') : '';
function definition(name: string) {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start, `${name} must be defined`).toBeGreaterThanOrEqual(0);
  return migration.slice(start, migration.indexOf('$$;', start) + 3);
}

describe('Pro Plus and add-ons migration', () => {
  it('parses migration, preflight and runtime scenarios', async () => {
    expect(existsSync(path)).toBe(true);
    expect(existsSync(preflightPath)).toBe(true);
    for (const sql of [migration, preflight, readFileSync(resolve('tests/integration/migrations/pro-plus-and-addons.scenarios.sql'), 'utf8')]) {
      await expect(parse(sql)).resolves.toBeDefined();
    }
  });
  it('keeps all hardened function signatures and security', () => {
    for (const name of ['create_family_payment_order', 'referral_discount_bps', 'process_payos_webhook',
      'accrue_referral_commission', 'family_has_pro_entitlement', 'family_child_limit', 'admin_retention_snapshot',
      'admin_revoke_launch_offer_claim', 'activate_family_trial', 'admin_update_family_subscription',
      'redeem_family_coupon', 'admin_resolve_billing_case', 'family_ai_tier', 'family_addons_snapshot']) {
      const body = definition(name);
      expect(body).toContain('security definer');
      expect(body).toContain("set search_path = ''");
      expect(migration).toContain(`grant execute on function public.${name}(`);
    }
    expect(definition('create_family_payment_order')).toContain("hashtextextended('billing-checkout:'");
    expect(definition('admin_update_family_subscription')).toContain('subscription_changed');
    expect(definition('admin_resolve_billing_case')).toContain('refund_already_confirmed');
    expect(definition('redeem_family_coupon')).toContain('coupon_rate_limited');
  });
  it('prices new items and carries Pro Plus through yearly discount and commission gates', () => {
    const order = definition('create_family_payment_order');
    for (const [id, price] of [['pro_plus_monthly', 79000], ['pro_plus_yearly', 790000], ['ai_addon_monthly', 29000], ['printables', 99000]]) {
      expect(order).toContain(`when '${id}' then ${price}`);
    }
    expect(order).toContain("in ('yearly', 'solo_yearly', 'pro_plus_yearly')");
    expect(definition('referral_discount_bps')).toContain("'pro_plus_yearly'");
    expect(definition('accrue_referral_commission')).toContain("not in ('solo_yearly', 'yearly', 'lifetime', 'pro_plus_yearly')");
    for (const error of ['addon_requires_plan', 'already_included', 'already_owned']) expect(order).toContain(error);
  });
  it('protects add-on state with RLS and a read-only manager policy', () => {
    expect(migration).toContain('create table public.family_addons');
    expect(migration).toContain('primary key (family_id, addon)');
    expect(migration).toContain('alter table public.family_addons enable row level security');
    expect(migration).toContain('alter table public.family_addons force row level security');
    expect(migration).toContain('using (public.can_manage_family(family_id))');
    expect(migration).toContain('revoke all on table public.family_addons from public, anon, authenticated');
    expect(migration).toContain('grant select on table public.family_addons to authenticated');
    expect(migration).toContain('grant execute on function public.family_ai_tier(uuid) to service_role');
    expect(migration).toContain('grant execute on function public.family_addons_snapshot() to authenticated');
  });
  it('settles add-ons after duplicate checks and before subscription writes', () => {
    const webhook = definition('process_payos_webhook');
    const branch = webhook.indexOf("if target_order.plan_id in ('ai_addon_monthly', 'printables') then");
    expect(branch).toBeGreaterThan(webhook.indexOf("return 'order_already_paid'"));
    expect(branch).toBeLessThan(webhook.indexOf('insert into public.user_subscriptions'));
    expect(webhook).toContain("greatest(now(), public.family_addons.active_until) + interval '1 month'");
    expect(webhook).toContain("when target_order.plan_id in ('pro_plus_monthly', 'pro_plus_yearly') then 3");
    expect(webhook).toContain("if target_order.plan_id = 'yearly' then");
    expect(definition('admin_resolve_billing_case')).toContain("active_until - interval '1 month'");
    expect(definition('admin_resolve_billing_case')).toContain('delete from public.family_addons');
  });
  it('attests the new interfaces and applies atomically', () => {
    expect(migration.trim()).toMatch(/^begin;[\s\S]*commit;$/);
    expect(preflight.trim()).toMatch(/^begin;[\s\S]*rollback;$/);
    for (const value of ['family_addons', 'family_ai_tier', 'family_addons_snapshot', 'pg_get_functiondef', 'pro_plus_yearly']) expect(preflight).toContain(value);
  });
});
