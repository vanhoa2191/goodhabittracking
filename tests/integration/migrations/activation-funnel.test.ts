import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300008_activation_funnel.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300008_activation_funnel.verify.sql'), 'utf8');

describe('activation funnel migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('returns counts only: no name, email or identifier column', () => {
    const returns = migration.slice(migration.indexOf('returns table'), migration.indexOf('language sql'));
    expect(returns).not.toMatch(/\b(name|email|user_id|family_id|child_id)\b/);
  });

  it('runs with a protected search path and only the service role may call it', () => {
    expect(migration.match(/set search_path = ''/g)).toHaveLength(2);
    expect(migration).toContain('revoke all on function public.admin_activation_funnel(integer) from public, anon, authenticated;');
    expect(migration).toContain('grant execute on function public.admin_activation_funnel(integer) to service_role;');
    expect(migration).toContain('grant execute on function public.admin_retention_snapshot() to service_role;');
  });

  it('bounds the window it will scan', () => {
    expect(migration).toContain('greatest(1, least(coalesce(window_days, 30), 365))');
  });
});
