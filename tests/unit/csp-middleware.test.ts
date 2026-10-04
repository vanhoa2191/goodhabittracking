import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { config, middleware } from '@/middleware';

function policyFor(path = '/') {
  const response = middleware(new NextRequest(`https://app.kidhabithero.com${path}`));
  return {
    policy: response.headers.get('Content-Security-Policy') ?? '',
    requestNonce: response.headers.get('x-middleware-request-x-nonce'),
  };
}

function nonceOf(policy: string): string {
  return policy.match(/'nonce-([^']+)'/)?.[1] ?? '';
}

describe('content security policy middleware', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('allows scripts only by a per-request nonce, never by unsafe-inline', () => {
    const { policy } = policyFor();
    const scriptSources = policy.split('; ').find((directive) => directive.startsWith('script-src')) ?? '';
    expect(scriptSources).toContain("'self'");
    expect(scriptSources).toContain("'strict-dynamic'");
    expect(scriptSources).toMatch(/'nonce-[^']{16,}'/);
    expect(scriptSources).not.toContain('unsafe-inline');
    expect(scriptSources).not.toContain('unsafe-eval');
  });

  it('hands the same nonce to the page through a request header and uses a new one every time', () => {
    const first = policyFor();
    const second = policyFor();
    expect(first.requestNonce).toBe(nonceOf(first.policy));
    expect(nonceOf(first.policy)).not.toBe(nonceOf(second.policy));
  });

  it('keeps the other restrictions of the previous policy', () => {
    const { policy } = policyFor();
    for (const directive of [
      "default-src 'self'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'connect-src \'self\' https://*.supabase.co https://api-merchant.payos.vn',
      'upgrade-insecure-requests',
    ]) {
      expect(policy).toContain(directive);
    }
  });

  it('keeps upgrading insecure requests in production, and only the plain-http development server skips it', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(policyFor().policy).toContain('upgrade-insecure-requests');
    vi.stubEnv('NODE_ENV', 'development');
    const development = policyFor().policy;
    expect(development).not.toContain('upgrade-insecure-requests');
    for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "form-action 'self'"]) {
      expect(development).toContain(directive);
    }
  });

  it('skips static assets and API routes', () => {
    const source = String((config.matcher[0] as { source: string }).source);
    const matches = (path: string) => new RegExp(`^${source}$`).test(path);
    expect(matches('/start')).toBe(true);
    expect(matches('/')).toBe(true);
    expect(matches('/api/health')).toBe(false);
    expect(matches('/_next/static/chunks/a.js')).toBe(false);
    expect(matches('/sw.js')).toBe(false);
    expect(matches('/mascots/leo.webp')).toBe(false);
  });
});
