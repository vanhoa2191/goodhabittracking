import type { Dispatch, SetStateAction } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createActivityActions } from '@/lib/store/activity-actions';
import type { HabitActivity } from '@/types';

const activity = {
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
} satisfies Omit<HabitActivity, 'id' | 'createdAt'>;

describe('activity actions', () => {
  it('adds a local activity bundle in one state transition', async () => {
    // Given
    let state: HabitActivity[] = [];
    const setActivities: Dispatch<SetStateAction<HabitActivity[]>> = (action) => {
      state = typeof action === 'function' ? action(state) : action;
    };
    const setCloudSyncActive: Dispatch<SetStateAction<boolean>> = () => undefined;
    const actions = createActivityActions({
      currentUser: null,
      familyId: null,
      setActivities,
      setCloudSyncActive,
      storageMode: 'local',
      syncCloudFamily: vi.fn(async () => true),
    });

    // When
    const saved = await actions.createActivities([
      activity,
      { ...activity, title: 'Uống nước', icon: '💧' },
    ]);

    // Then
    expect(saved).toBe(true);
    expect(state.map((item) => item.title)).toEqual(['Đọc sách', 'Uống nước']);
    expect(new Set(state.map((item) => item.id))).toHaveLength(2);
  });
});
