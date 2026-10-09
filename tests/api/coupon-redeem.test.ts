import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const rpc = vi.fn();
const getUser = vi.fn();
const getParentContext = vi.fn();
let allowed = true;
vi.mock('@/lib/auth/parent-context', () => ({ getParentContext: (...args: unknown[]) => getParentContext(...args) }));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc: (name: string, args: unknown) => name === 'can_manage_family' ? Promise.resolve({ data: allowed, error: null }) : rpc(name, args), auth: { getUser } })),
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
    allowed = true;
    getParentContext.mockResolvedValue({ familyId: 'family-1', role: 'owner', user: { id: 'user-1' } });
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

  it('denies a caregiver before consuming a coupon', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await POST(request({ code: 'WELCOME2026' }))).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('checks can_manage_family even when a parent context was loaded', async () => {
    allowed = false;
    expect((await POST(request({ code: 'WELCOME2026' }))).status).toBe(403);
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
