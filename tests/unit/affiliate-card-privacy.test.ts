import { createElement } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AffiliateCard } from '@/components/AffiliateCard';

const hooks = vi.hoisted(() => ({ index: 0, overview: {} as Record<string, unknown> }));
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof React>(),
  useState: (initial: unknown) => [hooks.index++ === 0 ? hooks.overview : initial, vi.fn()],
  useCallback: (callback: unknown) => callback,
  useEffect: () => undefined,
  useId: () => 'affiliate-title',
}));
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: 'en' }) }));
vi.mock('@/lib/site', () => ({ getMarketingOrigin: () => ({ origin: 'https://example.com' }) }));
vi.mock('@/components/help/HelpTip', () => ({ HelpTip: () => null }));

beforeEach(() => {
  hooks.index = 0;
  hooks.overview = {
    enrolled: true, enabled: true, code: 'ABCDEFGH', status: 'active', signups: 17, paying: 9,
    amounts: { held: 111111, available: 222222, requested: 333333, paid: 444444 },
    payout: { bank: 'Bank', accountLast4: '1234', accountName: 'Affiliate', complete: true },
    settings: { commissionBps: 3000, attributionDays: 60, earningWindowDays: 365, holdDays: 35, minPayout: 100000 },
    recent: [],
  };
});

describe('AffiliateCard aggregate privacy', () => {
  it('renders only aggregates even when an old response includes individual payment/refund details', () => {
    const aggregateHtml = renderToStaticMarkup(createElement(AffiliateCard));
    hooks.index = 0;
    hooks.overview.recent = [
      { createdAt: '2025-02-13T12:34:56Z', amount: 98765, status: 'reversed', planId: 'private-plan-marker' },
      { createdAt: '2025-08-21T09:08:07Z', amount: 87654, status: 'pending', planId: 'yearly' },
    ];
    const obsoleteHtml = renderToStaticMarkup(createElement(AffiliateCard));
    expect(obsoleteHtml).toBe(aggregateHtml);
    const values = [...obsoleteHtml.matchAll(/<dd\b[^>]*>(.*?)<\/dd>/g)].map((match) => match[1]);
    expect(values).toEqual(['17', '9', '111,111 VND', '222,222 VND', '333,333 VND', '444,444 VND']);
  });
});
