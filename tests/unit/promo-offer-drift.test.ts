import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { LAUNCH_OFFER, PROMO_PLAN_IDS, PROMO_PLANS } from '@/lib/billing/plan-catalog';
import { getPromoCopy } from '@/lib/i18n/promo-copy';
import { pricingPromos } from '../../apps/marketing/pricing.mjs';
import { promoOffers } from '../../apps/marketing/site-content.mjs';
import { renderPricingPage } from '../../apps/marketing/render-site.mjs';

const client = readFileSync(new URL('../../apps/marketing/client.js', import.meta.url), 'utf8');
const html = renderPricingPage({ appOrigin: 'https://app.example', marketingOrigin: 'https://www.example' });

function promoLinks() {
  return [...html.matchAll(/<a\b[^>]*data-promo-offer="[^"]+"[^>]*>/g)].map(([tag]) => ({
    dataset: Object.fromEntries([...tag.matchAll(/data-([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), value])),
    hidden: true,
    textContent: '',
  }));
}

/** Copy names the inclusive last Saigon day; the catalog stores the exclusive following midnight. */
function copyEndsAt(text: string): string | null {
  const european = text.match(/\b(\d{2})[/.](\d{2})[/.](\d{4})\b/);
  const asian = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日|(?:(\d{4})년 (\d{1,2})월 (\d{1,2})일)/);
  const parts = european ? [european[3], european[2], european[1]] : asian ? (asian[1] ? asian.slice(1, 4) : asian.slice(4, 7)) : null;
  if (!parts) return null;
  const [year, month, day] = parts.map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1) - 7 * 60 * 60 * 1000).toISOString();
}

async function runClient(now: number, remaining: number) {
  const links = promoLinks();
  const founding = { dataset: { appOrigin: 'https://app.example' }, textContent: '' };
  const offers = PROMO_PLAN_IDS.map((id) => {
    const promo = PROMO_PLANS[id];
    return { code: promo.offerCode, slots: promo.slots, endsAt: promo.endsAt, remaining };
  });
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ remaining: 0, slots: LAUNCH_OFFER.slots, offers }) });
  const document = {
    documentElement: { dataset: {} }, readyState: 'loading',
    querySelector: (selector: string) => selector === '[data-offer-remaining]' ? founding : null,
    querySelectorAll: (selector: string) => selector === '[data-promo-offer]' ? links : [],
  };
  const window = { location: { search: '' }, matchMedia: () => ({ matches: true }), fetch, setTimeout, clearTimeout, addEventListener: () => undefined };
  runInNewContext(client, { document, window, fetch, AbortController, URLSearchParams, Date: { now: () => now, parse: Date.parse } });
  await new Promise<void>((resolve) => setImmediate(resolve));
  return links;
}

describe('promotion catalog drift', () => {
  it.each(PROMO_PLAN_IDS)('keeps marketing metadata and rendered client limits aligned for %s', (id) => {
    const canonical = PROMO_PLANS[id];
    expect(pricingPromos[id]).toMatchObject({ slots: canonical.slots, endsAt: canonical.endsAt });
    const offer = promoOffers.find((entry) => entry.planId === id)!;
    expect(offer).toMatchObject({ slots: canonical.slots, endsAt: canonical.endsAt });
    expect(Number(offer.text.match(/\{n\}\/(\d+)/)?.[1])).toBe(canonical.slots);
    expect(copyEndsAt(offer.text)).toBe(canonical.endsAt);
    const link = promoLinks().find((entry) => entry.dataset.promoOffer === canonical.offerCode)!;
    expect(Number(link.dataset.promoSlots)).toBe(canonical.slots);
    expect(link.dataset.promoEndsAt || null).toBe(canonical.endsAt);
  });

  it.each(['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const)('keeps translated advertised slots and inclusive deadline aligned in %s', (language) => {
    const copy = getPromoCopy(language);
    for (const id of PROMO_PLAN_IDS) {
      const text = id === 'pro_plus_yearly_upsell' ? copy.upsell : copy.b1g1;
      expect(Number(text.match(/\{n\}\/(\d+)/)?.[1])).toBe(PROMO_PLANS[id].slots);
      expect(copyEndsAt(text)).toBe(PROMO_PLANS[id].endsAt);
    }
  });

  it('advertises each full offer capacity but rejects counts above its catalog limit', async () => {
    const now = Date.parse(PROMO_PLANS.pro_plus_yearly_b1g1.endsAt!) - 1;
    for (const id of PROMO_PLAN_IDS) {
      const promo = PROMO_PLANS[id];
      const full = (await runClient(now, promo.slots)).find((link) => link.dataset.promoOffer === promo.offerCode)!;
      expect(full.hidden).toBe(false);
      expect(full.textContent).toContain(`${promo.slots}/${promo.slots}`);
      const invalid = (await runClient(now, promo.slots + 1)).find((link) => link.dataset.promoOffer === promo.offerCode)!;
      expect(invalid.hidden).toBe(true);
    }
  });

  it('closes the rendered B1G1 banner exactly at the catalog deadline, not the undated upsell', async () => {
    const deadline = Date.parse(PROMO_PLANS.pro_plus_yearly_b1g1.endsAt!);
    expect((await runClient(deadline - 1, 1)).map((link) => link.hidden)).toEqual([false, false]);
    expect((await runClient(deadline, 1)).map((link) => link.hidden)).toEqual([false, true]);
  });
});
