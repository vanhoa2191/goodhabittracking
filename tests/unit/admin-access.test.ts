import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { evaluateAdminAccess } from '@/lib/auth/admin-policy';
import { PRICING_PLANS } from '@/lib/payos';
import { paidPlanSchema } from '@/lib/billing/schemas';

const user = (email: string): User => ({
  id: 'admin-id',
  email,
  email_confirmed_at: '2026-09-01T00:00:00.000Z',
} as User);

describe('admin and pricing boundaries', () => {
  it('authorizes only an active DB membership with the required role', () => {
    const now = new Date('2026-09-28T10:00:00.000Z');
    const activeMembership = {
      role: 'finance' as const,
      expiresAt: '2026-10-01T10:00:00.000Z',
      revokedAt: null,
    };

    expect(evaluateAdminAccess({
      user: user('finance@example.com'),
      membership: activeMembership,
      requiredRoles: ['finance'],
      currentAal: 'aal1',
      requireAal2: false,
      now,
    })).toMatchObject({ authorized: true, role: 'finance', source: 'membership' });

    expect(evaluateAdminAccess({
      user: user('finance@example.com'),
      membership: { ...activeMembership, role: 'support' },
      requiredRoles: ['finance'],
      currentAal: 'aal2',
      requireAal2: true,
      now,
    })).toMatchObject({ authorized: false, code: 'insufficient_role' });
  });

  it('fails closed for revoked and expired roles, stale users and missing MFA', () => {
    const now = new Date('2026-09-28T10:00:00.000Z');
    const base = {
      user: user('admin@example.com'),
      requiredRoles: ['super_admin'] as const,
      currentAal: 'aal2' as const,
      requireAal2: true,
      now,
    };

    expect(evaluateAdminAccess({
      ...base,
      membership: { role: 'super_admin', expiresAt: null, revokedAt: now.toISOString() },
    })).toMatchObject({ authorized: false, code: 'membership_revoked' });
    expect(evaluateAdminAccess({
      ...base,
      membership: { role: 'super_admin', expiresAt: '2026-09-28T09:59:59.000Z', revokedAt: null },
    })).toMatchObject({ authorized: false, code: 'membership_expired' });
    expect(evaluateAdminAccess({
      ...base,
      membership: { role: 'super_admin', expiresAt: 'not-a-date', revokedAt: null },
    })).toMatchObject({ authorized: false, code: 'membership_expired' });
    expect(evaluateAdminAccess({
      ...base,
      membership: { role: 'super_admin', expiresAt: null, revokedAt: null },
      currentAal: 'aal1',
    })).toMatchObject({ authorized: false, code: 'mfa_required', status: 428 });
    expect(evaluateAdminAccess({
      ...base,
      user: null,
      membership: null,
    })).toMatchObject({ authorized: false, code: 'authentication_required', status: 401 });
  });

  it('allows ADMIN_EMAILS only as an emergency bootstrap lasting at most 24 hours', () => {
    const now = new Date('2026-09-28T10:00:00.000Z');
    const request = {
      user: user('Owner@Example.com'),
      membership: null,
      requiredRoles: ['super_admin'] as const,
      currentAal: 'aal2' as const,
      requireAal2: true,
      bootstrapEmails: 'admin@example.com, owner@example.com',
      allowEmergencyBootstrap: true,
      now,
    };

    expect(evaluateAdminAccess({
      ...request,
      bootstrapExpiresAt: '2026-09-29T09:59:59.000Z',
    })).toMatchObject({ authorized: true, role: 'super_admin', source: 'emergency_bootstrap' });
    expect(evaluateAdminAccess({
      ...request,
      bootstrapExpiresAt: '2026-09-29T10:00:01.000Z',
    })).toMatchObject({ authorized: false, code: 'membership_required' });
    expect(evaluateAdminAccess({
      ...request,
      bootstrapExpiresAt: '2026-09-28T09:59:59.000Z',
    })).toMatchObject({ authorized: false, code: 'membership_required' });
    expect(evaluateAdminAccess({
      ...request,
      allowEmergencyBootstrap: false,
      bootstrapExpiresAt: '2026-09-29T09:59:59.000Z',
    })).toMatchObject({ authorized: false, code: 'membership_required' });
    expect(evaluateAdminAccess({
      ...request,
      user: { ...user('owner@example.com'), email_confirmed_at: undefined },
      bootstrapExpiresAt: '2026-09-29T09:59:59.000Z',
    })).toMatchObject({ authorized: false, code: 'membership_required' });
  });

  it('removes lifetime and free from sale while keeping all three paid offers', () => {
    expect(PRICING_PLANS.map((plan) => plan.id)).not.toContain('lifetime');
    expect(PRICING_PLANS.map((plan) => plan.id)).not.toContain('free');
    expect(PRICING_PLANS.map((plan) => plan.id)).toEqual(expect.arrayContaining(['solo_monthly', 'monthly', 'yearly']));
    expect(paidPlanSchema.safeParse('lifetime').success).toBe(false);
    expect(paidPlanSchema.safeParse('solo_monthly').success).toBe(true);
  });

  it('keeps the yearly savings claim consistent with the displayed prices', () => {
    const yearly = PRICING_PLANS.find((plan) => plan.id === 'yearly');
    if (!yearly?.originalPrice) throw new Error('Yearly plan requires an original price.');
    const calculatedSavings = Math.round(
      ((yearly.originalPrice - yearly.price) / yearly.originalPrice) * 100,
    );

    expect(yearly.savings).toContain(`${calculatedSavings}%`);
  });
});
