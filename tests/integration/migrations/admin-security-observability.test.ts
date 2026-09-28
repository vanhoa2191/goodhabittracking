import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migrationPath = join(
  process.cwd(),
  'supabase/migrations/202609280003_admin_security_observability.sql',
);

describe('admin security and observability migration', () => {
  it('exists and parses as PostgreSQL', async () => {
    expect(existsSync(migrationPath)).toBe(true);
    const migration = readFileSync(migrationPath, 'utf8');
    await expect(parse(migration)).resolves.toBeDefined();
  });

  it('stores revocable, expiring DB-backed roles', () => {
    const migration = readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('create table if not exists public.admin_memberships');
    expect(migration).toContain("role in ('support', 'finance', 'super_admin')");
    expect(migration).toContain('expires_at timestamptz');
    expect(migration).toContain('revoked_at timestamptz');
    expect(migration).toContain('revoke all on public.admin_memberships from anon, authenticated');
  });

  it('creates an immutable, minimized audit ledger', () => {
    const migration = readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('create table if not exists public.admin_audit_events');
    expect(migration).toContain('correlation_id uuid not null');
    expect(migration).toContain('before_data jsonb not null');
    expect(migration).toContain('after_data jsonb not null');
    expect(migration).toContain('reason text not null');
    expect(migration).toContain('reject_admin_audit_mutation');
    expect(migration).toMatch(/before update or delete[\s\S]*admin_audit_events/i);
    expect(migration).toMatch(/before truncate[\s\S]*admin_audit_events/i);
    expect(migration).toContain('admin_audit_snapshot_is_minimized');
    expect(migration).toContain('revoke truncate on table public.admin_audit_events from service_role');
    expect(migration).toContain('revoke all on public.admin_audit_events from anon, authenticated');
  });

  it('serializes admin grants and revocations in the database', () => {
    const migration = readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('grant_admin_membership');
    expect(migration).toContain('revoke_admin_membership');
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('last_super_admin_required');
    expect(migration).toContain('grant execute on function public.grant_admin_membership');
  });

  it('persists only sanitized operational counters for alerting', () => {
    const migration = readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('create table if not exists public.operational_events');
    expect(migration).toContain("'payment_webhook_failure', 'profile_mutation_failure', 'pairing_failure'");
    expect(migration).toContain('correlation_id uuid not null');
    expect(migration).not.toMatch(/operational_events[\s\S]{0,900}(email|phone|child_id|family_id|payload)/i);
    expect(migration).toContain('revoke all on public.operational_events from anon, authenticated');
  });
});
