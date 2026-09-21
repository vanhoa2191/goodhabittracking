import { describe, expect, it } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { isAdminUser } from '@/lib/auth/admin-access';
import { PRICING_PLANS } from '@/lib/payos';
import { paidPlanSchema } from '@/lib/billing/schemas';

const user = (email: string): User => ({ id: 'admin-id', email } as User);

describe('admin and pricing boundaries', () => {
  it('matches only configured admin emails without case sensitivity', () => {
    expect(isAdminUser(user('Owner@Example.com'), 'admin@example.com, owner@example.com')).toBe(true);
    expect(isAdminUser(user('other@example.com'), 'owner@example.com')).toBe(false);
  });

  it('removes lifetime from sale while keeping monthly and yearly', () => {
    expect(PRICING_PLANS.map((plan) => plan.id)).not.toContain('lifetime');
    expect(PRICING_PLANS.map((plan) => plan.id)).toEqual(expect.arrayContaining(['monthly', 'yearly']));
    expect(paidPlanSchema.safeParse('lifetime').success).toBe(false);
  });
});
