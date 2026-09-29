import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAppOrigin, getDeployTarget, getMarketingOrigin, getSiteOrigin } from '../../src/lib/site';

describe('site origins', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
    vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', undefined);
    vi.stubEnv('NEXT_PUBLIC_DEPLOY_TARGET', undefined);
  });

  it('keeps the app and marketing origins independent', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example');
    vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'https://www.example');
    vi.stubEnv('NEXT_PUBLIC_DEPLOY_TARGET', 'app');
    expect(getAppOrigin().origin).toBe('https://app.example');
    expect(getMarketingOrigin().origin).toBe('https://www.example');
    expect(getDeployTarget()).toBe('app');
    expect(getSiteOrigin().origin).toBe('https://app.example');
  });

  it('preserves the existing workers.dev origin without configuration', () => {
    expect(getAppOrigin().href).toBe('https://goodhabittracking.vanhoa2191.workers.dev/');
    expect(getMarketingOrigin().href).toBe('https://goodhabittracking.vanhoa2191.workers.dev/');
    expect(getDeployTarget()).toBe('combined');
  });

  it('supports local HTTP origins and trims configuration', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', ' http://localhost:3000/ ');
    vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', ' http://localhost:4173/ ');
    expect(getAppOrigin().href).toBe('http://localhost:3000/');
    expect(getMarketingOrigin().href).toBe('http://localhost:4173/');
  });

  it.each(['test', 'development', 'production'])('keeps runtime fallback deterministic in %s', (mode) => {
    vi.stubEnv('NODE_ENV', mode);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'not-a-url');
    vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'not-a-url');
    vi.stubEnv('NEXT_PUBLIC_DEPLOY_TARGET', 'unsupported');
    expect(getAppOrigin().origin).toBe('https://goodhabittracking.vanhoa2191.workers.dev');
    expect(getMarketingOrigin().origin).toBe('https://goodhabittracking.vanhoa2191.workers.dev');
    expect(getDeployTarget()).toBe('combined');
  });

  it.each([undefined, '', 'not-a-url', 'javascript:alert(1)'])('uses the app origin when marketing configuration is %s', (value) => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example');
    vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', value);
    expect(getMarketingOrigin().origin).toBe('https://app.example');
  });

  it.each(['combined', 'marketing', 'app'] as const)('supports the %s target', (target) => {
    vi.stubEnv('NEXT_PUBLIC_DEPLOY_TARGET', ` ${target} `);
    expect(getDeployTarget()).toBe(target);
  });
});
