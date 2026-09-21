import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => null,
}));

import { POST } from '@/app/api/family/code/route';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('retired legacy pairing flow', () => {
  it('cannot be restored by the historical feature flag', async () => {
    vi.stubEnv('ENABLE_LEGACY_PAIRING', 'true');

    const request = new NextRequest('http://localhost/api/family/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'verify', code: 'HERO-NONE' }),
    });

    const response = await POST(request);
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ success: false, error: 'Legacy pairing is disabled' });
  });
});
