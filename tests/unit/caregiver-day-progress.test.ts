import { describe, expect, it } from 'vitest';
import { summarizeChildDayProgress } from '@/lib/caregiver-day-progress';
import type { CaregiverProgress } from '@/lib/store/caregiver-progress';
import { addDays, isActivityDueOn } from '@/lib/habit-programs/opportunities';

const familyId = '11111111-1111-4111-8111-111111111111';
const child = '22222222-2222-4222-8222-222222222222';
const sibling = '33333333-3333-4333-8333-333333333333';

type Habit = CaregiverProgress['activities'][number];
type Count = { child_id: string; day: string; count: number };

let nextId = 0;
function habit(extra: Partial<Habit> = {}): Habit {
  nextId += 1;
  return {
    id: `00000000-0000-4000-8000-${String(nextId).padStart(12, '0')}`,
    child_id: null, title: 'Habit', description: null, recurrence_type: 'daily', recurrence_days: [],
    ...extra,
  };
}

/** `to` is the server's today; the window is the seven days ending on it. */
function progress(to: string, activities: Habit[], counts: Count[] = []): CaregiverProgress {
  return {
    familyId, familyRole: 'caregiver',
    profiles: [], activities, completionCounts: [],
    daily: { from: to, to, counts },
  };
}

// 2026-10-03 is a Saturday, so the window runs from Sunday 2026-09-27.
const SATURDAY = '2026-10-03';

// A copy of the SQL daily-count rules, coupled to static SQL tests to catch drift when either side changes.
function sqlDailyCounts(activities: Habit[], logs: { activity_id: string; child_id: string; day: string; status: string }[]): Count[] {
  const counts = new Map<string, Count>();
  for (const log of logs) {
    const activity = activities.find((item) => item.id === log.activity_id);
    if (!activity || (activity.child_id !== null && activity.child_id !== log.child_id)
      || !['completed', 'approved'].includes(log.status)) continue;
    const weekday = new Date(`${log.day}T12:00:00Z`).getUTCDay();
    let due: boolean;
    switch (activity.recurrence_type) {
      case 'weekdays': due = weekday >= 1 && weekday <= 5; break;
      case 'weekends': due = weekday === 0 || weekday === 6; break;
      case 'custom': due = (activity.recurrence_days ?? []).includes(weekday); break;
      default: due = true;
    }
    if (!due) continue;
    const key = `${log.child_id}/${log.day}`;
    counts.set(key, { child_id: log.child_id, day: log.day, count: (counts.get(key)?.count ?? 0) + 1 });
  }
  return [...counts.values()];
}

const dayAtOffset = (hours: number) => (date: Date) => new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString().slice(0, 10);

