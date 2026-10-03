import type { ActivityLog, HabitActivity } from '@/types';
import { addDays } from './opportunities';

export type DayBand = 'morning' | 'afternoon' | 'evening';

export type TimeSuggestion = {
  readonly band: DayBand;
  /** The usual minute of the day (0-1439) when it was done, as the median of the recent times. */
  readonly medianMinute: number;
};

const WINDOW_DAYS = 30;
const MIN_SAMPLES = 6;
const MIN_SHARE = 0.7;

export function bandOfMinute(minute: number): DayBand {
  if (minute < 12 * 60) return 'morning';
  return minute < 18 * 60 ? 'afternoon' : 'evening';
}

export function formatMinute(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
}

type TimedLog = Pick<ActivityLog, 'activityId' | 'childId' | 'date' | 'status' | 'completedAt'>;

/**
 * When a child usually does a habit, if that is clearly another part of the day than the one it is set for.
 * It needs enough recent times and most of them in the same other part of the day; a habit set for "anytime" has
 * nothing to compare with and gets no suggestion.
 */
export function suggestTimeOfDay(
  activity: Pick<HabitActivity, 'id' | 'timeOfDay'>,
  childId: string,
  logs: readonly TimedLog[],
  today: string,
): TimeSuggestion | null {
  if (activity.timeOfDay === 'anytime') return null;
  const since = addDays(today, -WINDOW_DAYS);
  const minutes = logs
    .filter((log) => log.activityId === activity.id && log.childId === childId && log.date >= since && (log.status === 'completed' || log.status === 'approved'))
    .map((log) => new Date(log.completedAt))
    .filter((time) => Number.isFinite(time.getTime()))
    .map((time) => time.getHours() * 60 + time.getMinutes())
    .sort((a, b) => a - b);
  if (minutes.length < MIN_SAMPLES) return null;
  const counts = new Map<DayBand, number>();
  for (const minute of minutes) counts.set(bandOfMinute(minute), (counts.get(bandOfMinute(minute)) ?? 0) + 1);
  const [band, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!band || band === activity.timeOfDay || count / minutes.length < MIN_SHARE) return null;
  const inBand = minutes.filter((minute) => bandOfMinute(minute) === band);
  return { band, medianMinute: inBand[Math.floor(inBand.length / 2)] ?? 0 };
}
