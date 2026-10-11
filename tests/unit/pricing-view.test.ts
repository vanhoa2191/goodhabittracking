import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PricingPlans } from '@/components/public/PricingPlans';

vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: 'vi' }) }));
import { addonCards, buildPricingView, MAX_SAVING_PERCENT } from '@/lib/billing/pricing-view';

describe('pricing view', () => {
  it('hides printables until the sale flag is on', () => {
    expect(addonCards({ printablesSale: false })).toEqual([{ id: 'ai_addon_monthly', price: 29000 }]);
    expect(addonCards({ printablesSale: true })).toEqual([{ id: 'ai_addon_monthly', price: 29000 }, { id: 'printables', price: 99000 }]);
  });
  it('shows the yearly price, the full-year price it replaces and the saving for every plan', () => {
    const [solo, pro, plus] = buildPricingView('year');
    expect([solo.savingPercent, pro.savingPercent, plus.savingPercent]).toEqual([32, 29, 17]);
    expect(solo).toEqual({ tier: 'solo', planId: 'solo_yearly', price: 399000, fullYearPrice: 588000, perMonth: 33300, perDay: 1090, saving: 189000, savingPercent: 32, purchasable: true });
    expect(pro).toEqual({ tier: 'pro', planId: 'yearly', price: 590000, fullYearPrice: 828000, perMonth: 49200, perDay: 1620, saving: 238000, savingPercent: 29, purchasable: true });
    expect(plus).toEqual({ tier: 'pro_plus', planId: 'pro_plus_yearly', price: 790000, fullYearPrice: 948000, perMonth: 65800, perDay: 2160, saving: 158000, savingPercent: 17, purchasable: true });
  });

  it('shows the monthly price with no saving, and ids the payment code accepts', () => {
    const cards = buildPricingView('month');
    expect(cards.map((card) => card.planId)).toEqual(['solo_monthly', 'monthly', 'pro_plus_monthly']);
    expect(cards.map((card) => card.price)).toEqual([49000, 69000, 79000]);
    expect(cards.map((card) => card.perDay)).toEqual([1630, 2300, 2630]);
    for (const card of cards) {
      expect(card.saving).toBeNull();
      expect(card.savingPercent).toBeNull();
      expect(card.fullYearPrice).toBeNull();
      expect(card.perMonth).toBeNull();
    }
  });

  it('makes all three tiers buyable and shows the headline saving of 32 percent', () => {
    for (const cycle of ['month', 'year'] as const) {
      expect(buildPricingView(cycle)[2]).toMatchObject({ tier: 'pro_plus', planId: cycle === 'year' ? 'pro_plus_yearly' : 'pro_plus_monthly', purchasable: true });
    }
    expect(buildPricingView('year').map((card) => card.price)).toEqual([399000, 590000, 790000]);
    expect(MAX_SAVING_PERCENT).toBe(32);
    const best = Math.max(...buildPricingView('year').map((card) => card.savingPercent ?? 0));
    expect(best).toBe(MAX_SAVING_PERCENT);
  });
});

describe('pricing plan cards', () => {
  it('renders three yearly purchase links, the AI benefit and the add-on line', () => {
    const html = renderToStaticMarkup(createElement(PricingPlans, {
      renderAction: (id, text) => createElement('a', { href: `/checkout?plan=${id}` }, text.cta),
    }));
    for (const id of ['solo_yearly', 'yearly', 'pro_plus_yearly']) expect(html).toContain(`href="/checkout?plan=${id}"`);
    expect(html).toContain('Add-on AI');
    expect(html).not.toMatch(/upcoming-plans|family_plus|sắp ra mắt|coming soon/i);
  });
});
