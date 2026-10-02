import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/EmailCodeSignIn', () => ({ EmailCodeSignIn: () => null }));
vi.mock('@/components/BrandMark', () => ({ BrandMark: () => null }));
vi.mock('next/link', () => ({ default: ({ children }: { children: unknown }) => createElement('a', null, children as never) }));

import { AppEntryGate } from '@/components/AppEntryGate';

const base = {
  language: 'en' as const,
  marketingHomeUrl: 'https://example.test',
  onLoginGoogle: () => undefined,
  onOpenPairing: () => undefined,
  onStartDemo: () => undefined,
};

describe('app entry gate', () => {
  it('shows a placeholder, not a switched-off login button, while the session is checked', () => {
    const html = renderToStaticMarkup(createElement(AppEntryGate, { ...base, isLoading: true }));
    expect(html).toContain('role="status"');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('disabled');
  });

  it('offers the three entries as live buttons once the check is done', () => {
    const html = renderToStaticMarkup(createElement(AppEntryGate, { ...base, isLoading: false }));
    expect(html.match(/<button/g)).toHaveLength(3);
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('data-testid="landing-primary-action"');
  });
});
