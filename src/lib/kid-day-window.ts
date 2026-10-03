import { localDayKey } from '@/lib/habit-fire';

/** How many days back a child may look; the day itself and everything after it are not part of the window. */
export const KID_HISTORY_DAYS = 7;

export function parseDayKey(dayKey: string): Date {
  const [year = 1970, month = 1, day = 1] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function shiftDayKey(dayKey: string, days: number): string {
  const shifted = parseDayKey(dayKey);
  shifted.setDate(shifted.getDate() + days);
  return localDayKey(shifted);
}

export function kidDayWindow(todayKey: string): { readonly earliest: string; readonly latest: string } {
  return { earliest: shiftDayKey(todayKey, -KID_HISTORY_DAYS), latest: todayKey };
}

/** Day keys are zero-padded YYYY-MM-DD, so comparing them as text compares the dates. */
export function clampKidDay(dayKey: string, todayKey: string): string {
  const { earliest, latest } = kidDayWindow(todayKey);
  if (dayKey < earliest) return earliest;
  if (dayKey > latest) return latest;
  return dayKey;
}

export function canStepKidDay(dayKey: string, todayKey: string, direction: -1 | 1): boolean {
  const { earliest, latest } = kidDayWindow(todayKey);
  return direction < 0 ? dayKey > earliest : dayKey < latest;
}

/** Only today can be ticked, taken back or put off; every earlier day is for looking. */
export function isEditableDay(dayKey: string, todayKey: string): boolean {
  return dayKey === todayKey;
}
