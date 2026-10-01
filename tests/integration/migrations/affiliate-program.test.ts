import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300010_affiliate_program.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300010_affiliate_program.verify.sql'), 'utf8');

function definition(name: string): string {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start, `${name} is defined`).toBeGreaterThan(-1);
  return migration.slice(start, migration.indexOf('\n$$;', start));
}

describe('affiliate programme migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('starts at 30 percent with a refund-window hold and a payout minimum', () => {
    expect(migration).toContain('commission_bps integer not null default 3000');
    expect(migration).toContain('hold_days integer not null default 35');
    expect(migration).toContain('min_payout_vnd integer not null default 200000');
    expect(migration).toContain('earning_window_days integer not null default 365');
  });

  it('keeps every affiliate table private to the database functions', () => {
    for (const table of ['affiliate_settings', 'affiliate_accounts', 'referrals', 'affiliate_payouts', 'referral_commissions']) {
      expect(migration).toContain(`alter table public.${table} force row level security;`);
    }
    expect(migration).toContain('public.affiliate_payouts, public.referral_commissions from public, anon, authenticated;');
  });

  it('attributes a family once, never to itself, and only while it is new and has not paid', () => {
    const claim = definition('claim_referral');
    expect(claim).toContain("return 'self'");
    expect(claim).toContain('membership.user_id = account.user_id and membership.family_id = actor_family');
    expect(claim).toContain("return 'already_referred'");
    expect(claim).toContain('family_created < now() - make_interval(days => settings.attribution_days)');
    expect(claim).toContain("payment_order.status = 'PAID'");
    expect(migration).toContain('referred_family_id uuid unique');
  });

  it('accrues one commission per paid order, inside the earning window, and never fails a payment', () => {
    const accrue = definition('accrue_referral_commission');
    expect(accrue).toContain("status = 'PAID'");
    expect(accrue).toContain('floor(paid_order.amount * settings.commission_bps / 10000.0)::integer');
    expect(accrue).toContain('on conflict (order_code) do nothing');
    expect(accrue).toContain('settings.earning_window_days');
    expect(accrue).toContain("exception when others then\n  raise warning");
    expect(definition('process_payos_webhook')).toContain('perform public.accrue_referral_commission(target_order.order_code);');
  });

  it('holds a commission until the hold has passed and pays only at or above the minimum', () => {
    expect(definition('accrue_referral_commission')).toContain('now() + make_interval(days => settings.hold_days)');
    const payout = definition('request_affiliate_payout');
    expect(payout).toContain('commission.available_at <= now()');
    expect(payout).toContain('total < settings.min_payout_vnd');
    expect(payout).toContain("return jsonb_build_object('status', 'missing_details')");
  });

  it('never shows the referrer who was referred', () => {
    const overview = definition('affiliate_overview');
    expect(overview).not.toMatch(/referred_user_id|referred_family_id|email|display_name/);
    expect(overview).toContain("right(account.payout_account_number, 4)");
  });

  it('leaves settlement, reversal and payout resolution to the service role', () => {
    for (const signature of [
      'admin_affiliate_overview()',
      'admin_resolve_affiliate_payout(uuid, text, uuid, text, text)',
      'admin_reverse_referral_commission(bigint, text)',
      'accrue_referral_commission(bigint)',
    ]) {
      expect(migration).toContain(`grant execute on function public.${signature} to service_role;`);
      expect(migration).toContain(`revoke all on function public.${signature} from public, anon, authenticated;`);
    }
  });

  it('only reverses a commission that has not yet gone into a payout', () => {
    const reverse = definition('admin_reverse_referral_commission');
    expect(reverse).toContain("return 'in_payout'");
    expect(reverse).toContain("return 'already_paid'");
  });

  it('reports the claim state without exposing the referrer or other families', async () => {
    const stateMigration = readFileSync(resolve('supabase/migrations/202610010001_referral_claim_state.sql'), 'utf8');
    const stateVerification = readFileSync(resolve('supabase/preflight/202610010001_referral_claim_state.verify.sql'), 'utf8');
    await expect(parse(stateMigration)).resolves.toBeDefined();
    await expect(parse(stateVerification)).resolves.toBeDefined();
    expect(stateMigration).toContain('returns text');
    expect(stateMigration).toContain("set search_path = ''");
    expect(stateMigration).toContain('public.current_family_id()');
    for (const state of ["'disabled'", "'referred'", "'closed'", "'eligible'"]) expect(stateMigration).toContain(`return ${state}`);
    expect(stateMigration).toContain('family_created < now() - make_interval(days => settings.attribution_days)');
    expect(stateMigration).toContain("payment_order.status = 'PAID'");
    expect(stateMigration).not.toMatch(/referrer_user_id|affiliate_accounts|referral_commissions/);
    expect(stateMigration).toContain('revoke all on function public.referral_claim_state() from public, anon;');
    expect(stateMigration).toContain('grant execute on function public.referral_claim_state() to authenticated;');
  });
});
