import { describe, expect, it } from 'vitest';
import { emptyExperienceState } from '@/lib/experience-state';
import type { CuePlan, ExperienceState } from '@/lib/experience-state';
import { childAgeYears, summarizeChildHabits } from '@/lib/habit-programs/summary';
import type { ActivityLog, ChildProfile, HabitActivity } from '@/types';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const otherChildId = '33333333-3333-4333-8333-333333333333';
const readingId = '44444444-4444-4444-8444-444444444444';
const brushingId = '55555555-5555-4555-8555-555555555555';

function activity(id: string, overrides: Partial<HabitActivity> = {}): HabitActivity {
  return {
    id, childId: null, title: `Habit ${id.slice(0, 4)}`, icon: '✓', category: 'study', points: 10,
    recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6], timeOfDay: 'anytime',
    requiresApproval: false, isActive: true, createdAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

function plan(activityId: string, overrides: Partial<CuePlan> = {}): CuePlan {
  return {
    family_id: familyId, child_id: childId, activity_id: activityId, cue_kind: 'event', cue_text: 'After dinner',
    cue_time: null, place_text: null, weekend_variant_text: null,
    created_at: '2026-01-01T12:00:00.000Z', updated_at: '2026-01-01T12:00:00.000Z', ...overrides,
  };
}

function log(activityId: string, date: string, status: ActivityLog['status'] = 'completed', id = `${activityId}-${date}`): ActivityLog {
  return { id, activityId, childId, date, status, pointsAwarded: 10, completedAt: `${date}T12:00:00.000Z` };
}

function state(overrides: Partial<ExperienceState>): ExperienceState {
  return { ...emptyExperienceState, ...overrides };
}

const child = { id: childId, age: 8 } as Pick<ChildProfile, 'id' | 'age' | 'birthYear' | 'ageStage'>;
const days = (from: string, count: number) =>
  Array.from({ length: count }, (_, index) => new Date(Date.UTC(2026, 0, Number(from.slice(-2)) + index, 12)).toISOString().slice(0, 10));

describe('child age', () => {
  it('prefers the stored age, then the birth year, then the middle of the age stage', () => {
    expect(childAgeYears({ age: 7, birthYear: 2000, ageStage: '12-18' }, '2026-09-30')).toBe(7);
    expect(childAgeYears({ birthYear: 2019, ageStage: '12-18' }, '2026-09-30')).toBe(7);
    expect(childAgeYears({ ageStage: '3-6' }, '2026-09-30')).toBe(4);
    expect(childAgeYears({ ageStage: '12-18' }, '2026-09-30')).toBe(15);
    expect(childAgeYears({}, '2026-09-30')).toBe(9);
  });
});

describe('summarizeChildHabits', () => {
  it('has nothing to say about a child with no cue plans', () => {
    const result = summarizeChildHabits({ child, activities: [activity(readingId)], logs: [], experience: emptyExperienceState, pausePeriods: [], today: '2026-02-01' });
    expect(result.habits).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  it('evaluates each planned habit from the day the plan was made', () => {
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId, { frameworkHabitId: 'GD3-HT-02' })],
      logs: days('2026-01-02', 4).map((date) => log(readingId, date)),
      experience: state({ cuePlans: [plan(readingId)] }),
      pausePeriods: [],
      today: '2026-01-10',
    });
    expect(result.habits).toHaveLength(1);
    expect(result.habits[0]).toMatchObject({ activityId: readingId, complexity: 'medium', cadence: 'due-day', since: '2026-01-01' });
    expect(result.habits[0].evaluation.phase).toBe('build');
  });

  it('does not count the day the plan was made as a miss', () => {
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId)],
      logs: [],
      experience: state({ cuePlans: [plan(readingId, { created_at: '2026-01-05T12:00:00.000Z' })] }),
      pausePeriods: [],
      today: '2026-01-06',
    });
    expect(result.habits[0].evaluation.consecutiveMissed).toBe(0);
    expect(result.habits[0].evaluation.phase).toBe('anchor');
  });

  it('feeds recorded support levels into the evaluation', () => {
    const logs = days('2026-01-02', 14).map((date) => log(readingId, date));
    const supportObservations = logs.map((entry) => ({
      log_id: entry.id, family_id: familyId, child_id: childId, activity_id: readingId,
      support_level: 'alone' as const, recorded_by: 'parent' as const, recorded_at: '2026-01-20T09:00:00+07:00',
    }));
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId)],
      logs,
      experience: state({ cuePlans: [plan(readingId)], supportObservations }),
      pausePeriods: [],
      today: '2026-01-16',
    });
    expect(result.habits[0].evaluation.aloneInWindow).toBe(10);
    expect(result.habits[0].evaluation.phase).toBe('fade');
  });

  it('does not count days the family paused as missed, on a parent or a child device', () => {
    const pausePeriods = [{ startedAt: '2026-01-03T00:00:00+07:00', endedAt: '2026-01-07T00:00:00+07:00' }];
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId)],
      logs: [log(readingId, '2026-01-02')],
      experience: state({ cuePlans: [plan(readingId)] }),
      pausePeriods,
      today: '2026-01-08',
    });
    expect(result.habits[0].evaluation.consecutiveMissed).toBe(1);
    expect(result.habits[0].evaluation.missedInLastFive).toBe(1);
    const withoutPause = summarizeChildHabits({
      child,
      activities: [activity(readingId)],
      logs: [log(readingId, '2026-01-02')],
      experience: state({ cuePlans: [plan(readingId)] }),
      pausePeriods: [],
      today: '2026-01-08',
    });
    expect(withoutPause.habits[0].evaluation.consecutiveMissed).toBe(5);
  });

  it('gives the week a weekly habit was planned in the same grace as a daily habit\'s first day', () => {
    const weekly = activity(readingId, { frameworkHabitId: 'GD3-TC-01' });
    const missedWeeks = (created_at: string) => summarizeChildHabits({
      child,
      activities: [weekly],
      logs: [],
      experience: state({ cuePlans: [plan(readingId, { created_at })] }),
      pausePeriods: [],
      today: '2026-01-14',
    }).habits[0].evaluation.consecutiveMissed;
    expect(missedWeeks('2026-01-05T12:00:00.000Z')).toBe(0);
    expect(missedWeeks('2026-01-06T12:00:00.000Z')).toBe(0);
  });

  it('tells the parent about too many new habits before the individual worries it causes', () => {
    const habitIds = [readingId, brushingId, '66666666-6666-4666-8666-666666666666', '77777777-7777-4777-8777-777777777777'];
    const result = summarizeChildHabits({
      child: { id: childId, age: 4 } as typeof child,
      activities: habitIds.map((id) => activity(id)),
      logs: habitIds.flatMap((id) => ['2026-01-02', '2026-01-03', '2026-01-04'].map((date) => log(id, date))),
      experience: state({ cuePlans: habitIds.map((id) => plan(id)) }),
      pausePeriods: [],
      today: '2026-01-10',
    });
    expect(result.habits.every((habit) => habit.suggestions.some((entry) => entry.code === 'check-in'))).toBe(true);
    expect(result.suggestions).toHaveLength(3);
    expect(result.suggestions[0].suggestion.code).toBe('too-many-new');
  });

  it('ignores plans for other children, inactive habits and habits assigned to someone else', () => {
    const result = summarizeChildHabits({
      child,
      activities: [
        activity(readingId, { isActive: false }),
        activity(brushingId, { childId: otherChildId }),
      ],
      logs: [],
      experience: state({ cuePlans: [
        plan(readingId),
        plan(brushingId),
        plan(readingId, { child_id: otherChildId }),
        plan('66666666-6666-4666-8666-666666666666'),
      ] }),
      pausePeriods: [],
      today: '2026-01-10',
    });
    expect(result.habits).toEqual([]);
  });

  it('warns when a small child is setting up too many habits and ranks the most urgent first', () => {
    const young = { id: childId, age: 2 } as typeof child;
    const result = summarizeChildHabits({
      child: young,
      activities: [activity(readingId), activity(brushingId)],
      logs: [],
      experience: state({ cuePlans: [plan(readingId), plan(brushingId)] }),
      pausePeriods: [],
      today: '2026-01-10',
    });
    expect(result.suggestions.map((entry) => entry.suggestion.code)).toContain('too-many-new');
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });

  it('gives each planned habit its last seven days and how the child mostly did it', () => {
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId)],
      logs: [log(readingId, '2026-01-12'), log(readingId, '2026-01-13')],
      experience: state({ cuePlans: [plan(readingId, { created_at: '2026-01-10T12:00:00.000Z' })] }),
      pausePeriods: [],
      today: '2026-01-13',
    });
    const habit = result.habits[0]!;
    expect(habit.recent).toHaveLength(7);
    expect(habit.recent.at(-1)).toMatchObject({ date: '2026-01-13', state: 'done' });
    expect(habit.recent.filter((dot) => dot.state === 'done').length).toBeGreaterThanOrEqual(2);
    expect(habit.lean).toBeNull();
  });
});
