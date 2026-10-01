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

  describe('hardening migration', () => {
    const hardening = readFileSync(resolve('supabase/migrations/202610010002_affiliate_hardening.sql'), 'utf8');
    const hardeningVerification = readFileSync(resolve('supabase/preflight/202610010002_affiliate_hardening.verify.sql'), 'utf8');
    const part = (name: string) => {
      const start = hardening.indexOf(`create or replace function public.${name}(`);
      expect(start, `${name} is defined`).toBeGreaterThan(-1);
      return hardening.slice(start, hardening.indexOf('\n$$;', start));
    };

    it('parses as PostgreSQL SQL', async () => {
      await expect(parse(hardening)).resolves.toBeDefined();
      await expect(parse(hardeningVerification)).resolves.toBeDefined();
    });

    it('lets only the service role move payout money, with the user named explicitly', () => {
      expect(hardening).toContain('drop function if exists public.affiliate_save_payout_details(text, text, text);');
      expect(hardening).toContain('drop function if exists public.request_affiliate_payout();');
      expect(hardening).toContain('revoke all on function public.request_affiliate_payout(uuid) from public, anon, authenticated;');
      expect(hardening).toContain('grant execute on function public.request_affiliate_payout(uuid) to service_role;');
      expect(hardening).toContain('grant execute on function public.affiliate_save_payout_details(uuid, text, text, text) to service_role;');
      expect(hardening).not.toMatch(/grant execute on function public\.(request_affiliate_payout|affiliate_save_payout_details)\([^)]*\) to authenticated/);
      expect(part('request_affiliate_payout')).not.toContain('auth.uid()');
    });

    it('locks the commissions before totalling them and holds a payout after a bank change', () => {
      const request = part('request_affiliate_payout');
      expect(request).toContain('for update of commission');
      expect(request.indexOf('for update of commission')).toBeLessThan(request.indexOf('insert into public.affiliate_payouts'));
      expect(request).toContain("payout_details_changed_at > now() - interval '24 hours'");
      expect(request).toContain("'details_recent'");
      expect(part('affiliate_save_payout_details')).toContain('payout_details_changed_at = now()');
    });

    it('refuses to mark a payout paid when its commissions no longer add up', () => {
      const resolve = part('admin_resolve_affiliate_payout');
      expect(resolve).toContain('attached <> payout.amount');
      expect(resolve).toContain("return 'amount_mismatch'");
    });

    it('computes the commission in numeric and skips a family the referrer has joined', () => {
      const accrual = part('accrue_referral_commission');
      expect(accrual).toContain('paid_order.amount::numeric * settings.commission_bps / 10000');
      expect(accrual).not.toContain('paid_order.amount * settings.commission_bps');
      expect(accrual).toContain('membership.user_id = referral.referrer_user_id and membership.family_id = paid_order.family_id');
    });

    it('returns the existing code when two enrolments race', () => {
      const enroll = part('affiliate_enroll');
      const handler = enroll.slice(enroll.indexOf('exception when unique_violation'));
      expect(handler).toContain('select * into existing from public.affiliate_accounts where user_id = actor;');
      expect(handler.indexOf('return existing.code')).toBeLessThan(handler.indexOf('code_generation_failed'));
    });
  });

  describe('audit fixes migration', () => {
    const fixes = readFileSync(resolve('supabase/migrations/202610010003_affiliate_audit_fixes.sql'), 'utf8');
    const fixesVerification = readFileSync(resolve('supabase/preflight/202610010003_affiliate_audit_fixes.verify.sql'), 'utf8');
    const part = (name: string) => {
      const start = fixes.indexOf(`create or replace function public.${name}(`);
      expect(start, `${name} is defined`).toBeGreaterThan(-1);
      return fixes.slice(start, fixes.indexOf('\n$$;', start));
    };

    it('parses as PostgreSQL SQL', async () => {
      await expect(parse(fixes)).resolves.toBeDefined();
      await expect(parse(fixesVerification)).resolves.toBeDefined();
    });

    it('lets only a family manager attribute a family, also through a direct call', () => {
      const claim = part('claim_referral');
      expect(claim).toContain('public.can_manage_family(actor_family)');
      expect(claim.indexOf('can_manage_family')).toBeLessThan(claim.indexOf('insert into public.referrals'));
      expect(part('referral_claim_state')).toContain('public.can_manage_family(actor_family)');
    });

    it('moves exactly the commissions it totalled into the payout', () => {
      const request = part('request_affiliate_payout');
      expect(request).toContain('array_agg(locked.id)');
      expect(request).toContain('where id = any(chosen)');
      expect(request).not.toContain('referral.referrer_user_id = target_user\n    and commission.status');
      expect(request).toContain('total bigint');
    });

    it('needs a fresh claim by the same admin before a payout is paid or contested', () => {
      const claim = part('admin_claim_affiliate_payout');
      expect(claim).toContain("return 'taken'");
      expect(claim).toContain("interval '2 hours'");
      const resolveFn = part('admin_resolve_affiliate_payout');
      expect(resolveFn).toContain("return 'claimed_by_other'");
      expect(resolveFn).toContain("return 'claim_required'");
      expect(fixes).toContain('grant execute on function public.admin_claim_affiliate_payout(uuid, uuid) to service_role;');
      expect(fixes).not.toMatch(/grant execute on function public\.admin_claim_affiliate_payout\(uuid, uuid\) to authenticated/);
    });

    it('lists every waiting payout and caps only the resolved history', () => {
      const overview = part('admin_affiliate_overview');
      expect(overview).toContain("where affiliate_payout.status = 'requested')");
      expect(overview).toContain('limit 50');
      expect(overview).not.toContain('limit 100');
    });
  });

  describe('referral discount migration', () => {
    const discount = readFileSync(resolve('supabase/migrations/202610010004_referral_discount.sql'), 'utf8');
    const discountVerification = readFileSync(resolve('supabase/preflight/202610010004_referral_discount.verify.sql'), 'utf8');

    it('parses as PostgreSQL SQL', async () => {
      await expect(parse(discount)).resolves.toBeDefined();
      await expect(parse(discountVerification)).resolves.toBeDefined();
    });

    it('defaults to 10 percent, bounded, and applies only to a referred family that has not paid', () => {
      expect(discount).toContain('referred_discount_bps integer not null default 1000');
      expect(discount).toContain('between 0 and 5000');
      expect(discount).toContain('settings.enabled');
      expect(discount).toContain('referral.referred_family_id = target_family');
      expect(discount).toContain("payment_order.status = 'PAID'");
    });

    it('is readable by the service role only', () => {
      expect(discount).toContain('revoke all on function public.referral_discount_bps(uuid) from public, anon, authenticated;');
      expect(discount).toContain('grant execute on function public.referral_discount_bps(uuid) to service_role;');
      expect(discount).not.toMatch(/grant execute on function public\.referral_discount_bps\(uuid\) to (authenticated|anon)/);
      expect(discount).toContain("set search_path = ''");
    });
  });
});
