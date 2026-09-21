import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

describe('security response headers', () => {
  it('emits a long-lived HSTS policy for the production HTTPS origin', async () => {
    // Given the application header configuration
    const configuredHeaders = await nextConfig.headers?.();

    // When the global response headers are resolved
    const headers = configuredHeaders?.flatMap((entry) => entry.headers) ?? [];

    // Then transport downgrade protection is part of every response
    expect(headers).toContainEqual({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  });

});
