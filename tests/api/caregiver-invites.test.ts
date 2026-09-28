import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUser, rpc } = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getUser }, rpc })),
}));

import { DELETE, GET, POST } from '@/app/api/caregiver/invites/route';
import { POST as ACCEPT } from '@/app/api/caregiver/invites/accept/route';

const inviteId = '11111111-1111-4111-8111-111111111111';
const token = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaabbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function request(path: string, method: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('caregiver invitation routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: 'owner-1' } }, error: null });
  });

  it('requires authentication before listing or changing invitations', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await GET()).status).toBe(401);
    expect((await POST()).status).toBe(401);
    expect((await ACCEPT(request('/api/caregiver/invites/accept', 'POST', { token }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('creates a bounded invitation and returns the raw token only once', async () => {
    rpc.mockResolvedValue({
      data: [{ invite_id: inviteId, token, expires_at: '2026-10-01T00:00:00.000Z' }],
      error: null,
    });
    const response = await POST();
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith('create_caregiver_invite', { ttl_hours: 72 });
    await expect(response.json()).resolves.toEqual({
      invite: { id: inviteId, token, expiresAt: '2026-10-01T00:00:00.000Z' },
    });
  });

  it('revokes only the invitation selected by the authenticated owner', async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const response = await DELETE(request('/api/caregiver/invites', 'DELETE', { inviteId }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('revoke_caregiver_invite', { target_invite_id: inviteId });
  });

  it('does not disclose why an invitation cannot be accepted', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'invite_unavailable' } });
    const response = await ACCEPT(request('/api/caregiver/invites/accept', 'POST', { token }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Lời mời không hợp lệ hoặc đã hết hạn.' });
  });
});
