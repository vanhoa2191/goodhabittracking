import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { aiAvailability, maxSavingPercent, priceView, pricingTiers, upgradeDifference } from '../../apps/marketing/pricing.mjs';
import { LAUNCH_OFFER, PAID_PLAN_IDS, PLAN_PRICES, planCycle, planTier } from '@/lib/billing/plan-catalog';
import { defaultExperienceFlags } from '@/lib/experience-flags';

const tiers = ['solo', 'pro', 'pro_plus'] as const;

describe('marketing pricing', () => {
  it('labels AI rights as upcoming when their app features are disabled', () => {
    expect(aiAvailability).toEqual({ suggestions: defaultExperienceFlags.parentAi, coach: defaultExperienceFlags.habitCoach });
    const aiLines = [pricingTiers.solo.features.at(-1), pricingTiers.pro.features.at(-1), pricingTiers.pro_plus.features[1], pricingTiers.pro_plus.features[3]];
    for (const line of aiLines) expect(line?.includes('(sắp có)')).toBe(!defaultExperienceFlags.parentAi);
    expect(pricingTiers.pro_plus.features[2].includes('(sắp có)')).toBe(!defaultExperienceFlags.habitCoach);
  });
  it('keeps the design contract and claims ledger aligned with charged prices and savings', () => {
    const design = readFileSync('DESIGN.md', 'utf8');
    const ledger = readFileSync('docs/claims-ledger.md', 'utf8');
    const pricingSection = design.split('### Pricing hierarchy')[1]?.split('## 4.')[0] ?? '';
    const ledgerRow = ledger.split('\n').find((row) => row.startsWith('| Khung giá 3 gói trả phí')) ?? '';
    expect(pricingSection).toContain('three tier cards');
    expect(ledgerRow).toContain('6 SKU');
    for (const tier of tiers) {
      const { month, year } = PLAN_PRICES[tier];
      const formattedMonth = month.toLocaleString('vi-VN');
      const formattedYear = year.toLocaleString('vi-VN');
      const formattedSaving = (month * 12 - year).toLocaleString('vi-VN');
      expect(pricingSection).toContain(`${formattedMonth}đ/tháng, ${formattedYear}đ/năm`);
      expect(ledgerRow).toContain(`${formattedMonth}đ / ${formattedYear}đ`);
      expect(pricingSection).toContain(`${formattedSaving}đ`);
      expect(ledgerRow).toContain(`${formattedSaving}đ`);
    }
  });
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

  it('sells Pro Plus in both billing cycles', () => {
    const plus = pricingTiers.pro_plus;
    expect(plus.purchasable).toBe(true);
    expect(plus.month.id).toBe('pro_plus_monthly');
    expect(plus.year.id).toBe('pro_plus_yearly');
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
    ['solo', 'solo_yearly', 399000, 588000, 33300, 1090, 189000, 32, true],
    ['pro', 'yearly', 590000, 828000, 49200, 1620, 238000, 29, true],
    ['pro_plus', 'pro_plus_yearly', 790000, 948000, 65800, 2160, 158000, 17, true],
  ] as const)('shows the yearly %s price per month, per day and what it saves', (tier, planId, price, fullYearPrice, perMonth, perDay, saving, savingPercent, purchasable) => {
    expect(priceView(tier, 'year')).toEqual({ tier, planId, price, fullYearPrice, perMonth, perDay, saving, savingPercent, purchasable });
  });

  it.each([
    ['solo', 'solo_monthly', 49000, 1630, true],
    ['pro', 'monthly', 69000, 2300, true],
    ['pro_plus', 'pro_plus_monthly', 79000, 2630, true],
  ] as const)('shows the monthly %s price per day without a saving', (tier, planId, price, perDay, purchasable) => {
    expect(priceView(tier, 'month')).toEqual({ tier, planId, price, fullYearPrice: null, perMonth: price, perDay, saving: null, savingPercent: null, purchasable });
  });

  it('saves up to 32% by paying yearly, and Pro costs 191.000đ a year more than one child', () => {
    expect(maxSavingPercent).toBe(32);
    expect(upgradeDifference('year')).toBe(191000);
    expect(upgradeDifference('month')).toBe(20000);
  });

  it('rejects an unknown tier or cycle instead of rendering a wrong price', () => {
    expect(() => priceView('family_plus' as never, 'year')).toThrow('tier');
    expect(() => priceView('pro', 'week' as never)).toThrow('cycle');
  });
});
