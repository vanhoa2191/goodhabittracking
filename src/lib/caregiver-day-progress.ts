import { addDays, isActivityDueOn } from '@/lib/habit-programs/opportunities';
import { localDayKey } from '@/lib/habit-fire';
import type { CaregiverProgress } from '@/lib/store/caregiver-progress';

/** How many chances a child had on a day, and how many of them were done. `done` never exceeds `due`. */
export type DayProgress = { readonly done: number; readonly due: number };

export type ChildDayProgress = {
  readonly today: DayProgress;
  /** The seven days ending today, today included. */
  readonly week: DayProgress;
};

export const CAREGIVER_WINDOW_DAYS = 7;

/**
 * Today and the last seven days for one child, from the caregiver projection alone.
 *
 * "Due" follows the habit's recurrence with the same rule as the rest of the app and counts a habit only from
 * the local day it was created. "Done" is the server's count of completed-or-approved logs of habits due
 * for this child on that day. Clamping is a final safeguard against counts exceeding the current due total.
 *
 * Returns null when the database did not send daily counts, so the screen can hide what it cannot compute.
 */
export function summarizeChildDayProgress(
  progress: CaregiverProgress,
  childId: string,
  creationDay: (date: Date) => string = localDayKey,
): ChildDayProgress | null {
  const daily = progress.daily;
  if (!daily) return null;
  const habits = progress.activities.filter((activity) => activity.child_id === null || activity.child_id === childId);
  const doneByDay = new Map<string, number>();
  for (const entry of daily.counts) {
    if (entry.child_id === childId) doneByDay.set(entry.day, (doneByDay.get(entry.day) ?? 0) + entry.count);
  }

  const dayProgress = (day: string): DayProgress => {
    const due = habits.filter((habit) => (habit.created_at === undefined || creationDay(new Date(habit.created_at)) <= day)
      && isActivityDueOn({ recurrenceType: habit.recurrence_type ?? 'daily', recurrenceDays: habit.recurrence_days }, day)).length;
    return { due, done: Math.min(doneByDay.get(day) ?? 0, due) };
  };

  const days = Array.from({ length: CAREGIVER_WINDOW_DAYS }, (_, index) => addDays(daily.to, index - (CAREGIVER_WINDOW_DAYS - 1)));
  const perDay = days.map(dayProgress);
  return {
    today: perDay[perDay.length - 1],
    week: {
      done: perDay.reduce((sum, day) => sum + day.done, 0),
      due: perDay.reduce((sum, day) => sum + day.due, 0),
    },
  };
}
