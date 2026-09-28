import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  join(process.cwd(), 'supabase/migrations/202609270004_parent_pin_security.sql'),
  'utf8',
);

describe('parent PIN security migration', () => {
  it('parses as PostgreSQL before deployment', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
  });

  it('stores only a hash and configures atomic verification with a lockout', () => {
    expect(migration).toContain('parent_pin_hash text');
    expect(migration).toContain('parent_pin_configured_at timestamptz');
    expect(migration).toContain('parent_pin_failed_attempts integer');
    expect(migration).toContain('parent_pin_locked_until timestamptz');
    expect(migration).toContain('create or replace function public.verify_parent_pin');
    expect(migration).toContain('for update');
    expect(migration).toContain("extensions.crypt(candidate_pin, settings.parent_pin_hash)");
    expect(migration).toContain('parent_pin_failed_attempts >= 4');
  });

  it('never stores the clear PIN in a table column', () => {
    expect(migration).not.toMatch(/add column[^;]*\bparent_pin\s+text/i);
  });

  it('applies the same attempt lockout to PIN changes', () => {
    const changeFunction = migration.split('create or replace function public.set_parent_pin')[1] ?? '';
    expect(changeFunction).toContain('parent_pin_locked_until > clock_timestamp()');
    expect(changeFunction).toContain('parent_pin_failed_attempts >= 4');
    expect(changeFunction).toContain("'status', 'locked'");
  });
});
