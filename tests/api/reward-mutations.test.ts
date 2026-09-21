import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, insert, update, remove, from } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from })),
}));

import { POST } from '@/app/api/domain/rewards/route';

const reward = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Đi công viên',
  description: 'Cả nhà cùng đi chơi',
  icon: '🌳',
  costPoints: 30,
  stock: 2,
  isActive: true,
  createdAt: '2026-09-20T00:00:00.000Z',
} as const;

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/domain/rewards', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/domain/rewards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({
      familyId: 'family-a',
      role: 'owner',
      user: { id: 'user-a' },
    });
    insert.mockResolvedValue({ error: null });
    const updateById = vi.fn(async () => ({ error: null }));
    const updateByFamily = vi.fn(() => ({ eq: updateById }));
    update.mockReturnValue({ eq: updateByFamily });
    const deleteById = vi.fn(async () => ({ error: null }));
    const deleteByFamily = vi.fn(() => ({ eq: deleteById }));
    remove.mockReturnValue({ eq: deleteByFamily });
    from.mockReturnValue({ insert, update, delete: remove });
  });

  it('requires an authenticated parent before mutating rewards', async () => {
    getParentContext.mockResolvedValue(null);

    const response = await POST(request({ type: 'create', reward }));

    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('rejects caller-controlled reward tenancy fields', async () => {
    const response = await POST(request({
      type: 'create',
      reward: { ...reward, familyId: 'family-b', userId: 'attacker' },
    }));

    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it('creates a reward under the authenticated family and user', async () => {
    const response = await POST(request({ type: 'create', reward }));

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith('rewards');
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      id: reward.id,
      family_id: 'family-a',
      user_id: 'user-a',
      cost_points: reward.costPoints,
    }));
  });

  it('scopes reward updates to the authenticated family', async () => {
    const response = await POST(request({
      type: 'update',
      rewardId: reward.id,
      updates: { title: 'Chuyến đi cuối tuần', stock: 3 },
    }));

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ title: 'Chuyến đi cuối tuần', stock: 3 });
    expect(update.mock.results[0]?.value.eq).toHaveBeenCalledWith('family_id', 'family-a');
    expect(update.mock.results[0]?.value.eq.mock.results[0]?.value.eq)
      .toHaveBeenCalledWith('id', reward.id);
  });

  it('scopes reward deletion to the authenticated family', async () => {
    const response = await POST(request({ type: 'delete', rewardId: reward.id }));

    expect(response.status).toBe(200);
    expect(remove.mock.results[0]?.value.eq).toHaveBeenCalledWith('family_id', 'family-a');
    expect(remove.mock.results[0]?.value.eq.mock.results[0]?.value.eq)
      .toHaveBeenCalledWith('id', reward.id);
  });
});
