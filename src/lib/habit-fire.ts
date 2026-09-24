import type { ActivityLog } from '@/types';
import type { FamilyPausePeriod } from '@/lib/experience-state';

export type HabitFire = {
  readonly kind: 'active' | 'resting' | 'cold';
  readonly days: number;
  readonly pendingToday: boolean;
};

export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function previousDay(date: string): string {
  const day = new Date(`${date}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

export function habitFireForChild(
  logs: readonly ActivityLog[],
  childId: string,
  today: string,
  pausePeriods: readonly FamilyPausePeriod[] = [],
): HabitFire {
  const childLogs = logs.filter((log) => log.childId === childId);
  const verifiedDays = new Set(childLogs
    .filter((log) => log.status === 'completed' || log.status === 'approved')
    .map((log) => log.date));
  const pendingToday = childLogs.some((log) => log.date === today && log.status === 'pending_approval');
  const earliestVerifiedDay = [...verifiedDays].sort()[0];
  if (!earliestVerifiedDay) return { kind: 'cold', days: 0, pendingToday };
  const isPausedDay = (day: string) => {
    const dayStart = new Date(`${day}T00:00:00`);
    const nextDay = new Date(dayStart);
    nextDay.setDate(nextDay.getDate() + 1);
    return pausePeriods.some(({ startedAt, endedAt }) =>
      new Date(startedAt) < nextDay && (endedAt === null || new Date(endedAt) > dayStart));
  };

  let date = today;
  let canRest = true;
  while (date >= earliestVerifiedDay && !verifiedDays.has(date)) {
    if (!isPausedDay(date)) {
      if (!canRest) return { kind: 'cold', days: 0, pendingToday };
      canRest = false;
    }
    date = previousDay(date);
  }
  const anchor = verifiedDays.has(date) ? date : null;
  if (!anchor) return { kind: 'cold', days: 0, pendingToday };

  let days = 0;
  while (date >= earliestVerifiedDay && (verifiedDays.has(date) || isPausedDay(date))) {
    if (verifiedDays.has(date)) days += 1;
    date = previousDay(date);
  }

  return { kind: anchor === today ? 'active' : 'resting', days, pendingToday };
}
