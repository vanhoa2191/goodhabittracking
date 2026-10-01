import { describe, expect, it } from 'vitest';
import { minimizeAdminAuditSnapshot } from '@/lib/auth/admin-audit';

describe('admin audit minimization', () => {
  it('keeps only allowlisted operational fields and strips PII and secrets recursively', () => {
    const snapshot = minimizeAdminAuditSnapshot({
      plan: 'yearly',
      status: 'active',
      phone: '0911222333',
      email: 'child@example.com',
      notes: 'private support note',
      token: 'secret-token',
      nested: { password: 'secret' },
      tagCount: 2,
      hasNotes: true,
      expiresAt: '2027-01-01T00:00:00.000Z',
    });

    expect(snapshot).toEqual({
      plan: 'yearly',
      status: 'active',
      tagCount: 2,
      hasNotes: true,
      expiresAt: '2027-01-01T00:00:00.000Z',
    });
    expect(JSON.stringify(snapshot)).not.toMatch(/0911222333|child@example\.com|private support note|secret/i);
  });

  it('keeps the affiliate action fields the database allowlist also accepts', () => {
    expect(minimizeAdminAuditSnapshot({ claimed: true, referral: 'reversed', accountNumber: '123' }))
      .toEqual({ claimed: true, referral: 'reversed' });
  });
});
