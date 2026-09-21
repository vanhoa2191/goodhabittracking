import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, rpc } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));

import { POST } from '@/app/api/domain/profiles/route';

const profile = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Bé An',
  avatar: '🦁',
  themeColor: '#3b82f6',
  points: 0,
  totalEarned: 0,
  level: 1,
  streak: 0,
  createdAt: '2026-09-20T00:00:00.000Z',
} as const;

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/domain/profiles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/domain/profiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId: 'family-a', user: { id: 'user-a' } });
    rpc.mockResolvedValue({ data: { profileId: profile.id }, error: null });
  });

  it('requires an authenticated parent', async () => {
    getParentContext.mockResolvedValue(null);
    const response = await POST(request({ type: 'delete', profileId: profile.id }));
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects caller-controlled tenancy fields', async () => {
    const response = await POST(request({
      type: 'create', profile: { ...profile, familyId: 'family-b' }, starterActivities: [],
    }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('passes profile and starter habits to one atomic command', async () => {
    const response = await POST(request({ type: 'create', profile, starterActivities: [] }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('mutate_child_profile_command', {
      mutation_input: { type: 'create', profile, starterActivities: [] },
    });
  });

  it('uses the same family-scoped command for update and delete', async () => {
    await POST(request({ type: 'update', profileId: profile.id, updates: { name: 'Bé Minh' } }));
    await POST(request({ type: 'delete', profileId: profile.id }));
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('rejects progress manipulation through profile updates', async () => {
    const response = await POST(request({
      type: 'update', profileId: profile.id, updates: { points: 999999 },
    }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects malformed command results instead of reporting false success', async () => {
    rpc.mockResolvedValue({ data: { profileId: 'not-a-uuid' }, error: null });
    const response = await POST(request({ type: 'delete', profileId: profile.id }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });
});
