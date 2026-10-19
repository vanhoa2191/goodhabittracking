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
// The model and its safety checks only know Vietnamese and English, so the buttons are offered in those languages only.
const languages: readonly Language[] = ['en'];
const unsupportedLanguages: readonly Language[] = ['fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

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

for (const [surface, render] of surfaces) {
  it.each(unsupportedLanguages)(`${surface} is not offered in %s`, (language) => {
    state.language = language;
    state.index = 0;
    expect(render()).toBeNull();
  });
}

beforeEach(() => { state.index = 0; state.values = []; state.language = 'vi'; state.plan = 'monthly'; state.endsAt = null; state.request.mockReset(); });

const family = (reason: string, tier: string) => ({ ok: false, code: 'ai_quota', reason, tier });
const text = (html: string) => html.replace(/<[^>]+>/g, '');

for (const [surface, render] of surfaces) {
  it(`${surface} asks to wait a few seconds after a too-fast tap, without selling anything`, async () => {
    const html = await showFailure(render, family('too_fast', 'plus'));
    expect(text(html)).toContain('Bạn thao tác hơi nhanh. Chờ vài giây rồi thử lại nhé.');
    expect(html).not.toContain('/checkout?');
  });
}

for (const [surface, render] of surfaces) {
  describe(`${surface} monthly quota`, () => {
    it('sells only Pro Plus to a free family that used its 10 monthly suggestions', async () => {
      state.plan = 'free';
      const html = await showFailure(render, family('family_month', 'free'));
      expect(text(html)).toContain('Bạn đã dùng hết 10 lượt gợi ý miễn phí tháng này. Nâng lên Pro Plus để dùng không giới hạn.');
      expect(html).toContain('href="/checkout?plan=pro_plus_monthly"');
      expect(html).not.toContain('ai_addon_monthly');
      expect(html.match(/<a\b/g)).toHaveLength(1);
    });

    it('offers the add-on and Pro Plus to a standard family that used its 20', async () => {
      const html = await showFailure(render, family('family_month', 'standard'));
      expect(text(html)).toContain('Bạn đã dùng hết 20 lượt gợi ý tháng này. Thêm Add-on AI (29.000đ/tháng) hoặc nâng lên Pro Plus để dùng không giới hạn.');
      expect(html).toContain('href="/checkout?plan=ai_addon_monthly"');
      expect(html).toContain('href="/checkout?plan=pro_plus_monthly"');
      expect(html.match(/<a\b/g)).toHaveLength(2);
    });

    it.each(['vi', ...languages] as const)('offers only the AI add-on to a lifetime family in %s', async (language) => {
      state.language = language;
      state.plan = 'lifetime';
      const html = await showFailure(render, family('family_month', 'standard'));
      expect(html).toContain('href="/checkout?plan=ai_addon_monthly"');
      expect(html).not.toContain('pro_plus_monthly');
      expect(html.match(/<a\b/g)).toHaveLength(1);
      expect(html).not.toMatch(/\{addon\}|\{upgrade\}/);
      if (language === 'vi') expect(text(html)).toContain('Bạn đã dùng hết 20 lượt gợi ý tháng này. Thêm Add-on AI (29.000đ/tháng) để dùng không giới hạn.');
    });

    it.each([['free', null], ['pro_plus_monthly', null], ['monthly', '2000-01-01T00:00:00Z']])('offers only Pro Plus to a standard family on %s ending %s', async (plan, endsAt) => {
      state.plan = plan;
      state.endsAt = endsAt;
      const html = await showFailure(render, family('family_month', 'standard'));
      expect(text(html)).toContain('Bạn đã dùng hết 20 lượt gợi ý tháng này. Nâng lên Pro Plus để dùng không giới hạn.');
      expect(html).not.toContain('ai_addon_monthly');
    });

    it.each(['free', 'standard', 'plus'])('asks a %s family to come back tomorrow after the daily safety cap, without a sale', async (tier) => {
      const html = await showFailure(render, family('family_day', tier));
      expect(html).toContain('Hôm nay bạn đã dùng rất nhiều gợi ý. Quay lại vào ngày mai nhé.');
      expect(html).not.toContain('/checkout?');
    });

    it('never sells to a plus family on a monthly refusal', async () => {
      const html = await showFailure(render, family('family_month', 'plus'));
      expect(html).toContain('role="alert"');
      expect(html).not.toContain('/checkout?');
    });

    it.each(languages)('localizes both monthly upsells and the daily message in %s', async (language) => {
      state.language = language;
      const free = await showFailure(render, family('family_month', 'free'));
      expect(free).toContain('10');
      expect(free).toContain('href="/checkout?plan=pro_plus_monthly"');
      expect(free).not.toContain('ai_addon_monthly');
      const standard = await showFailure(render, family('family_month', 'standard'));
      expect(standard).toContain('20');
      expect(standard).toMatch(/29[., ]000/);
      expect(standard).toContain('href="/checkout?plan=ai_addon_monthly"');
      expect(standard).toContain('href="/checkout?plan=pro_plus_monthly"');
      const day = await showFailure(render, family('family_day', 'plus'));
      expect(day).not.toContain('/checkout?');
      const all = free + standard + day;
      expect(all).not.toMatch(/\{addon\}|\{upgrade\}/);
      expect(all).not.toMatch(/[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u);
    });

    it.each(['system_day', undefined])('does not upsell a non-family refusal (%s)', async (reason) => {
      const html = await showFailure(render, { ok: false, code: 'ai_quota', reason, tier: 'free' });
      expect(html).toContain('role="alert"');
      expect(html).not.toContain('/checkout?');
      expect(html).not.toContain('29.000');
    });
  });
}
