import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const rpc = vi.fn();
const getUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc, auth: { getUser } })),
}));

import { POST } from '@/app/api/coupons/redeem/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/coupons/redeem', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/coupons/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  it('refuses short codes without asking the database', async () => {
    expect((await POST(request({ code: 'ABC' }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('requires a signed-in parent', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await POST(request({ code: 'WELCOME2026' }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns the extended subscription', async () => {
    rpc.mockResolvedValue({ data: [{ plan: 'yearly', subscription_ends_at: '2027-09-30T00:00:00.000Z' }], error: null });
    const response = await POST(request({ code: 'WELCOME2026' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      subscription: { plan: 'yearly', subscription_ends_at: '2027-09-30T00:00:00.000Z' },
    });
  });

  it('treats an empty answer as an unusable code, not as success', async () => {
    rpc.mockResolvedValue({ data: [{ plan: null, subscription_ends_at: null }], error: null });
    const response = await POST(request({ code: 'WELCOME2026' }));
    expect(response.status).toBe(400);
  });

  it('answers 429 once the account has used its attempts', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'coupon_rate_limited' } });
    expect((await POST(request({ code: 'WELCOME2026' }))).status).toBe(429);
  });
});
