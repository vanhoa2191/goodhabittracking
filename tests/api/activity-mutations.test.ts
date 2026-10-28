import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, insert, update, remove, from, unlock, select, readByFamily, readByIds } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  from: vi.fn(),
  unlock: vi.fn(),
  select: vi.fn(),
  readByFamily: vi.fn(),
  readByIds: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from })),
}));

vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: vi.fn(() => ({ from })) }));
vi.mock('@/lib/security/parent-unlock', () => ({ requireParentUnlock: unlock }));

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

// Independently generated with Python uuid.uuid5 using the contract namespace.
const dailyActivity = { ...activity, id: 'afa759f3-8a0b-50bf-9e72-0b347346b72f', legacyTemplateId: 'WIT-DLY-01' };
const secondDailyActivity = { ...activity, id: 'a913bfeb-fdc4-59a4-9079-f4368e7884f3', legacyTemplateId: 'WIT-DLY-02' };
const childDailyActivity = {
  ...dailyActivity, id: 'd59a4710-e014-5bc5-9d2c-f595ec076f88',
  childId: '22222222-2222-4222-8222-222222222222',
};

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
    unlock.mockResolvedValue(null);
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
    readByIds.mockResolvedValue({ data: [], error: null });
    readByFamily.mockReturnValue({ in: readByIds });
    select.mockReturnValue({ eq: readByFamily });
    from.mockReturnValue({ insert, update, delete: remove, select });
  });

  it.each([
    { type: 'update', activityId: activity.id, updates: { points: 10000, requiresApproval: false } },
    { type: 'create', activity },
    { type: 'createMany', activities: [activity] },
  ])('blocks the locked-parent award-policy bypass: %o', async (body) => {
    unlock.mockResolvedValue(new Response(JSON.stringify({ code: 'parent_pin_required' }), { status: 403 }));
    expect((await POST(request(body))).status).toBe(403);
    expect(from).not.toHaveBeenCalled();
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

  it.each(['NUT', 'GIV', 'VIR', 'MIN', 'PER', 'WIS', 'CAP', 'PHY'])('accepts the existing WIT-%s namespace', async (namespace) => {
    const response = await POST(request({
      type: 'create', activity: { ...activity, legacyTemplateId: `WIT-${namespace}-01` },
    }));
    expect(response.status).toBe(200);
  });

  it('accepts DLY after opening the daily living namespace', async () => {
    const response = await POST(request({
      type: 'create', activity: { ...activity, legacyTemplateId: 'WIT-DLY-01' },
    }));
    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ legacy_template_id: 'WIT-DLY-01' }));
  });

  it.each(['create', 'createMany'])('keeps duplicate-key failures as conflicts for %s', async (type) => {
    insert.mockResolvedValue({ error: { code: '23505' } });
    const response = await POST(request(type === 'create'
      ? { type, activity }
      : { type, activities: [activity] }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ success: false });
    expect(select).not.toHaveBeenCalled();
  });

  it.each(['create', 'createMany'])('rejects malformed activity IDs with 400 for %s', async (type) => {
    const invalid = { ...dailyActivity, id: 'not-a-uuid' };
    const response = await POST(request(type === 'create'
      ? { type, activity: invalid } : { type, activities: [invalid] }));
    expect(response.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it.each(['WIT-DLY-1', 'WIT-DLY-001', 'WIT-DLY-AB', 'WIT-OTHER-01'])('rejects malformed template identity %s', async (legacyTemplateId) => {
    expect((await POST(request({ type: 'create', activity: { ...activity, legacyTemplateId } }))).status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it.each([
    ['create', [dailyActivity]],
    ['create', [childDailyActivity]],
    ['createMany', [dailyActivity, secondDailyActivity, childDailyActivity]],
  ] as const)('confirms a repeated deterministic DLY %s without creating more rows: %o', async (type, activities) => {
    const rows = new Map<string, Record<string, unknown>>();
    insert.mockImplementation(async (input: Record<string, unknown> | Record<string, unknown>[]) => {
      const pending = Array.isArray(input) ? input : [input];
      if (pending.some((row) => rows.has(String(row.id)))) return { error: { code: '23505' } };
      for (const row of pending) rows.set(String(row.id), row);
      return { error: null };
    });
    readByIds.mockImplementation(async (_column: string, ids: string[]) => ({
      data: ids.filter((id) => rows.get(id)?.family_id === 'family-a').map((id) => ({ id })), error: null,
    }));
    const body = type === 'create' ? { type, activity: activities[0] } : { type, activities };
    expect((await POST(request(body))).status).toBe(200);
    const retryActivities = activities.map((item) => ({ ...item, title: 'A stale retry title', points: 99 }));
    const repeated = await POST(request(type === 'create'
      ? { type, activity: retryActivities[0] } : { type, activities: retryActivities }));
    expect(repeated.status).toBe(200);
    await expect(repeated.json()).resolves.toMatchObject(type === 'create'
      ? { success: true, activityId: activities[0].id }
      : { success: true, activityIds: activities.map(({ id }) => id) });
    expect(rows.size).toBe(activities.length);
    for (const item of activities) {
      expect(rows.get(item.id)).toMatchObject({ title: item.title, points: item.points });
    }
    expect(insert).toHaveBeenCalledTimes(2);
    expect(readByFamily).toHaveBeenCalledWith('family_id', 'family-a');
    expect(readByIds).toHaveBeenCalledWith('id', activities.map(({ id }) => id));
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    { ...dailyActivity, id: activity.id },
    { ...dailyActivity, legacyTemplateId: 'WIT-DLY-02' },
    { ...dailyActivity, childId: childDailyActivity.childId },
    { ...dailyActivity, legacyTemplateId: 'WIT-NUT-01' },
  ])('keeps deliberately colliding IDs as 409 when the identity does not match: %o', async (invalid) => {
    insert.mockResolvedValue({ error: { code: '23505' } });
    expect((await POST(request({ type: 'create', activity: invalid }))).status).toBe(409);
    expect(select).not.toHaveBeenCalled();
  });

  it('rejects a deterministic ID belonging to another family', async () => {
    getParentContext.mockResolvedValue({ familyId: 'family-b', role: 'owner', user: { id: 'user-b' } });
    insert.mockResolvedValue({ error: { code: '23505' } });
    expect((await POST(request({ type: 'create', activity: dailyActivity }))).status).toBe(409);
    expect(select).not.toHaveBeenCalled();
  });

  it('does not confirm a mixed DLY and legacy bundle after a collision', async () => {
    insert.mockResolvedValue({ error: { code: '23505' } });
    expect((await POST(request({ type: 'createMany', activities: [dailyActivity, activity] }))).status).toBe(409);
    expect(select).not.toHaveBeenCalled();
  });

  it.each([
    { data: [], error: null },
    { data: [{ id: dailyActivity.id }], error: null },
    { data: [{ id: dailyActivity.id }, { id: dailyActivity.id }], error: null },
    { data: null, error: { code: '42501' } },
  ])('does not confirm a bundle when scoped readback cannot prove every row: %o', async (readback) => {
    insert.mockResolvedValue({ error: { code: '23505' } });
    readByIds.mockResolvedValue(readback);
    expect((await POST(request({ type: 'createMany', activities: [dailyActivity, secondDailyActivity] }))).status).toBe(409);
    expect(readByFamily).toHaveBeenCalledWith('family_id', 'family-a');
  });

  it('does not confirm a collision whose row is outside the authenticated family', async () => {
    insert.mockResolvedValue({ error: { code: '23505' } });
    readByIds.mockResolvedValue({ data: [], error: null });
    expect((await POST(request({ type: 'create', activity: dailyActivity }))).status).toBe(409);
    expect(readByFamily).toHaveBeenCalledWith('family_id', 'family-a');
  });

  it.each(['23503', '23514', '42501'])('keeps DLY non-duplicate insert error %s as 409', async (code) => {
    insert.mockResolvedValue({ error: { code } });
    expect((await POST(request({ type: 'create', activity: dailyActivity }))).status).toBe(409);
    expect(select).not.toHaveBeenCalled();
  });

  it('persists the journey habit identity within the authenticated family', async () => {
    // Given
    const journeyActivity = { ...activity, journeyHabitKey: 'week-1:0' };

    // When
    const response = await POST(request({ type: 'create', activity: journeyActivity }));

    // Then
    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      journey_habit_key: 'week-1:0',
      family_id: 'family-a',
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
