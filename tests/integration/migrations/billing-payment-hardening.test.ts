import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const name = '202610090010_billing_payment_hardening';
const read = (path: string) => existsSync(path) ? readFileSync(path, 'utf8') : '';
const migration = read(resolve(`supabase/migrations/${name}.sql`));
const verification = read(resolve(`supabase/preflight/${name}.verify.sql`));
const definition = (name: string) => {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start).toBeGreaterThanOrEqual(0);
  return migration.slice(start, migration.indexOf('$$;', start) + 3);
};

describe('billing payment hardening', () => {
  it('parses the migration and executable rollback verification', async () => {
    expect(migration.trim()).toMatch(/^begin;[\s\S]*commit;$/);
    expect(verification.trim()).toMatch(/^begin;[\s\S]*rollback;$/);
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });
  it('compares the subscription version while holding the family and subscription locks', () => {
    const sql = definition('admin_update_family_subscription');
    expect(sql.indexOf('for update;')).toBeLessThan(sql.indexOf('is distinct from expected_updated_at'));
    expect(sql).toContain("return 'subscription_changed'");
    expect(sql).toContain('current_subscription.trial_consumed_at');
  });
  it('reserves only the first yearly discount and serializes checkout creation with settlement', () => {
    const sql = definition('create_family_payment_order');
    expect(sql.indexOf('for update;')).toBeLessThan(sql.indexOf('public.referral_discount_bps('));
    expect(sql).toContain("raise exception 'yearly_checkout_pending'");
    const discount = definition('referral_discount_bps');
    expect(discount).toContain("payment_order.plan_id in ('yearly', 'solo_yearly')");
    expect(discount).toContain("payment_order.status in ('PAID', 'PENDING')");
    expect(sql).toContain('insert into public.payment_orders');
  });
  it('checks owner permission before trial consumption or coupon quota', () => {
    expect(definition('activate_family_trial')).toContain('public.can_manage_family(actor_family_id)');
    const coupon = definition('redeem_family_coupon');
    expect(coupon.indexOf('public.can_manage_family(actor_family)')).toBeLessThan(coupon.indexOf('insert into public.coupon_attempts'));
  });
  it('resolves cases, reverses commission and revokes launch seats atomically', () => {
    const sql = definition('admin_resolve_billing_case');
    expect(sql).toContain('for update;');
    expect(sql).toContain("return jsonb_build_object('code', 'case_closed')");
    expect(sql).toContain('public.admin_reverse_referral_commission(');
    expect(sql).toContain('public.admin_revoke_launch_offer_claim(');
    expect(sql.indexOf('public.admin_revoke_launch_offer_claim(')).toBeLessThan(sql.indexOf('update public.billing_support_cases'));
    expect(sql).toContain("'launchOfferClaim'");
    expect(migration).toContain('create unique index billing_one_confirmed_refund_per_order');
    expect(migration).toContain("where case_type = 'refund' and status = 'completed' and resolution_code = 'manual_refund_confirmed'");
  });
  it('keeps all new administrative entry points service-only', () => {
    for (const signature of ['admin_update_family_subscription(uuid, text, text, timestamptz, timestamptz)', 'create_family_payment_order(uuid, uuid, bigint, text, timestamptz)', 'admin_resolve_billing_case(uuid, text, text, uuid, text)']) {
      expect(migration).toContain(`revoke all on function public.${signature} from public, anon, authenticated;`);
      expect(migration).toContain(`grant execute on function public.${signature} to service_role;`);
    }
  });
});
