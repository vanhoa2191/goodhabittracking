import { createElement, type ReactElement, type ReactNode } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language } from '@/types';

const state = vi.hoisted(() => ({ index: 0, values: [] as unknown[], language: 'vi' as Language, request: vi.fn(), plan: 'monthly', endsAt: null as string | null }));
vi.mock('react', async (load) => ({
  ...await load<typeof React>(),
  useState: (initial: unknown) => {
    const index = state.index++;
    if (!(index in state.values)) state.values[index] = initial;
    return [state.values[index], (value: unknown) => { state.values[index] = value; }];
  },
}));
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: state.language }) }));
vi.mock('@/lib/store', () => ({ useAppStore: () => ({ subscriptionPlan: state.plan, subscriptionEndsAt: state.endsAt }) }));
vi.mock('@/lib/store/ai-client', () => ({ useAiConsent: () => ({ enabled: true }), requestBreakdown: state.request, requestWeeklySummary: state.request }));

import { BreakdownButton } from '@/components/ai/BreakdownButton';
import { WeeklySummaryButton } from '@/components/ai/WeeklySummaryButton';

const counts = { weeks: [{ alone: 1, prompted: 0, together: 0, unknown: 0, missed: 0 }], habitsBuilding: 1, habitsNeedingHelp: 0, habitsSteady: 0 };
const surfaces = [
  ['breakdown', () => BreakdownButton({ title: 'Đọc sách', ageYears: 8, onUse: () => undefined })],
  ['summary', () => WeeklySummaryButton({ counts })],
] as const;
const languages: readonly Language[] = ['en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

async function showFailure(render: () => ReactNode, failure: unknown) {
  state.request.mockResolvedValue(failure);
  state.index = 0;
  const element = render() as ReactElement<{ children: ReactNode[] }>;
  const button = element.props.children[0] as ReactElement<{ onClick: () => void }>;
  button.props.onClick();
  await vi.waitFor(() => expect(state.values[0]).toBe(false));
  state.index = 0;
  return renderToStaticMarkup(createElement('div', null, render()));
}

beforeEach(() => { state.index = 0; state.values = []; state.language = 'vi'; state.plan = 'monthly'; state.endsAt = null; state.request.mockReset(); });

for (const [surface, render] of surfaces) {
  describe(`${surface} daily quota`, () => {
    it('offers both paid options after the Vietnamese free daily suggestion', async () => {
      const html = await showFailure(render, { ok: false, code: 'ai_quota', reason: 'family_day', tier: 'basic' });
      expect(html.replace(/<[^>]+>/g, '')).toContain('Hôm nay bạn đã dùng 1 lượt gợi ý miễn phí. Thêm Add-on AI (29.000đ/tháng) hoặc nâng lên Pro Plus để có 10 lượt mỗi ngày.');
      expect(html).toContain('href="/checkout?plan=ai_addon_monthly"');
      expect(html).toContain('href="/checkout?plan=pro_plus_monthly"');
      expect(html.match(/<a\b/g)).toHaveLength(2);
    });

    it.each(['solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime'])('offers the add-on on the active %s plan', async (plan) => {
      state.plan = plan;
      state.endsAt = '2999-01-01T00:00:00Z';
      const html = await showFailure(render, { ok: false, code: 'ai_quota', reason: 'family_day', tier: 'basic' });
      expect(html).toContain('href="/checkout?plan=ai_addon_monthly"');
    });

    it.each([['free', null], ['trial', null], ['pro_plus_monthly', null], ['monthly', '2000-01-01T00:00:00Z']])(
      'offers only Pro Plus on %s ending %s', async (plan, endsAt) => {
        state.plan = plan;
        state.endsAt = endsAt;
        const html = await showFailure(render, { ok: false, code: 'ai_quota', reason: 'family_day', tier: 'basic' });
        expect(html.replace(/<[^>]+>/g, '')).toContain('Hôm nay bạn đã dùng 1 lượt gợi ý miễn phí. Nâng lên Pro Plus để có 10 lượt mỗi ngày.');
        expect(html).not.toContain('ai_addon_monthly');
        expect(html).toContain('href="/checkout?plan=pro_plus_monthly"');
        expect(html.match(/<a\b/g)).toHaveLength(1);
      });

    it.each(languages)('localizes the Pro Plus only upsell in %s', async (language) => {
      state.language = language;
      state.plan = 'free';
      const html = await showFailure(render, { ok: false, code: 'ai_quota', reason: 'family_day', tier: 'basic' });
      expect(html).toContain('href="/checkout?plan=pro_plus_monthly"');
      expect(html).not.toContain('ai_addon_monthly');
      expect(html).not.toMatch(/\{upgrade\}/);
      expect(html).not.toMatch(/[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u);
    });

    it('asks a Plus family to return tomorrow without selling the included allowance', async () => {
      const html = await showFailure(render, { ok: false, code: 'ai_quota', reason: 'family_day', tier: 'plus' });
      expect(html).toContain('Bạn đã dùng hết 10 lượt hôm nay. Quay lại vào ngày mai nhé.');
      expect(html).not.toContain('/checkout?');
    });

    it.each(languages)('localizes basic/plus quotas and purchase links in %s', async (language) => {
      state.language = language;
      const basic = await showFailure(render, { ok: false, code: 'ai_quota', reason: 'family_day', tier: 'basic' });
      expect(basic).toMatch(/29[., ]000/);
      expect(basic).toContain('10');
      expect(basic).toContain('Pro Plus');
      expect(basic).toContain('href="/checkout?plan=ai_addon_monthly"');
      expect(basic).toContain('href="/checkout?plan=pro_plus_monthly"');
      expect(basic).not.toMatch(/\{addon\}|\{upgrade\}/);
      const plus = await showFailure(render, { ok: false, code: 'ai_quota', reason: 'family_day', tier: 'plus' });
      expect(plus).toContain('10');
      expect(plus).not.toContain('/checkout?');
      expect(basic + plus).not.toMatch(/[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u);
      expect(basic + plus).not.toContain('ngày');
    });

    it.each(['system_day', 'too_fast', undefined])('does not upsell a non-family refusal (%s)', async (reason) => {
      const html = await showFailure(render, { ok: false, code: 'ai_quota', reason, tier: 'basic' });
      expect(html).toContain('role="alert"');
      expect(html).not.toContain('/checkout?');
      expect(html).not.toContain('29.000');
    });
  });
}
