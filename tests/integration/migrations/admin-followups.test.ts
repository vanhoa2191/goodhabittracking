import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610020001_admin_followups.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610020001_admin_followups.verify.sql'), 'utf8');

describe('admin follow-ups migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('counts exactly 7 and 30 calendar days including today', () => {
    expect(migration).toContain('log.log_date >= current_date - 6');
    expect(migration).toContain('log.log_date >= current_date - 29');
    expect(migration).toContain('current_date - (greatest(1, least(coalesce(window_days, 30), 365)) - 1)');
    expect(migration).not.toMatch(/current_date - (7|30)\b/);
  });

  it('accepts the affiliate audit fields and keeps the allowlist closed', () => {
    expect(migration).toContain("'claimed'");
    expect(migration).toContain("'referral'");
    expect(migration).not.toMatch(/'(email|phone|accountNumber)'/);
  });

  it('keeps the funnel functions service-role only', () => {
    expect(migration).toContain('revoke all on function public.admin_activation_funnel(integer) from public, anon, authenticated;');
    expect(migration).toContain('grant execute on function public.admin_retention_snapshot() to service_role;');
  });
});
