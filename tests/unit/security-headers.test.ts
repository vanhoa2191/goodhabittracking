import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';

describe('browser security headers', () => {
  it('allows same-origin camera without opening other sensors and denies framing', async () => {
    const groups = await nextConfig.headers?.();
    const headers = groups?.[0]?.headers ?? [];
    const values = new Map(headers.map((header) => [header.key, header.value]));

    expect(values.get('Permissions-Policy')).toBe('camera=(self), microphone=(), geolocation=()');
    expect(values.get('X-Frame-Options')).toBe('DENY');
    expect(values.get('Strict-Transport-Security')).toContain('max-age=63072000');
  });

  it('leaves the content policy to the per-request middleware so a stale static one cannot weaken it', async () => {
    const groups = await nextConfig.headers?.();
    const keys = (groups ?? []).flatMap((group) => group.headers.map((header) => header.key));
    expect(keys).not.toContain('Content-Security-Policy');
  });
});
