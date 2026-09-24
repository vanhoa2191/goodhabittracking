import { describe, expect, it } from 'vitest';
import { MONTHLY_JOURNEY_PLANS, WEEKLY_JOURNEY_PLANS } from '@/lib/constants';
import {
  findJourneyAssignment,
  getCurrentJourneyIndex,
  getJourneyHabitKey,
  getMissingJourneyAssignments,
  getJourneyStageProgress,
} from '@/lib/journey-progress';
import type { ActivityLog, HabitActivity } from '@/types';

const plan = WEEKLY_JOURNEY_PLANS[0];
const activity: HabitActivity = {
  id: '11111111-1111-4111-8111-111111111111',
  childId: '22222222-2222-4222-8222-222222222222',
  title: plan.habits[0].title,
  description: plan.habits[0].description,
  icon: plan.habits[0].icon,
  category: plan.habits[0].category,
  points: plan.habits[0].points,
  recurrenceType: 'daily',
  recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
  timeOfDay: plan.habits[0].timeOfDay,
  requiresApproval: false,
  isActive: true,
  createdAt: '2026-09-24T00:00:00.000Z',
};

describe('journey progress', () => {
  it('recognizes a legacy localized assignment without creating a duplicate', () => {
    // Given
    const legacy = { ...activity, title: 'Kind smile: Greet family warmly' };

    // When
    const assignment = findJourneyAssignment(plan, 0, activity.childId, [legacy]);

    // Then
    expect(assignment?.id).toBe(activity.id);
  });

  it('reuses a matching habit already assigned through another stage', () => {
    // Given
    const existing = { ...activity, journeyHabitKey: 'month-2:0' };

    // When
    const assignment = findJourneyAssignment(plan, 0, activity.childId, [existing]);

    // Then
    expect(assignment?.id).toBe(activity.id);
  });

  it('prefers the exact journey identity over an earlier legacy title match', () => {
    const legacy = { ...activity, id: 'legacy-activity' };
    const keyed = { ...activity, journeyHabitKey: getJourneyHabitKey(plan, 0) };
    expect(findJourneyAssignment(plan, 0, activity.childId, [legacy, keyed])?.id).toBe(keyed.id);
  });

  it('counts only verified practice for the selected child', () => {
    // Given
    const log: ActivityLog = {
      id: '33333333-3333-4333-8333-333333333333',
      activityId: activity.id,
      childId: activity.childId ?? '',
      date: '2026-09-24',
      status: 'approved',
      pointsAwarded: 10,
      completedAt: '2026-09-24T00:00:00.000Z',
    };

    // When
    const progress = getJourneyStageProgress(plan, activity.childId ?? '', [activity], [
      { ...log, status: 'pending_approval' },
      log,
    ]);

    // Then
    expect(progress).toEqual({ assignedCount: 1, practicedCount: 1, totalCount: 4, complete: false });
  });

  it('keeps the first unfinished stage current', () => {
    // Given
    const stages = [
      { assignedCount: 4, practicedCount: 4, totalCount: 4, complete: true },
      { assignedCount: 4, practicedCount: 1, totalCount: 4, complete: false },
      { assignedCount: 0, practicedCount: 0, totalCount: 4, complete: false },
    ];

    // When
    const current = getCurrentJourneyIndex(stages);

    // Then
    expect(current).toBe(1);
    expect(getJourneyHabitKey(plan, 0)).toBe('week-1:0');
  });

  it('keeps assignment identity when a plan is reordered or its copy changes', () => {
    const reordered = {
      ...plan,
      habits: [
        { ...plan.habits[1], title: 'Updated title' },
        plan.habits[0],
        ...plan.habits.slice(2),
      ],
    };

    expect(getJourneyHabitKey(reordered, 1)).toBe(getJourneyHabitKey(plan, 0));
    expect(getJourneyHabitKey(reordered, 0)).toBe(getJourneyHabitKey(plan, 1));
  });

  it('has a unique stable identity for every journey habit', () => {
    for (const journey of [...WEEKLY_JOURNEY_PLANS, ...MONTHLY_JOURNEY_PLANS]) {
      const keys = journey.habits.map((_, index) => getJourneyHabitKey(journey, index));
      expect(new Set(keys).size).toBe(keys.length);
      expect(keys.every((key) => /^(week|month)-[1-4]:\d{1,2}$/.test(key))).toBe(true);
    }
  });

  it('adds a shared habit only when no child already has that habit', () => {
    // Given
    const secondChildId = '44444444-4444-4444-8444-444444444444';
    const existing = { ...activity, journeyHabitKey: getJourneyHabitKey(plan, 0) };

    // When
    const pending = getMissingJourneyAssignments(
      plan, null, [activity.childId ?? '', secondChildId], [existing],
    );

    // Then
    expect(pending.filter((target) => target.habitIndex === 0)).toEqual([
      { habitIndex: 0, childId: secondChildId },
    ]);
    expect(pending.filter((target) => target.habitIndex === 1)).toEqual([
      { habitIndex: 1, childId: null },
    ]);
  });

  it('keeps one shared assignment when every child is missing the habit', () => {
    const pending = getMissingJourneyAssignments(plan, null, [activity.childId ?? '', 'other-child'], []);
    expect(pending).toHaveLength(plan.habits.length);
    expect(pending.every((target) => target.childId === null)).toBe(true);
  });
});
