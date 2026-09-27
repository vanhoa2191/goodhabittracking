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
