import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300005_billing_integrity.sql'), 'utf8');
const pairing = readFileSync(resolve('supabase/migrations/202609300006_pairing_exchange_limits.sql'), 'utf8');
const verification = [
  readFileSync(resolve('supabase/preflight/202609300005_billing_integrity.verify.sql'), 'utf8'),
  readFileSync(resolve('supabase/preflight/202609300006_pairing_exchange_limits.verify.sql'), 'utf8'),
];

describe('billing integrity migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(pairing)).resolves.toBeDefined();
    for (const script of verification) await expect(parse(script)).resolves.toBeDefined();
  });

  it('adds a payment on top of the time already paid and never lowers a plan', () => {
    expect(migration).toContain('where subscription.family_id = target_order.family_id\n  for update;');
    expect(migration).toContain('current_subscription.subscription_ends_at else now() end');
    expect(migration).toContain("next_plan := case when current_rank > order_rank then current_subscription.plan else target_order.plan_id end;");
    expect(migration).toContain("current_subscription.plan = 'lifetime'");
    expect(migration).toContain('entitlement_end := null;');
  });

  it('extends coupons from the paid end date and leaves lifetime plans alone', () => {
    const coupon = migration.slice(migration.indexOf('function public.redeem_family_coupon'));
    expect(coupon).toContain('current_subscription.subscription_ends_at else now() end');
    expect(coupon).toContain("next_plan := case when has_paid_time then current_subscription.plan else 'monthly' end;");
    expect(coupon).toContain("current_subscription.plan = 'lifetime'");
  });

  it('budgets coupon guesses per account and keeps the attempt when a code is refused', () => {
    expect(migration).toContain("attempt.attempted_at > now() - interval '15 minutes'");
    expect(migration).toContain(">= 10 then\n    raise exception 'coupon_rate_limited';");
    expect(migration).toContain('return query select null::text, null::timestamptz;');
    expect(migration).toContain('revoke all on public.coupon_attempts from public, anon, authenticated;');
    expect(migration).toContain('check (char_length(code) >= 8) not valid');
  });

  it('serialises child creation per family before counting', () => {
    expect(migration).toContain('perform 1 from public.families family where family.id = new.family_id for update;');
  });

  it('runs the pairing exchange for the service role only, with a global budget and pruning', () => {
    expect(pairing).toContain('global_record.attempts > 120');
    expect(pairing).toContain("stale.window_started_at < now() - interval '1 day'");
    expect(pairing).toContain('to service_role;');
    expect(pairing).toContain('from public, anon, authenticated;');
  });
});
