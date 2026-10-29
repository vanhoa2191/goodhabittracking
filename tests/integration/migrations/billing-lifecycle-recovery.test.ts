import { readFileSync } from 'node:fs';
import { parse, parsePlPgSQL } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync('supabase/migrations/202610270001_billing_lifecycle_recovery.sql', 'utf8');
const rollback = readFileSync('supabase/rollbacks/202610270001_billing_lifecycle_recovery.rollback.sql', 'utf8');
const scenarios = readFileSync('tests/integration/migrations/billing-lifecycle-recovery.scenarios.sql', 'utf8');
const body = (name: string) => {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start).toBeGreaterThanOrEqual(0);
  return migration.slice(start, migration.indexOf('$$;', start) + 3);
};

describe('billing/lifecycle recovery SQL contracts (source validation only)', () => {
  it.each([migration, rollback, scenarios])('parses PostgreSQL statements and PL/pgSQL bodies', async (sql) => {
    await expect(parse(sql)).resolves.toBeDefined();
    await expect(parsePlPgSQL(sql)).resolves.toBeDefined();
  });

  it('checks pending payments after order and family locks, before deleting or minimising data', () => {
    const sql = body('delete_owned_family');
    const guard = sql.indexOf("raise exception 'family_has_pending_payments'");
    expect(sql.indexOf('order by order_code for update')).toBeLessThan(guard);
    expect(sql.indexOf('created_by = actor_id for update')).toBeLessThan(guard);
    expect(guard).toBeLessThan(sql.indexOf('update public.billing_webhook_events'));
    expect(guard).toBeLessThan(sql.indexOf('delete from public.families'));
  });

  it('retains late receipt work outside family cascades and validates the amount first', () => {
    const sql = body('process_payos_webhook');
    expect(sql.indexOf("return 'amount_mismatch'")).toBeLessThan(sql.indexOf('insert into public.billing_late_payments'));
    expect(sql).toContain("return 'late_payment_recorded'");
    const queue = migration.slice(0, migration.indexOf('create table public.subscription_order_grants'));
    expect(queue).not.toContain('references public.families');
    expect(queue).not.toContain('incoming_payload');
  });

  it('uses the same grant projection for settlement and refund, with provenance validation before writes', () => {
    expect(body('process_payos_webhook')).toContain('public.project_subscription_order(');
    const sql = body('revoke_subscription_order_grant');
    expect(sql).toContain('public.project_subscription_order(');
    expect(sql.indexOf('is distinct from expected then return false')).toBeLessThan(sql.indexOf('update public.subscription_order_grants'));
    expect(sql).toContain('grant_row.revoked_at is null');
    expect(body('admin_resolve_billing_case')).toContain("'subscription_grant_review_required'");
    expect(body('admin_resolve_billing_case').indexOf('public.revoke_subscription_order_grant(')).toBeLessThan(body('admin_resolve_billing_case').indexOf('public.admin_reverse_referral_commission('));
  });

  it('quarantines expired processing leases and fences completion by the current claim token', () => {
    const claim = body('claim_lifecycle_messages');
    const candidates = claim.slice(claim.indexOf('with candidates as'));
    expect(candidates).not.toContain("message.status = 'processing'");
    expect(claim).toContain("last_error_code = 'delivery_uncertain'");
    expect(claim).toContain('claim_token = gen_random_uuid()');
    expect(migration).toContain('message.claim_token = lease_token and lease_token is not null');
    expect(migration).toContain('as $$ select false $$');
  });

  it('protects private ledgers and refuses destructive rollback after monetary activity', () => {
    expect(migration).toContain('revoke all on public.billing_late_payments, public.subscription_order_grants from public, anon, authenticated');
    expect(migration).toContain('grant select on public.subscription_order_grants to service_role');
    expect(rollback.indexOf('billing_recovery_rollback_requires_manual_review')).toBeLessThan(rollback.indexOf('drop table public.subscription_order_grants'));
  });
});
