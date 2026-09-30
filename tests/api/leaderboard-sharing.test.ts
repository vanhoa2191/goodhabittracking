import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, from, maybeSingle, rpc } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  from: vi.fn(),
  maybeSingle: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from, rpc })),
}));

import { GET, PUT } from '@/app/api/privacy/leaderboard-sharing/route';

function put(body: unknown) {
  return new NextRequest('http://localhost/api/privacy/leaderboard-sharing', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('sharing on the public leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId: 'family-a', user: { id: 'user-a' }, role: 'parent' });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    rpc.mockResolvedValue({ data: { status: 'saved', enabled: true }, error: null });
    from.mockReturnValue({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle });
  });

  it('is off until a parent turns it on', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ enabled: false });
    maybeSingle.mockResolvedValue({ data: { is_public_leaderboard: true }, error: null });
    await expect((await GET()).json()).resolves.toEqual({ enabled: true });
  });

  it('asks nothing of a visitor who is not a parent', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await PUT(put({ enabled: true }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('saves the choice for the family of the signed-in parent, and only that family', async () => {
    const response = await PUT(put({ enabled: true }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ enabled: true });
    expect(rpc).toHaveBeenCalledWith('set_family_public_leaderboard', { target_family_id: 'family-a', enabled: true });
  });

  it('refuses anything but a plain yes or no', async () => {
    for (const body of [{ enabled: 'yes' }, { enabled: true, familyId: 'family-b' }, {}, 'not json']) {
      expect((await PUT(put(body))).status, JSON.stringify(body)).toBe(400);
    }
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not claim a save the database did not confirm', async () => {
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    expect((await PUT(put({ enabled: true }))).status).toBe(401);
    rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect((await PUT(put({ enabled: true }))).status).toBe(503);
    rpc.mockResolvedValue({ data: { status: 'saved', enabled: false }, error: null });
    expect((await PUT(put({ enabled: true }))).status).toBe(503);
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'boom' } });
    expect((await GET()).status).toBe(503);
  });
});
