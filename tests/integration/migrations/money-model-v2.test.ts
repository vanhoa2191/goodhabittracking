import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve('supabase/migrations/202610100001_money_model_v2.sql');
const verificationPath = resolve('supabase/preflight/202610100001_money_model_v2.verify.sql');
const migration = existsSync(migrationPath) ? readFileSync(migrationPath, 'utf8') : '';
const verification = existsSync(verificationPath) ? readFileSync(verificationPath, 'utf8') : '';

function definition(name: string, sql = migration) {
  const start = sql.indexOf(`create or replace function public.${name}(`);
  expect(start, `${name} must be defined`).toBeGreaterThanOrEqual(0);
  return sql.slice(start, sql.indexOf('$$;', start) + 3);
}

const rounding = '  if discount > 0 then charged := greatest(1000, (charged / 1000) * 1000); end if;\n';
const scope = "  if paid_order.plan_id not in ('solo_yearly', 'yearly', 'lifetime') then return; end if;\n";

describe('money model v2 migration', () => {
  it('parses the migration and preflight as PostgreSQL', async () => {
    expect(existsSync(migrationPath)).toBe(true);
    expect(existsSync(verificationPath)).toBe(true);
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('charges the new monthly prices and keeps the yearly prices', () => {
    const checkout = definition('create_family_payment_order');
    for (const [plan, amount] of [['solo_monthly', 49000], ['monthly', 69000], ['solo_yearly', 399000], ['yearly', 590000]]) {
      expect(checkout).toContain(`when '${plan}' then ${amount}`);
    }
    expect(checkout).toContain('returns table(amount integer, discount_bps integer, existing_order_code bigint)');
    expect(migration).toContain('drop function if exists public.create_family_payment_order(uuid, uuid, bigint, text, timestamptz);');
  });

  it('rounds only discounted checkout amounts down to the nearest thousand', () => {
    const checkout = definition('create_family_payment_order');
    expect(checkout).toContain(rounding.trim());
    expect(checkout.indexOf(rounding)).toBeGreaterThan(checkout.indexOf('charged := greatest(1,'));
    expect(checkout.indexOf(rounding)).toBeLessThan(checkout.indexOf('insert into public.payment_orders'));
  });

  it('earns commission only for Solo yearly, Pro yearly and lifetime before calculating the amount', () => {
    const accrual = definition('accrue_referral_commission');
    expect(accrual).toContain(scope.trim());
    expect(accrual.indexOf(scope)).toBeGreaterThan(accrual.indexOf("if not found or paid_order.family_id is null then return; end if;"));
    expect(accrual.indexOf(scope)).toBeLessThan(accrual.indexOf('select attribution.* into referral'));
    expect(accrual.indexOf(scope)).toBeLessThan(accrual.indexOf('commission := floor(paid_order.amount::numeric * settings.commission_bps / 10000)::integer;'));
    expect(accrual).toContain('returns void');
  });

  it('keeps the hardened function bodies apart from prices, rounding and commission scope', () => {
    const billing = readFileSync(resolve('supabase/migrations/202610090010_billing_payment_hardening.sql'), 'utf8');
    const affiliate = readFileSync(resolve('supabase/migrations/202610090020_affiliate_account_privacy_freeze.sql'), 'utf8');
    expect(definition('create_family_payment_order').replace(rounding, '').replace("when 'solo_monthly' then 49000", "when 'solo_monthly' then 39000").replace("when 'monthly' then 69000", "when 'monthly' then 59000"))
      .toBe(definition('create_family_payment_order', billing));
    expect(definition('accrue_referral_commission').replace(scope, '')).toBe(definition('accrue_referral_commission', affiliate));
  });

  it('updates the current rate and terms without rewriting recorded commissions', () => {
    expect(migration).toContain("update public.affiliate_settings set commission_bps = 2000, terms_version = '2026-10-10', updated_at = now() where singleton;");
    expect(migration).not.toMatch(/(?:update|delete from)\s+public\.referral_commissions/i);
    for (const assertion of ['commission_bps = 2000', "terms_version = '2026-10-10'", 'referred_discount_bps = 1000', 'hold_days = 40', 'earning_window_days = 365', 'pg_get_functiondef']) {
      expect(verification).toContain(assertion);
    }
  });

  it('keeps definer security, an empty search path and service-only execute grants', () => {
    for (const [name, signature] of [
      ['create_family_payment_order', 'uuid, uuid, bigint, text, timestamptz'],
      ['accrue_referral_commission', 'bigint'],
    ]) {
      const body = definition(name);
      expect(body).toContain('security definer');
      expect(body).toContain("set search_path = ''");
      expect(migration).toContain(`revoke all on function public.${name}(${signature}) from public, anon, authenticated;`);
      expect(migration).toContain(`grant execute on function public.${name}(${signature}) to service_role;`);
    }
    expect(migration).not.toMatch(/grant[^;]*to[^;]*(anon|authenticated)/i);
  });

  it('applies atomically and rolls back verification', () => {
    expect(migration.trim()).toMatch(/^begin;[\s\S]*commit;$/);
    expect(verification.trim()).toMatch(/^begin;[\s\S]*rollback;$/);
  });
});
