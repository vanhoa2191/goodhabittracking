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
      getActivities: () => state,
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

  it('keeps journey assignments unique after repeated local application', async () => {
    // Given
    let state: HabitActivity[] = [];
    const setActivities: Dispatch<SetStateAction<HabitActivity[]>> = (action) => {
      state = typeof action === 'function' ? action(state) : action;
    };
    const actions = createActivityActions({
      currentUser: null,
      familyId: null,
      getActivities: () => state,
      setActivities,
      setCloudSyncActive: () => undefined,
      storageMode: 'local',
      syncCloudFamily: vi.fn(async () => true),
    });

    // When
    await actions.createActivities([{ ...activity, journeyHabitKey: 'week-1:0' }]);
    await actions.createActivities([{ ...activity, journeyHabitKey: 'week-1:0' }]);

    // Then
    expect(state).toHaveLength(1);
  });

  it('rejects a local all-children assignment that overlaps a child assignment', async () => {
    let state: HabitActivity[] = [];
    const setActivities: Dispatch<SetStateAction<HabitActivity[]>> = (action) => {
      state = typeof action === 'function' ? action(state) : action;
    };
    const actions = createActivityActions({
      currentUser: null,
      familyId: null,
      getActivities: () => state,
      setActivities,
      setCloudSyncActive: () => undefined,
      storageMode: 'local',
      syncCloudFamily: vi.fn(async () => true),
    });

    await actions.createActivities([{ ...activity, childId: 'child-one', journeyHabitKey: 'week-1:0' }]);
    await actions.createActivities([{ ...activity, childId: null, journeyHabitKey: 'week-1:0' }]);
    const updated = await actions.updateActivity(state[0].id, { childId: null });

    expect(updated).toBe(true);
    expect(state).toHaveLength(1);
    expect(state[0].childId).toBeNull();
  });

  it('rejects a local edit that would overlap another child assignment', async () => {
    let state: HabitActivity[] = [];
    const setActivities: Dispatch<SetStateAction<HabitActivity[]>> = (action) => {
      state = typeof action === 'function' ? action(state) : action;
    };
    const actions = createActivityActions({
      currentUser: null,
      familyId: null,
      getActivities: () => state,
      setActivities,
      setCloudSyncActive: () => undefined,
      storageMode: 'local',
      syncCloudFamily: vi.fn(async () => true),
    });

    await actions.createActivities([
      { ...activity, childId: 'child-one', journeyHabitKey: 'week-1:0' },
      { ...activity, childId: 'child-two', journeyHabitKey: 'week-1:0' },
    ]);
    const updated = await actions.updateActivity(state[0].id, { childId: null });

    expect(updated).toBe(false);
    expect(state.map((item) => item.childId)).toEqual(['child-one', 'child-two']);
  });
});
