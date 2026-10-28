import { createElement } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { Language } from '@/types';

const state = vi.hoisted(() => ({ index: 0, values: [] as unknown[], effects: true, language: 'vi' as Language }));
vi.mock('react', async (load) => ({
  ...await load<typeof React>(),
  useState: (initial: unknown) => {
    const index = state.index++;
    if (!(index in state.values)) state.values[index] = typeof initial === 'function' ? initial() : initial;
    return [state.values[index], (value: unknown) => { state.values[index] = value; }];
  },
  useEffect: (effect: () => unknown) => { if (state.effects) effect(); },
}));
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: state.language }) }));
import { PricingPlans } from '@/components/public/PricingPlans';
import { promoForCard, promoForCheckout } from '@/lib/billing/pricing-view';
import { getPromoCopy } from '@/lib/i18n/promo-copy';

const offers = [
  { code: 'pro_plus_upsell_690', slots: 200, remaining: 17, endsAt: null },
  { code: 'pro_plus_b1g1', slots: 100, remaining: 8, endsAt: '2026-12-31T17:00:00Z' },
  { code: 'pro_plus_founding', slots: 10, remaining: 0, endsAt: null },
];
const render = () => {
  state.index = 0;
  return renderToStaticMarkup(createElement(PricingPlans, {
    renderAction: (id, text) => createElement('a', { href: `/checkout?plan=${id}` }, text.cta),
  }));
};
async function load(data: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => data }));
  const initial = render();
  expect(initial).not.toContain('plan=pro_plus_yearly_upsell');
  expect(initial).not.toContain('plan=pro_plus_yearly_b1g1');
  await new Promise<void>((resolve) => setImmediate(resolve));
  state.effects = false;
  return render();
}
const card = (html: string, id: string) => {
  const start = html.indexOf(`data-plan="${id}"`);
  const next = html.indexOf('data-plan="', start + 1);
  return html.slice(start, next < 0 ? html.length : next);
};

