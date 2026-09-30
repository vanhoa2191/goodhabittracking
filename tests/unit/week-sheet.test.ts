import { describe, expect, it } from 'vitest';
import { buildWeekSheet, weekDays } from '@/lib/week-sheet';
import type { ActivityLog, HabitActivity } from '@/types';

const base: Omit<HabitActivity, 'id' | 'title' | 'recurrenceType' | 'recurrenceDays'> = {
  childId: null, description: '', icon: '⭐', category: 'health', points: 10, timeOfDay: 'morning',
  durationMinutes: 5, requiresApproval: false, isActive: true, createdAt: '2026-09-01T00:00:00.000Z',
};
const brush: HabitActivity = { ...base, id: 'a1', title: 'Đánh răng', recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6] };
const school: HabitActivity = { ...base, id: 'a2', title: 'Soạn cặp', recurrenceType: 'weekdays', recurrenceDays: [1, 2, 3, 4, 5], points: 20 };
const other: HabitActivity = { ...base, id: 'a3', childId: 'child-2', title: 'Của bé khác', recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6] };
const off: HabitActivity = { ...base, id: 'a4', title: 'Đã tắt', isActive: false, recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6] };

function log(activityId: string, date: string, extra: Partial<ActivityLog> = {}): ActivityLog {
  return { id: `${activityId}-${date}`, activityId, childId: 'child-1', date, status: 'completed', pointsAwarded: 10, completedAt: `${date}T08:00:00.000Z`, ...extra };
}

describe('week sheet', () => {
  it('runs Monday to Sunday around any day of the week', () => {
    const wednesday = weekDays(new Date(2026, 8, 30));
    expect(wednesday.map((day) => day.key)).toEqual([
      '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04',
    ]);
    expect(wednesday[0]!.dayOfWeek).toBe(1);
    expect(wednesday[6]!.dayOfWeek).toBe(0);
    expect(weekDays(new Date(2026, 9, 4))[0]!.key).toBe('2026-09-28');
    expect(weekDays(new Date(2026, 8, 28))[0]!.key).toBe('2026-09-28');
  });

  it('lists this child\'s active habits and marks done, missed and unscheduled days', () => {
    const sheet = buildWeekSheet({
      activities: [brush, school, other, off],
      logs: [log('a1', '2026-09-28'), log('a1', '2026-09-30'), log('a2', '2026-09-29', { pointsAwarded: 20 })],
      childId: 'child-1',
      today: new Date(2026, 8, 30),
    });
    expect(sheet.rows.map((row) => row.activity.id)).toEqual(['a1', 'a2']);
    expect(sheet.rows[0]!.cells).toEqual([true, false, true, false, false, false, false]);
    expect(sheet.rows[1]!.cells).toEqual([false, true, false, false, false, null, null]);
    expect(sheet.doneCount).toBe(3);
    expect(sheet.scheduledCount).toBe(12);
    expect(sheet.pointsEarned).toBe(40);
  });

  it('counts only verified completions of the week and of this child', () => {
    const sheet = buildWeekSheet({
      activities: [brush],
      logs: [
        log('a1', '2026-09-28', { status: 'pending_approval' }),
        log('a1', '2026-09-29', { status: 'rejected' }),
        log('a1', '2026-09-27'),
        log('a1', '2026-10-05'),
        log('a1', '2026-09-30', { childId: 'child-2' }),
        log('a1', '2026-10-01', { status: 'approved' }),
      ],
      childId: 'child-1',
      today: new Date(2026, 8, 30),
    });
    expect(sheet.rows[0]!.cells).toEqual([false, false, false, true, false, false, false]);
    expect(sheet.doneCount).toBe(1);
  });

  it('is empty for a child with no habits', () => {
    const sheet = buildWeekSheet({ activities: [], logs: [], childId: 'child-1', today: new Date(2026, 8, 30) });
    expect(sheet.rows).toEqual([]);
    expect(sheet.scheduledCount).toBe(0);
  });
});
