import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieGet, rpc } = vi.hoisted(() => ({ cookieGet: vi.fn(), rpc: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: cookieGet })) }));
vi.mock('@/lib/pairing/crypto', () => ({
  CHILD_SESSION_COOKIE: 'kidhabit_child_session',
  sha256Hex: vi.fn(async () => 'hashed-child-session'),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));

import { GET, POST } from '@/app/api/child/wishlist/route';

const rewardId = '11111111-1111-4111-8111-111111111111';
const wishlist = {
  family_id: '22222222-2222-4222-8222-222222222222',
  child_id: '33333333-3333-4333-8333-333333333333',
  reward_id: rewardId,
  chosen_at: '2026-09-23T12:00:00.000Z',
};
function request(body: unknown) {
  return new NextRequest('http://localhost/api/child/wishlist', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('paired child wishlist API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
  });

  it('reads the goal through the child session', async () => {
    rpc.mockResolvedValue({ data: { status: 'ready', wishlist }, error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ wishlist });
    expect(rpc).toHaveBeenCalledWith('read_child_wishlist', { session_token_hash: 'hashed-child-session' });
  });

  it('saves only a reward ID through the child session', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', wishlist }, error: null });
    const response = await POST(request({ rewardId }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('choose_child_wishlist', {
      session_token_hash: 'hashed-child-session', target_reward_id: rewardId,
    });
  });

  it('rejects malformed choices, unavailable rewards, and revoked sessions', async () => {
    expect((await POST(request({ rewardId: 'bad' }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: { status: 'reward_unavailable' }, error: null });
    expect((await POST(request({ rewardId }))).status).toBe(409);
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    const revoked = await GET();
    expect(revoked.status).toBe(401);
    expect(revoked.headers.get('set-cookie')).toContain('kidhabit_child_session=;');
  });
});
