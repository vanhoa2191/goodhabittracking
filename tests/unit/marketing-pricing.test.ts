import { describe, expect, it } from 'vitest';
import { maxSavingPercent, priceView, pricingTiers, upgradeDifference } from '../../apps/marketing/pricing.mjs';
import { LAUNCH_OFFER, PAID_PLAN_IDS, PLAN_PRICES, planCycle, planTier } from '@/lib/billing/plan-catalog';

const tiers = ['solo', 'pro', 'pro_plus'] as const;

describe('marketing pricing', () => {
  it('lists the three tiers at exactly the prices the app charges', () => {
    expect(Object.keys(pricingTiers)).toEqual([...tiers]);
    for (const tier of tiers) {
      expect(pricingTiers[tier].month.amount).toBe(PLAN_PRICES[tier].month);
      expect(pricingTiers[tier].year.amount).toBe(PLAN_PRICES[tier].year);
    }
  });

  it('sells only the plan ids the payment code accepts, each under its own tier and cycle', () => {
    const sold = tiers.flatMap((tier) => (['month', 'year'] as const).map((cycle) => ({ tier, cycle, id: pricingTiers[tier][cycle].id })));
    const ids = sold.map((entry) => entry.id).filter((id): id is string => id !== null);
    expect(ids.sort()).toEqual([...PAID_PLAN_IDS].sort());
    for (const { tier, cycle, id } of sold) {
      if (id === null) continue;
      expect(planTier(id as (typeof PAID_PLAN_IDS)[number])).toBe(tier);
      expect(planCycle(id as (typeof PAID_PLAN_IDS)[number])).toBe(cycle);
    }
  });

  it('announces Pro Plus without a plan id or a way to buy it', () => {
    const plus = pricingTiers.pro_plus;
    expect(plus.purchasable).toBe(false);
    expect(plus.month.id).toBeNull();
    expect(plus.year.id).toBeNull();
    expect(JSON.stringify(plus)).not.toContain('family_plus');
    expect(pricingTiers.solo.purchasable).toBe(true);
    expect(pricingTiers.pro.purchasable).toBe(true);
  });

  it('shows caregiver invitations as a shared benefit for Basic and Pro', () => {
    expect(pricingTiers.solo.name).toBe('Gói Cơ bản');
    const benefit = 'Mời người thân cùng theo dõi';
    expect(pricingTiers.solo.features).toContain(benefit);
    expect(pricingTiers.pro.features).toContain(benefit);
  });

  it('keeps the launch offer on the yearly Pro plan', () => {
    expect(pricingTiers.pro.year.id).toBe(LAUNCH_OFFER.planId);
  });

  it.each([
    ['solo', 'solo_yearly', 399000, 468000, 33300, 1090, 69000, 15, true],
    ['pro', 'yearly', 590000, 708000, 49200, 1620, 118000, 17, true],
    ['pro_plus', null, 790000, 948000, 65800, 2160, 158000, 17, false],
  ] as const)('shows the yearly %s price per month, per day and what it saves', (tier, planId, price, fullYearPrice, perMonth, perDay, saving, savingPercent, purchasable) => {
    expect(priceView(tier, 'year')).toEqual({ tier, planId, price, fullYearPrice, perMonth, perDay, saving, savingPercent, purchasable });
  });

  it.each([
    ['solo', 'solo_monthly', 39000, 1300, true],
    ['pro', 'monthly', 59000, 1970, true],
    ['pro_plus', null, 79000, 2630, false],
  ] as const)('shows the monthly %s price per day without a saving', (tier, planId, price, perDay, purchasable) => {
    expect(priceView(tier, 'month')).toEqual({ tier, planId, price, fullYearPrice: null, perMonth: price, perDay, saving: null, savingPercent: null, purchasable });
  });

  it('saves up to 17% by paying yearly, and Pro costs 191.000đ a year more than one child', () => {
    expect(maxSavingPercent).toBe(17);
    expect(upgradeDifference('year')).toBe(191000);
    expect(upgradeDifference('month')).toBe(20000);
  });

  it('rejects an unknown tier or cycle instead of rendering a wrong price', () => {
    expect(() => priceView('family_plus' as never, 'year')).toThrow('tier');
    expect(() => priceView('pro', 'week' as never)).toThrow('cycle');
  });
});
