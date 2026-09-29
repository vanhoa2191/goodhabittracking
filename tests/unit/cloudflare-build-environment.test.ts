import { describe, expect, it } from 'vitest';

import { prepareCloudflareBuildEnvironment } from '../../scripts/cloudflare-build-environment.mjs';

describe('prepareCloudflareBuildEnvironment', () => {
  const origins = {
    NEXT_PUBLIC_APP_URL: 'https://app.example',
    NEXT_PUBLIC_MARKETING_URL: 'https://www.example',
  };
  const backend = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
  };

  it.each(['combined', 'app', 'marketing'])('accepts valid production configuration for %s', (target) => {
    expect(prepareCloudflareBuildEnvironment({
      ...origins, ...backend, NEXT_PUBLIC_DEPLOY_TARGET: target,
    }, 'deploy')).toMatchObject(origins);
  });

  it('builds marketing without Supabase and strips backend configuration without mutating its input', () => {
    expect(() => prepareCloudflareBuildEnvironment({
      ...origins, NEXT_PUBLIC_DEPLOY_TARGET: 'marketing',
    }, 'deploy')).not.toThrow();
    const input = {
      ...origins, ...backend, NEXT_PUBLIC_DEPLOY_TARGET: 'marketing',
      SUPABASE_SERVICE_ROLE_KEY: 'test-only-secret', PAYOS_API_KEY: 'test-only-secret',
    };
    const result = prepareCloudflareBuildEnvironment(input, 'deploy');
    expect(result).toEqual({ ...origins, NEXT_PUBLIC_DEPLOY_TARGET: 'marketing' });
    expect(input).toHaveProperty('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    expect(input).toHaveProperty('PAYOS_API_KEY');
  });

  it.each(['app', 'combined'])('still requires Supabase for %s', (target) => {
    expect(() => prepareCloudflareBuildEnvironment({
      ...origins, NEXT_PUBLIC_DEPLOY_TARGET: target,
    }, 'deploy')).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it.each(['app', 'marketing'])('requires an explicit marketing origin for split target %s', (target) => {
    expect(() => prepareCloudflareBuildEnvironment({
      ...backend, NEXT_PUBLIC_APP_URL: origins.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_DEPLOY_TARGET: target,
    }, 'deploy')).toThrow(/NEXT_PUBLIC_MARKETING_URL/);
    expect(() => prepareCloudflareBuildEnvironment({
      ...backend, NEXT_PUBLIC_MARKETING_URL: origins.NEXT_PUBLIC_MARKETING_URL,
      NEXT_PUBLIC_DEPLOY_TARGET: target,
    }, 'deploy')).toThrow(/NEXT_PUBLIC_APP_URL/);
  });

  for (const name of ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_MARKETING_URL']) {
    it.each(['not-a-url', 'http://app.example', 'javascript:alert(1)', 'https://app.example/path', 'https://app.example/?query=1', 'https://app.example/#fragment', 'https://user:pass@app.example'])('rejects invalid production origin ' + name + '=%s', (value) => {
      expect(() => prepareCloudflareBuildEnvironment({
        ...origins, ...backend, [name]: value,
      }, 'deploy')).toThrow(new RegExp(name));
    });
  }

  it.each(['unsupported', 'APP', 'static'])('rejects unsupported production target %s', (target) => {
    expect(() => prepareCloudflareBuildEnvironment({
      ...origins, ...backend, NEXT_PUBLIC_DEPLOY_TARGET: target,
    }, 'deploy')).toThrow(/NEXT_PUBLIC_DEPLOY_TARGET/);
  });

  it('validates production builds before deployment', () => {
    expect(() => prepareCloudflareBuildEnvironment({
      ...origins, ...backend, NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'bad-url',
    }, 'build')).toThrow(/NEXT_PUBLIC_APP_URL/);
  });

  it.each(['build', 'preview'])('permits unconfigured local %s', (mode) => {
    expect(prepareCloudflareBuildEnvironment({}, mode)).toEqual({});
  });

  it('blocks production deploys when browser configuration is missing', () => {
    expect(() => prepareCloudflareBuildEnvironment({}, 'deploy')).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it('keeps browser configuration and removes server-only secrets from the build', () => {
    const environment = prepareCloudflareBuildEnvironment(
      {
        NEXT_PUBLIC_APP_URL: 'https://example.com',
        NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-key',
        SUPABASE_SERVICE_ROLE_KEY: 'server-secret',
      },
      'deploy',
    );

    expect(environment.NEXT_PUBLIC_SUPABASE_URL).toBe('https://project.supabase.co');
    expect(environment.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('public-anon-key');
    expect(environment.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });
});
