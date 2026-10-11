import { describe, expect, it } from 'vitest';
import { buildPricingView, MAX_SAVING_PERCENT } from '@/lib/billing/pricing-view';

describe('pricing view', () => {
  it('shows the yearly price, the full-year price it replaces and the saving for every plan', () => {
    const [solo, pro, plus] = buildPricingView('year');
    expect([solo.savingPercent, pro.savingPercent, plus.savingPercent]).toEqual([32, 29, 17]);
    expect(solo).toEqual({ tier: 'solo', planId: 'solo_yearly', price: 399000, fullYearPrice: 588000, perMonth: 33300, perDay: 1090, saving: 189000, savingPercent: 32, purchasable: true });
    expect(pro).toEqual({ tier: 'pro', planId: 'yearly', price: 590000, fullYearPrice: 828000, perMonth: 49200, perDay: 1620, saving: 238000, savingPercent: 29, purchasable: true });
    expect(plus).toEqual({ tier: 'pro_plus', planId: null, price: 790000, fullYearPrice: 948000, perMonth: 65800, perDay: 2160, saving: 158000, savingPercent: 17, purchasable: false });
  });

  it('shows the monthly price with no saving, and ids the payment code accepts', () => {
    const cards = buildPricingView('month');
    expect(cards.map((card) => card.planId)).toEqual(['solo_monthly', 'monthly', null]);
    expect(cards.map((card) => card.price)).toEqual([49000, 69000, 79000]);
    expect(cards.map((card) => card.perDay)).toEqual([1630, 2300, 2630]);
    for (const card of cards) {
      expect(card.saving).toBeNull();
      expect(card.savingPercent).toBeNull();
      expect(card.fullYearPrice).toBeNull();
      expect(card.perMonth).toBeNull();
    }
  });

  it('never makes Pro Plus buyable and shows the headline saving of 32 percent', () => {
    for (const cycle of ['month', 'year'] as const) {
      expect(buildPricingView(cycle)[2]).toMatchObject({ tier: 'pro_plus', planId: null, purchasable: false });
    }
    expect(MAX_SAVING_PERCENT).toBe(32);
    const best = Math.max(...buildPricingView('year').map((card) => card.savingPercent ?? 0));
    expect(best).toBe(MAX_SAVING_PERCENT);
  });
});
