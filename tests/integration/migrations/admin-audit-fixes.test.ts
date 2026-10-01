import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202610010005_admin_audit_fixes.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202610010005_admin_audit_fixes.verify.sql'), 'utf8');

function definition(name: string): string {
  const start = migration.indexOf(`create or replace function public.${name}(`);
  expect(start, `${name} is defined`).toBeGreaterThan(-1);
  return migration.slice(start, migration.indexOf('\n$$;', start));
}

describe('admin audit fixes migration', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('re-checks the acting admin inside the locked transaction before granting or revoking access', () => {
    for (const name of ['grant_admin_membership', 'revoke_admin_membership']) {
      const body = definition(name);
      expect(body.indexOf('pg_advisory_xact_lock')).toBeLessThan(body.indexOf('actor_not_authorized'));
      expect(body).toContain("actor_membership.role = 'super_admin'");
      expect(body).toContain('actor_membership.revoked_at is null');
    }
  });

  it('keeps the emergency bootstrap narrow: only a self-grant while no super admin exists', () => {
    const body = definition('grant_admin_membership');
    expect(body).toContain('actor_id is distinct from target_user_id');
    expect(body).toContain("any_super.role = 'super_admin'");
    expect(definition('revoke_admin_membership')).not.toContain('any_super');
  });

  it('pays a payout only under a claim younger than two hours', () => {
    const body = definition('admin_resolve_affiliate_payout');
    expect(body).toContain("payout.processing_at <= now() - interval '2 hours'");
    expect(body).toContain("return 'claim_required'");
  });

  it('leaves the functions callable by the service role only', () => {
    for (const signature of [
      'grant_admin_membership(uuid, text, timestamptz, uuid, text)',
      'revoke_admin_membership(uuid, uuid, text)',
      'admin_resolve_affiliate_payout(uuid, text, uuid, text, text)',
    ]) {
      expect(migration).toContain(`revoke all on function public.${signature} from public, anon, authenticated;`);
      expect(migration).toContain(`grant execute on function public.${signature} to service_role;`);
    }
  });
});
