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

import { POST } from '@/app/api/domain/activities/route';

const activity = {
  id: '11111111-1111-4111-8111-111111111111',
  childId: null,
  title: 'Đọc sách',
  description: 'Đọc 15 phút',
  instructions: 'Chọn một cuốn sách và đọc chậm 15 phút.',
  icon: '📚',
  category: 'study',
  points: 20,
  recurrenceType: 'daily',
  recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
  timeOfDay: 'evening',
  durationMinutes: 15,
  requiresApproval: false,
  isActive: true,
  targetAgeStage: 'all',
  isParentRole: false,
  frameworkHabitId: 'GD3-HT-01',
  frameworkContentVersion: '1.0.0',
  createdAt: '2026-09-20T00:00:00.000Z',
} as const;

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/domain/activities', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/domain/activities', () => {
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

  it('requires an authenticated parent before mutating activities', async () => {
    // Given
    getParentContext.mockResolvedValue(null);

    // When
    const response = await POST(request({ type: 'create', activity }));

    // Then
    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('rejects caller-controlled tenancy fields', async () => {
    // Given / When
    const response = await POST(request({
      type: 'create',
      activity: { ...activity, familyId: 'family-b', userId: 'attacker' },
    }));

    // Then
    expect(response.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });

  it('creates an activity under the authenticated family and user', async () => {
    // Given / When
    const response = await POST(request({ type: 'create', activity }));

    // Then
    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith('habit_activities');
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      id: activity.id,
      family_id: 'family-a',
      user_id: 'user-a',
      title: activity.title,
      instructions: activity.instructions,
      framework_habit_id: activity.frameworkHabitId,
      framework_content_version: activity.frameworkContentVersion,
    }));
  });

  it('persists a legacy catalog identity without relying on the activity title', async () => {
    // Given
    const legacyActivity = {
      ...activity,
      title: 'A custom family title',
      frameworkHabitId: undefined,
      frameworkContentVersion: undefined,
      legacyTemplateId: 'WIT-NUT-01',
    };

    // When
    const response = await POST(request({ type: 'create', activity: legacyActivity }));

    // Then
    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      title: 'A custom family title',
      legacy_template_id: 'WIT-NUT-01',
    }));
  });

  it('creates an activity bundle in one family-scoped insert', async () => {
    // Given
    const secondActivity = {
      ...activity,
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Uống nước',
    };

    // When
    const response = await POST(request({
      type: 'createMany',
      activities: [activity, secondActivity],
    }));

    // Then
    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith([
      expect.objectContaining({ id: activity.id, family_id: 'family-a', user_id: 'user-a' }),
      expect.objectContaining({ id: secondActivity.id, family_id: 'family-a', user_id: 'user-a' }),
    ]);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      activityIds: [activity.id, secondActivity.id],
    });
  });

  it('scopes update mutations to the authenticated family', async () => {
    // Given / When
    const updateResponse = await POST(request({
      type: 'update',
      activityId: activity.id,
      updates: {
        title: 'Đọc sách cùng ba mẹ',
        instructions: 'Cùng chọn sách, đặt hẹn giờ rồi đọc.',
        points: 25,
      },
    }));

    // Then
    expect(updateResponse.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      title: 'Đọc sách cùng ba mẹ',
      instructions: 'Cùng chọn sách, đặt hẹn giờ rồi đọc.',
      points: 25,
    });
    expect(update.mock.results[0]?.value.eq).toHaveBeenCalledWith('family_id', 'family-a');
    expect(update.mock.results[0]?.value.eq.mock.results[0]?.value.eq)
      .toHaveBeenCalledWith('id', activity.id);
  });

  it('stores blank updated instructions as null so parents can clear guidance', async () => {
    // Given / When
    const response = await POST(request({
      type: 'update',
      activityId: activity.id,
      updates: { instructions: '   ' },
    }));

    // Then
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ instructions: null });
  });

  it('scopes delete mutations to the authenticated family', async () => {
    // Given / When
    const response = await POST(request({ type: 'delete', activityId: activity.id }));

    // Then
    expect(response.status).toBe(200);
    expect(remove.mock.results[0]?.value.eq).toHaveBeenCalledWith('family_id', 'family-a');
    expect(remove.mock.results[0]?.value.eq.mock.results[0]?.value.eq)
      .toHaveBeenCalledWith('id', activity.id);
  });
});
