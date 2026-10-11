import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { promoOffers } from '../../apps/marketing/site-content.mjs';

const client = readFileSync(new URL('../../apps/marketing/client.js', import.meta.url), 'utf8');
const offers = [
  { code: 'pro_plus_upsell_690', slots: 200, remaining: 17, endsAt: null },
  { code: 'pro_plus_b1g1', slots: 100, remaining: 8, endsAt: '2026-12-31T17:00:00Z' },
];

async function visit(data: unknown, { ok = true, now = Date.parse('2026-10-11T12:00:00Z'), rejected = false } = {}) {
  const founding = { dataset: { appOrigin: 'https://app.example' }, textContent: '' };
  const links = promoOffers.map((offer) => ({
    dataset: { promoOffer: offer.offerCode, promoSlots: String(offer.slots), promoEndsAt: offer.endsAt ?? '', promoCopy: offer.text },
    hidden: true,
    textContent: '',
  }));
  const fetch = rejected ? vi.fn().mockRejectedValue(new Error('offline')) : vi.fn().mockResolvedValue({ ok, json: async () => data });
  const document = {
    documentElement: { dataset: {} }, readyState: 'loading',
    querySelector: (selector: string) => selector === '[data-offer-remaining]' ? founding : null,
    querySelectorAll: (selector: string) => selector === '[data-promo-offer]' ? links : [],
  };
  const window = { location: { search: '' }, matchMedia: () => ({ matches: true }), fetch, setTimeout, clearTimeout, addEventListener: () => undefined };
  runInNewContext(client, { document, window, fetch, AbortController, URLSearchParams, Date: { now: () => now, parse: Date.parse } });
  await new Promise<void>((resolve) => setImmediate(resolve));
  return { founding, links, fetch };
}

describe('marketing live promo banners', () => {
  it('uses one request for all offers and shows exact promo text only with a live positive count', async () => {
    const { founding, links, fetch } = await visit({ remaining: 3, slots: 10, offers });
    expect(founding.textContent).toBe('Còn 3/10 suất');
    expect(links.map((link) => link.hidden)).toEqual([false, false]);
    expect(links[0].textContent).toBe('Thêm 100.000đ để lên Pro Plus: AI không giới hạn. Còn 17/200 suất.');
    expect(links[1].textContent).toBe('Mua 1 năm tặng 1 năm: 790.000đ cho 2 năm Pro Plus. Còn 8/100 suất, đến hết 31/12/2026.');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each([null, {}, { remaining: 4, slots: 10 }, { offers: offers.map((offer) => ({ ...offer, remaining: 0 })) }, { offers: offers.map((offer) => ({ ...offer, remaining: '1' })) }])('keeps promo banners hidden without available counts: %j', async (data) => {
    const { links } = await visit(data);
    expect(links.map((link) => link.hidden)).toEqual([true, true]);
    expect(links.map((link) => link.textContent)).toEqual(['', '']);
  });
  it.each([{ ok: false }, { rejected: true }])('keeps list-price page intact on offer request failure: %j', async (options) => {
    const { founding, links } = await visit({ offers }, options);
    expect(founding.textContent).toBe('');
    expect(links.map((link) => link.hidden)).toEqual([true, true]);
  });
  it('hides B1G1 at the Saigon cutoff even if a stale API response says it is open', async () => {
    const { links } = await visit({ offers }, { now: Date.parse('2026-12-31T17:00:00Z') });
    expect(links.map((link) => link.hidden)).toEqual([false, true]);
  });
  it('rejects malformed expiry and counts independently of a readable founding count', async () => {
    const { founding, links } = await visit({ remaining: 2, slots: 10, offers: [{ ...offers[0], remaining: -1 }, { ...offers[1], endsAt: 'invalid' }] });
    expect(founding.textContent).toBe('Còn 2/10 suất');
    expect(links.map((link) => link.hidden)).toEqual([true, true]);
  });
});
