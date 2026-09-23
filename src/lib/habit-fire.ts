import type { ActivityLog } from '@/types';

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
): HabitFire {
  const childLogs = logs.filter((log) => log.childId === childId);
  const verifiedDays = new Set(childLogs
    .filter((log) => log.status === 'completed' || log.status === 'approved')
    .map((log) => log.date));
  const pendingToday = childLogs.some((log) => log.date === today && log.status === 'pending_approval');

  const yesterday = previousDay(today);
  const anchor = verifiedDays.has(today) ? today : verifiedDays.has(yesterday) ? yesterday : null;
  if (!anchor) return { kind: 'cold', days: 0, pendingToday };

  let days = 0;
  let date = anchor;
  while (verifiedDays.has(date)) {
    days += 1;
    date = previousDay(date);
  }

  return { kind: anchor === today ? 'active' : 'resting', days, pendingToday };
}
