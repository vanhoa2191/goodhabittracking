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

  it('puts the parent sign-in and the demo in view and keeps the child block closed', () => {
    const html = renderToStaticMarkup(createElement(AppEntryGate, { ...base, isLoading: false }));
    expect(html).toContain('Continue as a parent');
    expect(html).toContain('Sign in with Google');
    expect(html).toContain('Explore the demo');
    expect(html).toContain('Is this a child’s device?');
    expect(html).toMatch(/<details data-testid="gate-child-block"(?![^>]*\sopen)/);
  });

  it('opens the child block when the pairing dialog is already on screen', () => {
    const html = renderToStaticMarkup(createElement(AppEntryGate, { ...base, isLoading: false, isPairingOpen: true }));
    expect(html).toMatch(/<details data-testid="gate-child-block"[^>]*\sopen=""/);
  });

  it('offers other ways to sign in only while the email-code option exists', () => {
    const off = renderToStaticMarkup(createElement(AppEntryGate, { ...base, isLoading: false, emailCodeEnabled: false }));
    expect(off).not.toContain('gate-other-ways');
    expect(off).not.toContain('Other ways to sign in');
    const on = renderToStaticMarkup(createElement(AppEntryGate, { ...base, isLoading: false, emailCodeEnabled: true }));
    expect(on).toMatch(/<details data-testid="gate-other-ways"(?![^>]*\sopen)/);
    expect(on).toContain('Other ways to sign in');
  });
});
