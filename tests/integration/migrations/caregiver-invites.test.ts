import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migrationPath = join(
  process.cwd(),
  'supabase/migrations/202609280002_caregiver_invites.sql',
);

describe('caregiver invitation migration', () => {
  it('exists and parses as PostgreSQL', async () => {
    expect(existsSync(migrationPath)).toBe(true);
    const migration = readFileSync(migrationPath, 'utf8');
    await expect(parse(migration)).resolves.toBeDefined();
  });

  it('stores only a token hash and enforces expiry, one-time use and revocation', () => {
    const migration = readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('token_hash bytea not null unique');
    expect(migration).not.toMatch(/raw_token\s+text\s+not\s+null/i);
    expect(migration).toContain('target.expires_at <= now()');
    expect(migration).toContain('target.accepted_at is not null');
    expect(migration).toContain('target.revoked_at is not null');
    expect(migration).toContain('for update');
  });

  it('adds only a read-only caregiver role and protects family boundaries', () => {
    const migration = readFileSync(migrationPath, 'utf8');
    expect(migration).toContain("'caregiver'");
    expect(migration).toContain("membership.role = 'owner'");
    expect(migration).toContain('account_already_belongs_to_family');
    expect(migration).not.toMatch(/can_manage_family[\s\S]*caregiver/i);
  });

  it('records create, accept and revoke events without exposing tokens', () => {
    const migration = readFileSync(migrationPath, 'utf8');
    expect(migration).toContain('caregiver_invite_events');
    expect(migration).toContain("'created'");
    expect(migration).toContain("'accepted'");
    expect(migration).toContain("'revoked'");
    expect(migration).toContain('revoke all on public.caregiver_invites');
  });
});
