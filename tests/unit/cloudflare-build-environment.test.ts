import { describe, expect, it } from 'vitest';

import { prepareCloudflareBuildEnvironment } from '../../scripts/cloudflare-build-environment.mjs';

describe('prepareCloudflareBuildEnvironment', () => {
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
