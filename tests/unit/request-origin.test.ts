import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isSameOriginRequest, rejectCrossSiteRequest } from '@/lib/security/request-origin';

function post(headers: Record<string, string>, method = 'POST') {
  return new Request('https://app.kidhabithero.com/api/domain/commands', { method, headers, body: method === 'GET' ? undefined : '{}' });
}

describe('same-origin guard for cookie-authenticated writes', () => {
  it('accepts the app\'s own pages', () => {
    expect(isSameOriginRequest(post({ origin: 'https://app.kidhabithero.com', 'sec-fetch-site': 'same-origin' }))).toBe(true);
  });

  it('accepts server-to-server callers that send neither header', () => {
    expect(isSameOriginRequest(post({}))).toBe(true);
  });

  it.each([
    ['another site', { origin: 'https://evil.example' }],
    ['a sibling subdomain', { origin: 'https://kidhabithero.com', 'sec-fetch-site': 'same-site' }],
    ['an opaque origin such as a sandboxed form', { origin: 'null' }],
    ['a cross-site fetch without Origin', { 'sec-fetch-site': 'cross-site' }],
  ])('refuses %s', (_label, headers) => {
    expect(isSameOriginRequest(post(headers))).toBe(false);
    expect(rejectCrossSiteRequest(post(headers))?.status).toBe(403);
  });

  it('never blocks reads', () => {
    expect(isSameOriginRequest(post({ origin: 'https://evil.example' }, 'GET'))).toBe(true);
  });

  it('trusts the forwarded host of the deployment', () => {
    const request = new Request('http://127.0.0.1:8787/api/x', {
      method: 'POST',
      headers: { origin: 'https://app.kidhabithero.com', 'x-forwarded-host': 'app.kidhabithero.com', 'x-forwarded-proto': 'https' },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });
});

function routeFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return routeFiles(path);
    return entry === 'route.ts' ? [path] : [];
  });
}

describe('every state-changing API route applies the guard', () => {
  const retiredRoutes = ['src/app/api/family/code/route.ts'];

  it.each(routeFiles('src/app/api').filter((file) => {
    const source = readFileSync(file, 'utf8');
    return /export (?:async )?function (?:POST|PUT|PATCH|DELETE)/.test(source) && !retiredRoutes.includes(file);
  }))('%s', (file) => {
    const source = readFileSync(file, 'utf8');
    const handlers = source.match(/export (?:async )?function (?:POST|PUT|PATCH|DELETE)/g) ?? [];
    const guards = source.match(/rejectCrossSiteRequest\(request\)/g) ?? [];
    expect(guards.length).toBeGreaterThanOrEqual(handlers.length);
  });
});
