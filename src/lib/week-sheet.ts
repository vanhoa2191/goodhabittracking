import type { ActivityLog, HabitActivity } from '@/types';
import { localDayKey } from '@/lib/local-day';

export type WeekDay = { readonly key: string; readonly date: Date; readonly dayOfWeek: number };
export type WeekRow = {
  readonly activity: HabitActivity;
  /** true = done, false = scheduled but not done, null = not scheduled that day */
  readonly cells: readonly (boolean | null)[];
  readonly pointsEarned: number;
};
export type WeekSheet = {
  readonly days: readonly WeekDay[];
  readonly rows: readonly WeekRow[];
  readonly scheduledCount: number;
  readonly doneCount: number;
  readonly pointsEarned: number;
};

/** Monday to Sunday of the week that contains `today`. */
export function weekDays(today: Date): WeekDay[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - sinceMonday);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
    return { key: localDayKey(date), date, dayOfWeek: date.getDay() };
  });
}

function scheduledOn(activity: HabitActivity, dayOfWeek: number): boolean {
  if (activity.recurrenceDays.length > 0) return activity.recurrenceDays.includes(dayOfWeek);
  if (activity.recurrenceType === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (activity.recurrenceType === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
  return true;
}

export function buildWeekSheet(input: {
  readonly activities: readonly HabitActivity[];
  readonly logs: readonly ActivityLog[];
  readonly childId: string;
  readonly today: Date;
}): WeekSheet {
  const days = weekDays(input.today);
  const dayKeys = new Set(days.map((day) => day.key));
  const verified = input.logs.filter((log) =>
    log.childId === input.childId
    && dayKeys.has(log.date)
    && (log.status === 'completed' || log.status === 'approved'));

  const rows = input.activities
    .filter((activity) => activity.isActive && (!activity.childId || activity.childId === input.childId))
    .map((activity): WeekRow => {
      const done = verified.filter((log) => log.activityId === activity.id);
      const doneDays = new Set(done.map((log) => log.date));
      return {
        activity,
        cells: days.map((day) => (doneDays.has(day.key) ? true : scheduledOn(activity, day.dayOfWeek) ? false : null)),
        pointsEarned: done.reduce((sum, log) => sum + log.pointsAwarded, 0),
      };
    });

  const cells = rows.flatMap((row) => row.cells);
  return {
    days,
    rows,
    scheduledCount: cells.filter((cell) => cell !== null).length,
    doneCount: cells.filter((cell) => cell === true).length,
    pointsEarned: rows.reduce((sum, row) => sum + row.pointsEarned, 0),
  };
}
