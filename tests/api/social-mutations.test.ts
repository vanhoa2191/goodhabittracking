import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, rpc, from, insert, update } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from, rpc })),
}));

import { POST } from '@/app/api/domain/social/route';

const childId = '11111111-1111-4111-8111-111111111111';
const groupId = '22222222-2222-4222-8222-222222222222';

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/domain/social', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/domain/social', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({
      familyId: 'family-a',
      role: 'owner',
      user: { id: 'user-a' },
    });
    rpc.mockResolvedValue({ data: { entityId: groupId }, error: null });
    insert.mockResolvedValue({ error: null });
    const updateById = vi.fn(async () => ({ error: null }));
    const updateByFamily = vi.fn(() => ({ eq: updateById }));
    update.mockReturnValue({ eq: updateByFamily });
    from.mockReturnValue({ insert, update });
  });

  it('requires an authenticated parent before mutating social data', async () => {
    getParentContext.mockResolvedValue(null);

    const response = await POST(request({
      type: 'joinGroup', inviteCode: 'ABC23456', childId,
    }));

    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('rejects caller-controlled family ownership', async () => {
    const response = await POST(request({
      type: 'joinGroup', inviteCode: 'ABC23456', childId, familyId: 'family-b',
    }));

    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('creates a group through the atomic family-scoped command', async () => {
    const response = await POST(request({
      type: 'createGroup',
      group: {
        name: 'Biệt đội Tử tế',
        icon: '🚀',
        createdByChildId: childId,
        weeklyTargetPoints: 300,
        rewardType: 'badge',
      },
    }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('mutate_social_command', {
      mutation_input: expect.objectContaining({
        type: 'createGroup',
        group: expect.objectContaining({ createdByChildId: childId }),
      }),
    });
  });

  it('joins a group through the family-scoped invite command', async () => {
    const response = await POST(request({
      type: 'joinGroup', inviteCode: 'abc23456', childId,
    }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('mutate_social_command', {
      mutation_input: {
        type: 'joinGroup',
        inviteCode: 'abc23456',
        childId,
      },
    });
  });

  it('stores a kudo under the authenticated family', async () => {
    const response = await POST(request({
      type: 'sendKudo',
      fromChildId: childId,
      toChildId: '33333333-3333-4333-8333-333333333333',
      emoji: '👏',
    }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('mutate_social_command', {
      mutation_input: expect.objectContaining({
        type: 'sendKudo',
        fromChildId: childId,
        toChildId: '33333333-3333-4333-8333-333333333333',
      }),
    });
    expect(from).not.toHaveBeenCalled();
  });
});
