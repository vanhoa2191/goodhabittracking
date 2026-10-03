import type { FamilyPausePeriod } from '@/lib/experience-state';
import { isFamilyPausedOn } from '@/lib/habit-fire';
import type { ActivityLog } from '@/types';
import { addDays } from './opportunities';

export type WeekRhythm = {
  /** Days in the last seven on which the child did at least one task. */
  readonly daysDone: number;
  /** Days that counted: the last seven, minus the days the family paused. */
  readonly daysCounted: number;
};

const DID_SOMETHING: ReadonlySet<ActivityLog['status']> = new Set(['completed', 'approved', 'pending_approval']);

/** A steady rhythm in place of a streak: how many of the last seven days had something done. A missed day never resets it. */
export function weekRhythm(
  logs: readonly Pick<ActivityLog, 'childId' | 'date' | 'status'>[],
  childId: string,
  today: string,
  pausePeriods: readonly FamilyPausePeriod[],
): WeekRhythm {
  let daysDone = 0;
  let daysCounted = 0;
  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(today, -offset);
    if (isFamilyPausedOn(date, pausePeriods)) continue;
    daysCounted += 1;
    if (logs.some((log) => log.childId === childId && log.date === date && DID_SOMETHING.has(log.status))) daysDone += 1;
  }
  return { daysDone, daysCounted };
}