describe('caregiver day progress', () => {
  it('has nothing to show when the database sent no daily counts', () => {
    const older: CaregiverProgress = {
      familyId, familyRole: 'caregiver', profiles: [], activities: [habit()], completionCounts: [],
    };
    expect(summarizeChildDayProgress(older, child)).toBeNull();
  });

  it('counts today and the week for daily habits', () => {
    const data = progress(SATURDAY, [habit(), habit()], [
      { child_id: child, day: SATURDAY, count: 1 },
      { child_id: child, day: '2026-10-01', count: 2 },
      { child_id: child, day: '2026-09-27', count: 1 },
    ]);
    expect(summarizeChildDayProgress(data, child)).toEqual({
      today: { done: 1, due: 2 },
      week: { done: 4, due: 14 },
    });
  });

  it('reports no due work, not 0 of 0 progress, when the child has no habits', () => {
    expect(summarizeChildDayProgress(progress(SATURDAY, []), child)).toEqual({
      today: { done: 0, due: 0 }, week: { done: 0, due: 0 },
    });
  });

  it('follows the weekday schedule: nothing is due on a Saturday for a weekday habit', () => {
    const data = progress(SATURDAY, [habit({ recurrence_type: 'weekdays' })], [{ child_id: child, day: '2026-09-30', count: 1 }]);
    expect(summarizeChildDayProgress(data, child)).toEqual({
      today: { done: 0, due: 0 }, week: { done: 1, due: 5 },
    });
  });

  it('follows weekend and custom schedules', () => {
    const weekends = progress(SATURDAY, [habit({ recurrence_type: 'weekends' })]);
    expect(summarizeChildDayProgress(weekends, child)).toEqual({ today: { done: 0, due: 1 }, week: { done: 0, due: 2 } });
    // Monday and Wednesday only: 2026-09-28 and 2026-09-30.
    const custom = progress(SATURDAY, [habit({ recurrence_type: 'custom', recurrence_days: [1, 3] })]);
    expect(summarizeChildDayProgress(custom, child)).toEqual({ today: { done: 0, due: 0 }, week: { done: 0, due: 2 } });
  });

  it('treats a custom habit with no stored days as never due', () => {
    const data = progress(SATURDAY, [habit({ recurrence_type: 'custom', recurrence_days: null })]);
    expect(summarizeChildDayProgress(data, child)?.week).toEqual({ done: 0, due: 0 });
  });

  it('walks across a month boundary', () => {
    // The window is 2026-02-24 to 2026-03-02: February has 28 days in 2026.
    const data = progress('2026-03-02', [habit()], [
      { child_id: child, day: '2026-02-28', count: 1 },
      { child_id: child, day: '2026-03-01', count: 1 },
      { child_id: child, day: '2026-02-23', count: 1 },
    ]);
    expect(summarizeChildDayProgress(data, child)).toEqual({ today: { done: 0, due: 1 }, week: { done: 2, due: 7 } });
  });

  it('walks across a year boundary', () => {
    const data = progress('2027-01-02', [habit()], [{ child_id: child, day: '2026-12-31', count: 1 }]);
    expect(summarizeChildDayProgress(data, child)?.week).toEqual({ done: 1, due: 7 });
  });

  it('does not count days before a habit existed as missed', () => {
    const data = progress(SATURDAY, [habit({ created_at: '2026-10-01T12:00:00Z' }), habit()]);
    expect(summarizeChildDayProgress(data, child, dayAtOffset(7))?.week).toEqual({ done: 0, due: 3 + 7 });
  });

  it.each([
    [-7, '2026-10-04T03:00:00Z', '2026-10-03', '2026-10-02'],
    [7, '2026-10-03T20:00:00Z', '2026-10-04', '2026-10-03'],
  ] as const)('uses the local creation day in UTC%+i', (offset, created_at, today, previous) => {
    const activities = [habit({ created_at })];
    const counts = [{ child_id: child, day: today, count: 1 }];
    expect(summarizeChildDayProgress(progress(today, activities, counts), child, dayAtOffset(offset))).toEqual({
      today: { done: 1, due: 1 }, week: { done: 1, due: 1 },
    });
    expect(summarizeChildDayProgress(progress(previous, activities), child, dayAtOffset(offset))?.today).toEqual({ done: 0, due: 0 });
  });

  it('does not let a Saturday log of a weekday habit stand in for the unfinished daily habit', () => {
    const activities = [habit(), habit({ recurrence_type: 'weekdays' })];
    const counts = sqlDailyCounts(activities, [{ activity_id: activities[1].id, child_id: child, day: SATURDAY, status: 'completed' }]);
    expect(counts).toEqual([]);
    expect(summarizeChildDayProgress(progress(SATURDAY, activities, counts), child)?.today).toEqual({ done: 0, due: 1 });
  });

  it('does not count a moved habit for its former child, but counts shared habits', () => {
    const activities = [habit({ child_id: child }), habit({ child_id: sibling }), habit()];
    const counts = sqlDailyCounts(activities, [
      { activity_id: activities[1].id, child_id: child, day: SATURDAY, status: 'approved' },
      { activity_id: activities[1].id, child_id: sibling, day: SATURDAY, status: 'completed' },
      { activity_id: activities[2].id, child_id: sibling, day: SATURDAY, status: 'approved' },
    ]);
    const data = progress(SATURDAY, activities, counts);
    expect(summarizeChildDayProgress(data, child)?.today).toEqual({ done: 0, due: 2 });
    expect(summarizeChildDayProgress(data, sibling)?.today).toEqual({ done: 2, due: 2 });
  });

  it.each(['daily', 'weekdays', 'weekends', 'custom'] as const)('matches the SQL recurrence copy to isActivityDueOn for %s across all weekdays', (recurrence_type) => {
    for (const recurrence_days of [null, [], [0, 1, 3, 6]]) {
      const activity = habit({ recurrence_type, recurrence_days });
      for (let weekday = 0; weekday < 7; weekday += 1) {
        const date = addDays('2026-09-27', weekday);
        const counts = sqlDailyCounts([activity], [{ activity_id: activity.id, child_id: child, day: date, status: 'completed' }]);
        expect(counts.length > 0).toBe(isActivityDueOn({ recurrenceType: recurrence_type, recurrenceDays: recurrence_days }, date));
      }
    }
  });

  it('never lets done exceed due, even for logs of a habit that was not due that day', () => {
    const data = progress(SATURDAY, [habit(), habit({ recurrence_type: 'weekdays' })], [
      // Two habits are due on Friday, but five completions are recorded (for example a habit switched off later).
      { child_id: child, day: '2026-10-02', count: 5 },
      // Only the daily habit is due on Saturday; both counts are for habits that are not.
      { child_id: child, day: SATURDAY, count: 9 },
    ]);
    const result = summarizeChildDayProgress(data, child);
    expect(result?.today).toEqual({ done: 1, due: 1 });
    expect(result?.week).toEqual({ done: 3, due: 12 });
  });

  it('gives a day with completions but nothing due zero done', () => {
    const data = progress(SATURDAY, [habit({ recurrence_type: 'weekdays' })], [{ child_id: child, day: SATURDAY, count: 3 }]);
    expect(summarizeChildDayProgress(data, child)?.today).toEqual({ done: 0, due: 0 });
  });

  it("uses only this child's counts and habits, plus the shared ones", () => {
    const data = progress(SATURDAY, [
      habit({ child_id: child }), habit({ child_id: sibling }), habit(),
    ], [
      { child_id: child, day: SATURDAY, count: 1 },
      { child_id: sibling, day: SATURDAY, count: 2 },
    ]);
    expect(summarizeChildDayProgress(data, child)?.today).toEqual({ done: 1, due: 2 });
    expect(summarizeChildDayProgress(data, sibling)?.today).toEqual({ done: 2, due: 2 });
  });

  it('adds repeated entries for the same day', () => {
    const data = progress(SATURDAY, [habit(), habit(), habit()], [
      { child_id: child, day: SATURDAY, count: 1 },
      { child_id: child, day: SATURDAY, count: 1 },
    ]);
    expect(summarizeChildDayProgress(data, child)?.today).toEqual({ done: 2, due: 3 });
  });
});
