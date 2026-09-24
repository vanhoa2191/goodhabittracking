import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, from, rpc } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from, rpc })),
}));

import { GET, POST } from '@/app/api/domain/experience/route';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/domain/experience', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/domain/experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId, user: { id: 'parent' } });
    rpc.mockResolvedValue({ data: { status: 'saved', changed: true }, error: null });
    from.mockImplementation((table: string) => ({
      select: () => ({
        eq: () => table === 'family_engagement_settings'
          ? { maybeSingle: async () => ({ data: null, error: null }) }
          : Promise.resolve({ data: [], error: null }),
      }),
    }));
  });

  it('requires a parent before reading or writing', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(request({ type: 'pauseFamily' }))).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('hydrates a family with no engagement rows', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      children: [], settings: null, letters: [], quests: [], wishlists: [],
    });
  });

  it('rejects malformed commands without a database mutation', async () => {
    expect((await POST(request({ type: 'chooseWishlist', childId }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects the obsolete timestamp-only mascot command', async () => {
    const response = await POST(request({
      type: 'selectMascot', childId, familyId: '33333333-3333-4333-8333-333333333333',
    }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([true, false])('reports whether the parent choice changed: %s', async (changed) => {
    rpc.mockResolvedValue({ data: { status: 'saved', changed }, error: null });
    const response = await POST(request({ type: 'chooseWishlist', childId, rewardId: childId }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, changed });
    expect(rpc).toHaveBeenCalledWith('choose_parent_wishlist', {
      target_family_id: familyId,
      target_child_id: childId,
      target_reward_id: childId,
    });
  });

  it('reports a database rejection instead of claiming a cross-family write succeeded', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23503' } });
    const response = await POST(request({ type: 'chooseWishlist', childId, rewardId: childId }));
    expect(response.status).toBe(503);
  });

  it('does not save an inactive or foreign reward', async () => {
    rpc.mockResolvedValue({ data: { status: 'reward_unavailable' }, error: null });
    const response = await POST(request({ type: 'chooseWishlist', childId, rewardId: childId }));
    expect(response.status).toBe(409);
    expect(rpc).toHaveBeenCalledOnce();
  });
});
