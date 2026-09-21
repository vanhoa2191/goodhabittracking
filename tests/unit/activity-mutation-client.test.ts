import { describe, expect, it, vi } from 'vitest';
import {
  ActivityMutationRequestError,
  requestActivityMutation,
  type ActivityMutationRequester,
} from '@/lib/store/activity-mutation-client';
import type { HabitActivity } from '@/types';

const activity: HabitActivity = {
  id: '11111111-1111-4111-8111-111111111111',
  childId: null,
  title: 'Đọc sách',
  description: 'Đọc 15 phút',
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
  createdAt: '2026-09-20T00:00:00.000Z',
};

describe('activity mutation client', () => {
  it('parses a successful create response and sends only the typed mutation', async () => {
    // Given
    const requester = vi.fn<ActivityMutationRequester>(async () => new Response(JSON.stringify({
      success: true,
      activityId: activity.id,
    }), { status: 200 }));

    // When
    const result = await requestActivityMutation({ type: 'create', activity }, requester);

    // Then
    expect(result).toEqual({ activityIds: [activity.id] });
    expect(requester).toHaveBeenCalledWith('/api/domain/activities', expect.objectContaining({
      method: 'POST',
    }));
    const body = requester.mock.calls[0]?.[1]?.body;
    expect(body).toEqual(expect.stringContaining(activity.id));
    expect(body).not.toEqual(expect.stringContaining('familyId'));
  });

  it('parses every identifier returned by a batch create', async () => {
    // Given
    const secondActivity = {
      ...activity,
      id: '22222222-2222-4222-8222-222222222222',
      title: 'Uống nước',
    };
    const requester = vi.fn<ActivityMutationRequester>(async () => new Response(JSON.stringify({
      success: true,
      activityIds: [activity.id, secondActivity.id],
    }), { status: 200 }));

    // When
    const result = await requestActivityMutation({
      type: 'createMany',
      activities: [activity, secondActivity],
    }, requester);

    // Then
    expect(result).toEqual({ activityIds: [activity.id, secondActivity.id] });
  });

  it('rejects malformed success payloads at the client boundary', async () => {
    // Given
    const requester = vi.fn<ActivityMutationRequester>(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    );

    // When / Then
    await expect(requestActivityMutation({ type: 'create', activity }, requester))
      .rejects.toBeInstanceOf(ActivityMutationRequestError);
  });

  it('preserves the server error for an expected mutation failure', async () => {
    // Given
    const requester = vi.fn<ActivityMutationRequester>(async () => new Response(JSON.stringify({
      success: false,
      error: 'The habit could not be saved.',
    }), { status: 409 }));

    // When / Then
    await expect(requestActivityMutation({
      type: 'delete',
      activityId: activity.id,
    }, requester)).rejects.toMatchObject({
      name: 'ActivityMutationRequestError',
      message: 'The habit could not be saved.',
      status: 409,
    });
  });
});
