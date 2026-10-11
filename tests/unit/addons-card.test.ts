import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AddonsCardView, readAddonsEntitlement, type AddonsCardViewProps } from '@/components/AddonsCard';
import { getAddonsCopy } from '@/lib/i18n/addons-copy';
import type { Language } from '@/types';

const base: AddonsCardViewProps = {
  language: 'vi', plan: 'monthly', status: 'active', endsAt: '2099-12-31T00:00:00Z',
  addons: { aiUntil: null, aiIncluded: false, printables: false },
  flags: { printablesSale: false }, now: Date.parse('2026-10-11T00:00:00Z'),
};
const render = (props: Partial<AddonsCardViewProps> = {}) => renderToStaticMarkup(createElement(AddonsCardView, { ...base, ...props }));

describe('AddonsCard', () => {
  it.each(['pro_plus_monthly', 'pro_plus_yearly'] as const)('shows AI included for %s', (plan) => {
    const html = render({ plan });
    expect(html).toContain('Đã gồm trong gói của bạn');
    expect(html).not.toContain('plan=ai_addon_monthly');
  });
  it('shows the founding entitlement as included', () => {
    expect(render({ addons: { ...base.addons, aiIncluded: true } })).toContain('Đã gồm trong gói của bạn');
  });
  it('shows an active add-on expiry and an extension link', () => {
    const html = render({ addons: { ...base.addons, aiUntil: '2026-11-11T00:00:00Z' } });
    expect(html).toContain('Đang dùng đến');
    expect(html).toContain('Thêm 1 tháng · 29.000đ');
    expect(html).toContain('href="/checkout?plan=ai_addon_monthly"');
  });
  it.each(['solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime'] as const)('offers the AI add-on on %s', (plan) => {
    expect(render({ plan, endsAt: null })).toContain('Thêm Add-on AI · 29.000đ/tháng');
  });
  it.each([
    { plan: 'free' as const }, { plan: 'trial' as const }, { status: 'cancelled' },
    { endsAt: '2026-10-10T00:00:00Z' }, { endsAt: 'invalid' },
    { plan: 'pro_plus_monthly' as const, endsAt: '2026-10-10T00:00:00Z' },
    { addons: { ...base.addons, aiUntil: '2099-01-01T00:00:00Z' }, status: 'cancelled' },
  ])('disables purchase without an active paid plan: %j', (props) => {
    const html = render(props);
    expect(html).toContain('Cần gói trả phí đang hoạt động');
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('plan=ai_addon_monthly');
  });
  it('offers a fresh month when the add-on expired', () => {
    expect(render({ addons: { ...base.addons, aiUntil: '2026-10-10T00:00:00Z' } })).toContain('Thêm Add-on AI · 29.000đ/tháng');
  });
  it('hides printables when the flag is off, including owned printables', () => {
    expect(render({ addons: { ...base.addons, printables: true } })).not.toContain('Printable');
  });
  it('sells printables independently of the subscription when enabled', () => {
    const html = render({ plan: 'free', flags: { printablesSale: true } });
    expect(html).toContain('99.000đ');
    expect(html).toContain('href="/checkout?plan=printables"');
  });
  it('shows ownership instead of selling printables again', () => {
    const html = render({ flags: { printablesSale: true }, addons: { ...base.addons, printables: true } });
    expect(html).toContain('Đã sở hữu');
    expect(html).not.toContain('plan=printables');
  });
  it.each(['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as Language[])('localizes every state in %s', (language) => {
    for (const value of Object.values(getAddonsCopy(language))) expect(value.trim().length).toBeGreaterThan(0);
    expect(render({ language })).toContain(getAddonsCopy(language).aiName);
    if (language !== 'vi') expect(JSON.stringify(getAddonsCopy(language))).not.toMatch(/[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u);
  });
});

describe('AddonsCard entitlement reader', () => {
  it('reads the root addons field from the authoritative entitlement response', async () => {
    const body = { success: true, entitlement: { plan: 'monthly', status: 'active', subscription_ends_at: base.endsAt }, addons: { aiUntil: '2026-11-11T00:00:00Z', aiIncluded: false, printables: true } };
    const requester = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    expect(await readAddonsEntitlement(requester)).toEqual(body);
    expect(requester).toHaveBeenCalledWith('/api/entitlement');
  });
  it('rejects failed or malformed responses so a missing snapshot cannot enable purchases', async () => {
    for (const response of [new Response('{}', { status: 503 }), new Response(JSON.stringify({ success: true, entitlement: { plan: 'monthly', status: 'active' } }))]) {
      await expect(readAddonsEntitlement(vi.fn<typeof fetch>().mockResolvedValue(response))).rejects.toThrow();
    }
  });
});