beforeEach(() => {
  state.index = 0; state.values = []; state.effects = true; state.language = 'vi';
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('live pricing promotions', () => {
  it('shows the available promotion only on its matching yearly card, keeping list-price purchases', async () => {
    const html = await load({ remaining: 0, offers });
    expect(card(html, 'yearly')).toContain('href="/checkout?plan=pro_plus_yearly_upsell"');
    expect(card(html, 'yearly')).toContain('Thêm 100.000đ để lên Pro Plus: AI không giới hạn (sắp có). Còn 17/200 suất.');
    expect(card(html, 'pro_plus_yearly')).toContain('href="/checkout?plan=pro_plus_yearly_b1g1"');
    expect(card(html, 'pro_plus_yearly')).toContain('Mua 1 năm tặng 1 năm: 790.000đ cho 2 năm Pro Plus. Còn 8/100 suất, đến hết 31/12/2026.');
    expect(card(html, 'solo_yearly')).not.toContain('plan=pro_plus_yearly_upsell');
    for (const id of ['solo_yearly', 'yearly', 'pro_plus_yearly']) expect(html).toContain(`href="/checkout?plan=${id}"`);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([1, 10, null, undefined, '0', -1, 0.5])('hides the paid upsell while founding is available or unreadable: %j', async (remaining) => {
    const data = { offers: offers.map((offer) => offer.code === 'pro_plus_founding' ? { ...offer, remaining } : offer) };
    const html = await load(data);
    expect(card(html, 'yearly')).not.toContain('plan=pro_plus_yearly_upsell');
    expect(card(html, 'yearly')).toContain('href="/checkout?plan=yearly"');
    expect(card(html, 'pro_plus_yearly')).toContain('plan=pro_plus_yearly_b1g1');
    expect(promoForCheckout('yearly', data.offers)).toBeNull();
  });
  it('hides the paid upsell when the founding offer is missing, without hiding B1G1', async () => {
    const data = { offers: offers.filter((offer) => offer.code !== 'pro_plus_founding') };
    const html = await load(data);
    expect(html).not.toContain('plan=pro_plus_yearly_upsell');
    expect(html).toContain('plan=pro_plus_yearly_b1g1');
    expect(promoForCheckout('yearly', data.offers)).toBeNull();
  });
  it.each([{}, { offers: [] }, { offers: offers.map((offer) => ({ ...offer, remaining: 0 })) }, { offers: offers.map((offer) => ({ ...offer, remaining: '10' })) }])('hides unreadable or sold-out promotions: %j', async (data) => {
    const html = await load(data);
    expect(html).not.toContain('plan=pro_plus_yearly_upsell');
    expect(html).not.toContain('plan=pro_plus_yearly_b1g1');
    expect(html).toContain('href="/checkout?plan=pro_plus_yearly"');
  });
  it('hides promotions when the count API fails, without preventing list-price purchases', async () => {
    const html = await load({ offers }, false);
    expect(html).not.toContain('plan=pro_plus_yearly_upsell');
    expect(html).not.toContain('plan=pro_plus_yearly_b1g1');
    expect(html).toContain('href="/checkout?plan=yearly"');
  });
  it('closes B1G1 at midnight Saigon while leaving the undated upsell available', async () => {
    vi.setSystemTime(new Date('2026-12-31T17:00:00Z'));
    const html = await load({ offers });
    expect(html).toContain('plan=pro_plus_yearly_upsell');
    expect(html).not.toContain('plan=pro_plus_yearly_b1g1');
  });
  it('keeps promotions off monthly and Basic cards and refuses expired or malformed counts', () => {
    expect(promoForCard('pro', 'month', offers)).toBeNull();
    expect(promoForCard('solo', 'year', offers)).toBeNull();
    expect(promoForCard('pro_plus', 'year', [{ ...offers[1], endsAt: 'invalid' }])).toBeNull();
    expect(promoForCard('pro', 'year', [{ ...offers[0], remaining: -1 }, offers[2]])).toBeNull();
    expect(promoForCard('pro', 'year', [{ ...offers[0], remaining: 0.5 }, offers[2]])).toBeNull();
  });
  it.each(['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const)('renders translated counts, amounts and dates in %s', async (language) => {
    state.language = language;
    const html = await load({ offers });
    const copy = getPromoCopy(language);
    expect(html).toContain(copy.upsell.replace('{n}', '17'));
    expect(html).toContain(copy.b1g1.replace('{n}', '8'));
    expect(html).not.toContain('{n}');
    if (language !== 'vi') expect(copy.upsell + copy.b1g1).not.toMatch(/[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u);
  });
});

describe('checkout promo selection', () => {
  it('offers the upsell for Pro yearly only, never for another checkout item', () => {
    expect(promoForCheckout('yearly', offers)).toMatchObject({ planId: 'pro_plus_yearly_upsell', remaining: 17 });
    for (const plan of ['monthly', 'solo_yearly', 'pro_plus_yearly', 'pro_plus_yearly_upsell', 'pro_plus_yearly_b1g1', 'ai_addon_monthly', 'printables']) {
      expect(promoForCheckout(plan, offers)).toBeNull();
    }
  });
  it('hides the checkout upsell when exhausted, unreadable or closed', () => {
    expect(promoForCheckout('yearly', [])).toBeNull();
    expect(promoForCheckout('yearly', [{ ...offers[0], remaining: 0 }, offers[2]])).toBeNull();
    expect(promoForCheckout('yearly', [{ ...offers[0], endsAt: '2026-10-01T00:00:00Z' }, offers[2]])).toBeNull();
  });
  it('waits for referral eligibility rather than flashing an upsell before the claim response', () => {
    expect(promoForCheckout('yearly', offers, { referralState: 'loading' })).toBeNull();
  });
  it.each(['eligible', 'referred'] as const)('hides the upsell for referral claim state %s before payment exists', (referralState) => {
    expect(promoForCheckout('yearly', offers, { referralState })).toBeNull();
  });
  it.each(['hidden', 'referred', 'eligible'] as const)('a payment discount hides the upsell regardless of referral state %s', (referralState) => {
    expect(promoForCheckout('yearly', offers, { discountAmount: 59000, referralState })).toBeNull();
  });
  it('keeps the upsell for an undiscounted yearly order with no referral eligibility', () => {
    expect(promoForCheckout('yearly', offers, { discountAmount: 0, referralState: 'hidden' })).toMatchObject({ planId: 'pro_plus_yearly_upsell', remaining: 17 });
  });
});
