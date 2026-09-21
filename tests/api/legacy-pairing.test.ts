import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => null,
}));

import { POST } from '@/app/api/family/code/route';

describe('POST /api/family/code', () => {
  it('Given no explicit server opt-in When legacy pairing is called Then the endpoint is unavailable', async () => {
    const request = new NextRequest('http://localhost/api/family/code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'get_or_create',
        familyId: 'family-a',
        profiles: [{ id: 'child-a', name: 'Child A' }],
      }),
    });

    const response = await POST(request);
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      error: 'Legacy pairing is disabled',
    });
  });
});
