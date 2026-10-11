import { describe, expect, it } from 'vitest';
import {
  LAUNCH_OFFER,
  PAID_PLAN_IDS,
  PLAN_PRICES,
  isPaidPlanId,
  planChildLimit,
  planCycle,
  planDurationDays,
  planIdFor,
  planTier,
} from '@/lib/billing/plan-catalog';

describe('plan catalog', () => {
  it('lists the six plans on sale', () => {
    expect(PAID_PLAN_IDS).toEqual(['solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly']);
  });

  it('maps tier and cycle to a plan id and back', () => {
    expect(planIdFor('solo', 'month')).toBe('solo_monthly');
    expect(planIdFor('solo', 'year')).toBe('solo_yearly');
    expect(planIdFor('pro', 'month')).toBe('monthly');
    expect(planIdFor('pro', 'year')).toBe('yearly');
    for (const id of PAID_PLAN_IDS) expect(planIdFor(planTier(id), planCycle(id))).toBe(id);
    expect(planTier('yearly')).toBe('pro');
    expect(planTier('solo_monthly')).toBe('solo');
    expect(planIdFor('pro_plus', 'month')).toBe('pro_plus_monthly');
    expect(planIdFor('pro_plus', 'year')).toBe('pro_plus_yearly');
    expect(planTier('pro_plus_monthly')).toBe('pro_plus');
    expect(planTier('pro_plus_yearly')).toBe('pro_plus');
  });

  it('sets a period per cycle', () => {
    expect(planDurationDays('solo_yearly')).toBe(366);
    expect(planDurationDays('yearly')).toBe(366);
    expect(planDurationDays('monthly')).toBe(31);
    expect(planDurationDays('solo_monthly')).toBe(31);
    expect(planDurationDays('pro_plus_yearly')).toBe(366);
    expect(planDurationDays('pro_plus_monthly')).toBe(31);
    expect(planCycle('pro_plus_yearly')).toBe('year');
    expect(planCycle('pro_plus_monthly')).toBe('month');
  });

  it('only accepts plans on sale', () => {
    expect(isPaidPlanId('solo_yearly')).toBe(true);
    expect(isPaidPlanId('pro_plus_yearly')).toBe(true);
    expect(isPaidPlanId('family_plus_yearly')).toBe(false);
    expect(isPaidPlanId('ai_addon_monthly')).toBe(false);
    expect(isPaidPlanId('lifetime')).toBe(false);
    expect(isPaidPlanId(undefined)).toBe(false);
  });

  it('limits children per plan', () => {
    expect(planChildLimit('solo_monthly')).toBe(1);
    expect(planChildLimit('solo_yearly')).toBe(1);
    expect(planChildLimit('monthly')).toBe(5);
    expect(planChildLimit('yearly')).toBe(5);
    expect(planChildLimit('pro_plus_monthly')).toBe(5);
    expect(planChildLimit('pro_plus_yearly')).toBe(5);
    expect(planChildLimit('trial')).toBe(5);
    expect(planChildLimit('lifetime')).toBeNull();
    expect(planChildLimit('free')).toBe(0);
  });

  it('holds the prices and the launch offer', () => {
    expect(PLAN_PRICES).toEqual({
      solo: { month: 49000, year: 399000 },
      pro: { month: 69000, year: 590000 },
      pro_plus: { month: 79000, year: 790000 },
    });
    expect(LAUNCH_OFFER).toEqual({ code: 'pro_plus_founding', slots: 10, planId: 'yearly' });
  });

});
