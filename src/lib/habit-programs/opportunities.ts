import type { FamilyPausePeriod } from '@/lib/experience-state';
import { isFamilyPausedOn } from '@/lib/habit-fire';
import type { ActivityLog, HabitActivity } from '@/types';
import type { Cadence, Opportunity, SupportLevel } from './types';

type Recurrence = {
  readonly recurrenceType: HabitActivity['recurrenceType'];
  readonly recurrenceDays: readonly number[];
};

export type DeferralRow = {
  readonly child_id: string;
  readonly activity_id: string;
  readonly local_date: string;
};

export type OpportunityInput = {
  readonly activityId: string;
  readonly childId: string;
  readonly recurrence: Recurrence;
  readonly cadence: Cadence;
  /** First local day (YYYY-MM-DD) that may count, usually the day the habit was started. */
  readonly since: string;
  /** Today's local day; today only counts once the habit has been done. */
  readonly today: string;
  readonly logs: readonly ActivityLog[];
  readonly supportByLogId: ReadonlyMap<string, SupportLevel>;
  readonly deferrals: readonly DeferralRow[];
  readonly pausePeriods: readonly FamilyPausePeriod[];
};

export function isActivityDueOn(recurrence: Recurrence, date: string): boolean {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  switch (recurrence.recurrenceType) {
    case 'weekdays': return weekday >= 1 && weekday <= 5;
    case 'weekends': return weekday === 0 || weekday === 6;
    case 'custom': return recurrence.recurrenceDays.includes(weekday);
    default: return true;
  }
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Monday of the calendar week that contains `date`. */
export function weekStart(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

function isVerified(log: ActivityLog): boolean {
  return log.status === 'completed' || log.status === 'approved';
}

/**
 * The chronological list of chances a child had to do a habit, oldest first.
 * Days that are paused, deferred, still awaiting approval or not over yet are left out
 * so they never count as a miss.
 */
export function buildOpportunities(input: OpportunityInput): Opportunity[] {
  const own = input.logs.filter((log) => log.childId === input.childId && log.activityId === input.activityId);
  const outcomeOf = (log: ActivityLog) => input.supportByLogId.get(log.id) ?? 'unknown';
  return input.cadence === 'weekly' ? weeklyOpportunities(input, own, outcomeOf) : dueDayOpportunities(input, own, outcomeOf);
}

type Outcomes = (log: ActivityLog) => Opportunity['outcome'];

function dueDayOpportunities(input: OpportunityInput, own: readonly ActivityLog[], outcomeOf: Outcomes): Opportunity[] {
  const deferred = new Set(input.deferrals
    .filter((row) => row.child_id === input.childId && row.activity_id === input.activityId)
    .map((row) => row.local_date));
  const result: Opportunity[] = [];
  for (let date = input.since; date <= input.today; date = addDays(date, 1)) {
    if (!isActivityDueOn(input.recurrence, date)) continue;
    const onDay = own.filter((log) => log.date === date);
    const verified = onDay.find(isVerified);
    if (verified) {
      result.push({ date, outcome: outcomeOf(verified) });
      continue;
    }
    if (onDay.some((log) => log.status === 'pending_approval')) continue;
    if (isFamilyPausedOn(date, input.pausePeriods) || deferred.has(date) || date === input.today) continue;
    result.push({ date, outcome: 'missed' });
  }
  return result;
}

function weeklyOpportunities(input: OpportunityInput, own: readonly ActivityLog[], outcomeOf: Outcomes): Opportunity[] {
  const result: Opportunity[] = [];
  const currentWeek = weekStart(input.today);
  for (let start = weekStart(input.since); start <= currentWeek; start = addDays(start, 7)) {
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))
      .filter((day) => day >= input.since && day <= input.today);
    const inWeek = own.filter((log) => days.includes(log.date));
    const verified = inWeek.filter(isVerified).sort((a, b) => a.date.localeCompare(b.date));
    const latest = verified[verified.length - 1];
    if (latest) {
      result.push({ date: start, outcome: outcomeOf(latest) });
      continue;
    }
    if (start === currentWeek || inWeek.some((log) => log.status === 'pending_approval')) continue;
    if (days.every((day) => isFamilyPausedOn(day, input.pausePeriods))) continue;
    result.push({ date: start, outcome: 'missed' });
  }
  return result;
}
