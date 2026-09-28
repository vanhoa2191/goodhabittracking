import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';

describe('browser security headers', () => {
  it('allows same-origin camera and the QR scanner worker without opening other sensors', async () => {
    const groups = await nextConfig.headers?.();
    const headers = groups?.[0]?.headers ?? [];
    const values = new Map(headers.map((header) => [header.key, header.value]));

    expect(values.get('Permissions-Policy')).toBe('camera=(self), microphone=(), geolocation=()');
    expect(values.get('Content-Security-Policy')).toContain("worker-src 'self' blob:");
    expect(values.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
  });
});
