import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migrationPath = resolve('supabase/migrations/202610070001_pricing_tiers_launch_offer.sql');
const verificationPath = resolve('supabase/preflight/202610070001_pricing_tiers_launch_offer.verify.sql');
const migration = existsSync(migrationPath) ? readFileSync(migrationPath, 'utf8') : '';
const verification = existsSync(verificationPath) ? readFileSync(verificationPath, 'utf8') : '';

function definition(name: string) {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start, `${name} must be defined`).toBeGreaterThanOrEqual(0);
  return migration.slice(start, migration.indexOf('$$;', start) + 3);
}

describe('pricing tiers and launch offer migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    expect(migration.trim()).not.toBe('');
    expect(verification.trim()).not.toBe('');
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('accepts the yearly one-child plan', () => {
    for (const name of ['family_has_pro_entitlement', 'family_child_limit', 'process_payos_webhook', 'redeem_family_coupon', 'admin_retention_snapshot']) {
      expect(definition(name)).toContain("'solo_yearly'");
      expect(definition(name)).toContain('security definer');
      expect(definition(name)).toContain("set search_path = ''");
    }
    expect(definition('process_payos_webhook')).toContain("not in ('solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime')");
    expect(definition('process_payos_webhook')).not.toContain('family_plus_');
  });

  it('limits one-child plans to one and Pro plans and the trial to five', () => {
    const limit = definition('family_child_limit');
    expect(limit).toContain("subscription.plan = 'lifetime'");
    expect(limit).toContain(') then null');
    expect(limit).toContain("subscription.plan = 'trial' and subscription.trial_ends_at > now()");
    expect(limit).toContain("subscription.plan in ('monthly', 'yearly')");
    expect(limit).toContain(') then 5');
    expect(limit).toContain("in ('solo_monthly', 'solo_yearly')");
    expect(limit).toContain(') then 1');
    expect(migration).not.toMatch(/(?:update|delete from) public\.child_profiles/i);
    expect(migration).not.toContain('create or replace function public.enforce_family_child_limit');
  });

  it('adds a year for both yearly plans and ranks one-child plans below Pro', () => {
    const webhook = definition('process_payos_webhook');
    expect(webhook).toContain("in ('yearly', 'solo_yearly') then interval '1 year'");
    expect(webhook.match(/in \('solo_monthly', 'solo_yearly'\) then 1 else 2/g)).toHaveLength(2);
    expect(webhook).toContain('perform public.accrue_referral_commission(target_order.order_code);');
    expect(webhook).toContain("if target_order.status = 'PAID' then");
  });

  it('records a launch offer claim only for the Pro yearly plan under a row lock', () => {
    const webhook = definition('process_payos_webhook');
    expect(migration).toContain("('pro_plus_founding', 10)");
    expect(webhook).toContain("target_order.plan_id = 'yearly'");
    const claim = definition('claim_launch_offer');
    expect(claim).toContain("where code = 'pro_plus_founding'");
    expect(claim).toContain('for update;');
    expect(claim.indexOf('for update;')).toBeLessThan(claim.indexOf('select count(*)'));
    expect(claim).toContain('offer.closed_at <= now()');
    expect(claim).toContain('offer.opened_at > now()');
    expect(claim).toContain('claimed_slots >= offer.slots');
    expect(claim).toContain('claim.family_id = target_family_id');
    expect(claim).toContain('claim.revoked_at is null');
    expect(webhook.indexOf('perform public.claim_launch_offer(')).toBeGreaterThan(webhook.indexOf("set status = 'PAID'"));
    expect(migration).toContain('on public.launch_offer_claims (offer_code, family_id) where revoked_at is null');
    expect(migration).toContain('order_code bigint not null unique');
  });

  it('guards launch offer claim failures so payment settlement can continue', () => {
    expect(definition('process_payos_webhook')).toMatch(
      /if target_order\.plan_id = 'yearly' then\s+begin\s+perform public\.claim_launch_offer\(target_order\.family_id, target_order\.order_code\);\s+exception when others then\s+raise warning 'launch offer claim skipped for order %: %', target_order\.order_code, sqlerrm;\s+end;\s+end if;/,
    );
  });

  it('exposes only the remaining count publicly', () => {
    const remaining = definition('launch_offer_remaining');
    expect(remaining).toContain('returns integer');
    expect(remaining).toContain('stable');
    expect(remaining).toContain('security definer');
    expect(remaining).toContain('greatest(0,');
    expect(remaining).toContain('offer_row.closed_at <= now()');
    expect(remaining).toContain('claim.revoked_at is null');
    for (const table of ['launch_offers', 'launch_offer_claims']) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
    expect(migration).toContain('grant execute on function public.launch_offer_remaining(text) to anon, authenticated, service_role;');
    expect(migration).toContain('revoke all on public.launch_offers, public.launch_offer_claims from public, anon, authenticated;');
    expect(migration).not.toMatch(/grant[^;]*launch_offer_claims[^;]*to[^;]*(anon|authenticated)/i);
    expect(migration).not.toMatch(/create policy[^;]*launch_offer_claims/i);
    expect(migration).toContain('revoke all on function public.claim_launch_offer(uuid, bigint) from public, anon, authenticated, service_role;');
    expect(migration).toContain('revoke all on function public.admin_revoke_launch_offer_claim(bigint, text) from public, anon, authenticated;');
    expect(migration).toContain('grant execute on function public.admin_revoke_launch_offer_claim(bigint, text) to service_role;');
  });

  it('keeps the grants of every replaced function', () => {
    const grants = [
      'revoke all on function public.family_has_pro_entitlement(uuid) from public;',
      'grant execute on function public.family_has_pro_entitlement(uuid) to authenticated, service_role;',
      'revoke all on function public.family_child_limit(uuid) from public;',
      'grant execute on function public.family_child_limit(uuid) to authenticated, service_role;',
      'revoke all on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) from public, anon, authenticated;',
      'grant execute on function public.process_payos_webhook(bigint, integer, text, text, text, jsonb) to service_role;',
      'grant execute on function public.redeem_family_coupon(text) to authenticated;',
      'revoke all on function public.admin_retention_snapshot() from public, anon, authenticated;',
      'grant execute on function public.admin_retention_snapshot() to service_role;',
    ];
    for (const grant of grants) expect(migration).toContain(grant);
  });

  it('runs the migration atomically and rolls back verification fixtures', () => {
    expect(migration.trim()).toMatch(/^begin;[\s\S]*commit;$/);
    expect(verification.trim()).toMatch(/^begin;[\s\S]*rollback;$/);
    expect(readFileSync(resolve('supabase/schema.sql'), 'utf8').trim().split('\n').at(-1)).toBe('\\ir migrations/202610070001_pricing_tiers_launch_offer.sql');
  });
});
