import { describe, expect, it } from 'vitest';
import { sessionHintCookie, sessionHintMaxAgeSeconds } from '../../apps/marketing/session-hint.mjs';
import { buildSessionHintCookie, parseSessionHintDomain, syncSessionHint } from '@/lib/session-hint';

describe('session hint domain', () => {
  it('accepts a plain registrable domain, tolerating case, spaces and a leading dot', () => {
    expect(parseSessionHintDomain('kidhabithero.com')).toBe('kidhabithero.com');
    expect(parseSessionHintDomain('  .KidHabitHero.com ')).toBe('kidhabithero.com');
  });

  it.each([undefined, '', 'localhost', 'com', 'https://kidhabithero.com', 'kidhabithero.com/path', '*.kidhabithero.com', 'a b.com', 'workers.dev', 'pages.dev', 'github.io'])(
    'rejects %s so a cookie can never be shared with strangers',
    (value) => {
      expect(parseSessionHintDomain(value)).toBeNull();
    },
  );
});

describe('session hint cookie', () => {
  it('sets a short-lived, identity-free flag scoped to the shared domain', () => {
    const cookie = buildSessionHintCookie(true, 'kidhabithero.com');
    expect(cookie).toBe(`${sessionHintCookie}=1; Domain=kidhabithero.com; Path=/; SameSite=Lax; Secure; Max-Age=${sessionHintMaxAgeSeconds}`);
    expect(cookie).not.toMatch(/HttpOnly/i);
    expect(sessionHintMaxAgeSeconds).toBe(604800);
  });

  it('expires the flag on sign-out', () => {
    expect(buildSessionHintCookie(false, 'kidhabithero.com')).toBe(`${sessionHintCookie}=; Domain=kidhabithero.com; Path=/; SameSite=Lax; Secure; Max-Age=0`);
  });
});

describe('syncSessionHint', () => {
  const secureApp = { domain: 'kidhabithero.com', hostname: 'app.kidhabithero.com', secure: true } as const;

  it('writes the cookie on the app host and clears it when signed out', () => {
    const target = { cookie: '' };
    expect(syncSessionHint(true, { ...secureApp, target })).toBe(true);
    expect(target.cookie).toContain(`${sessionHintCookie}=1`);
    expect(syncSessionHint(false, { ...secureApp, target })).toBe(true);
    expect(target.cookie).toContain('Max-Age=0');
  });

  it('does nothing without a configured domain, over http, or on a foreign host', () => {
    for (const options of [
      { ...secureApp, domain: null },
      { ...secureApp, secure: false },
      { ...secureApp, hostname: 'goodhabittracking.vanhoa2191.workers.dev' },
      { ...secureApp, hostname: 'evilkidhabithero.com' },
    ]) {
      const target = { cookie: '' };
      expect(syncSessionHint(true, { ...options, target })).toBe(false);
      expect(target.cookie).toBe('');
    }
    expect(syncSessionHint(true, { ...secureApp, target: null })).toBe(false);
  });
});
