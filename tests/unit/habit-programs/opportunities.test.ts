import { describe, expect, it } from 'vitest';
import { addDays, buildOpportunities, isActivityDueOn, weekStart } from '@/lib/habit-programs/opportunities';
import type { OpportunityInput } from '@/lib/habit-programs/opportunities';
import type { SupportLevel } from '@/lib/habit-programs/types';
import type { ActivityLog } from '@/types';

const childId = '11111111-1111-4111-8111-111111111111';
const activityId = '22222222-2222-4222-8222-222222222222';

function log(date: string, status: ActivityLog['status'] = 'completed', id = `log-${date}`): ActivityLog {
  return { id, activityId, childId, date, status, pointsAwarded: 10, completedAt: `${date}T08:00:00.000Z` };
}

function input(overrides: Partial<OpportunityInput> = {}): OpportunityInput {
  return {
    activityId,
    childId,
    recurrence: { recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6] },
    cadence: 'due-day',
    since: '2026-09-21',
    today: '2026-09-25',
    logs: [],
    supportByLogId: new Map<string, SupportLevel>(),
    deferrals: [],
    pausePeriods: [],
    ...overrides,
  };
}

describe('date helpers', () => {
  it('finds the Monday of a week and adds days across month ends', () => {
    expect(weekStart('2026-09-27')).toBe('2026-09-21');
    expect(weekStart('2026-09-21')).toBe('2026-09-21');
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
  });

  it('follows the recurrence rules the child dashboard uses', () => {
    const daily = { recurrenceType: 'daily', recurrenceDays: [] } as const;
    expect(isActivityDueOn(daily, '2026-09-27')).toBe(true);
    expect(isActivityDueOn({ recurrenceType: 'weekdays', recurrenceDays: [] }, '2026-09-26')).toBe(false);
    expect(isActivityDueOn({ recurrenceType: 'weekdays', recurrenceDays: [] }, '2026-09-25')).toBe(true);
    expect(isActivityDueOn({ recurrenceType: 'weekends', recurrenceDays: [] }, '2026-09-27')).toBe(true);
    expect(isActivityDueOn({ recurrenceType: 'custom', recurrenceDays: [1, 3] }, '2026-09-23')).toBe(true);
    expect(isActivityDueOn({ recurrenceType: 'custom', recurrenceDays: [1, 3] }, '2026-09-24')).toBe(false);
  });
});

describe('due-day opportunities', () => {
  it('marks done days by support level and past empty days as missed, and skips today until it is done', () => {
    const result = buildOpportunities(input({
      logs: [log('2026-09-21'), log('2026-09-22'), log('2026-09-24')],
      supportByLogId: new Map<string, SupportLevel>([['log-2026-09-21', 'alone'], ['log-2026-09-22', 'prompted']]),
    }));
    expect(result).toEqual([
      { date: '2026-09-21', outcome: 'alone' },
      { date: '2026-09-22', outcome: 'prompted' },
      { date: '2026-09-23', outcome: 'missed' },
      { date: '2026-09-24', outcome: 'unknown' },
    ]);
  });

  it('counts a day once even when it has two verified logs, and does nothing for a habit started today', () => {
    expect(buildOpportunities(input({
      since: '2026-09-24',
      today: '2026-09-24',
      logs: [log('2026-09-24', 'completed', 'a'), log('2026-09-24', 'approved', 'b')],
    }))).toEqual([{ date: '2026-09-24', outcome: 'unknown' }]);
    expect(buildOpportunities(input({ since: '2026-09-25', today: '2026-09-25' }))).toEqual([]);
  });

  it('picks the same support level for a day with two verified logs whatever the array order', () => {
    const early = { ...log('2026-09-24', 'completed', 'early'), completedAt: '2026-09-24T08:00:00.000Z' };
    const late = { ...log('2026-09-24', 'completed', 'late'), completedAt: '2026-09-24T09:00:00.000Z' };
    const tiedA = { ...log('2026-09-24', 'completed', 'a'), completedAt: '2026-09-24T10:00:00.000Z' };
    const tiedB = { ...log('2026-09-24', 'completed', 'b'), completedAt: '2026-09-24T10:00:00.000Z' };
    const supportByLogId = new Map<string, SupportLevel>([['early', 'alone'], ['late', 'prompted'], ['a', 'together'], ['b', 'alone']]);
    const base = { since: '2026-09-24', today: '2026-09-24', supportByLogId };
    expect(buildOpportunities(input({ ...base, logs: [early, late] }))).toEqual([{ date: '2026-09-24', outcome: 'prompted' }]);
    expect(buildOpportunities(input({ ...base, logs: [late, early] }))).toEqual([{ date: '2026-09-24', outcome: 'prompted' }]);
    const tieForward = buildOpportunities(input({ ...base, logs: [tiedA, tiedB] }));
    const tieReversed = buildOpportunities(input({ ...base, logs: [tiedB, tiedA] }));
    expect(tieForward).toEqual(tieReversed);
  });

  it('treats a custom recurrence with no saved days as never due instead of failing', () => {
    expect(isActivityDueOn({ recurrenceType: 'custom', recurrenceDays: undefined as unknown as number[] }, '2026-09-23')).toBe(false);
    expect(isActivityDueOn({ recurrenceType: 'custom', recurrenceDays: null as unknown as number[] }, '2026-09-23')).toBe(false);
  });

  it('counts today once it has been done', () => {
    const result = buildOpportunities(input({ logs: [log('2026-09-25')], since: '2026-09-25' }));
    expect(result).toEqual([{ date: '2026-09-25', outcome: 'unknown' }]);
  });

  it('never counts paused, deferred or awaiting-approval days as misses', () => {
    const result = buildOpportunities(input({
      logs: [log('2026-09-22', 'pending_approval')],
      deferrals: [{ child_id: childId, activity_id: activityId, local_date: '2026-09-23' }],
      pausePeriods: [{ startedAt: '2026-09-21T00:00:00+07:00', endedAt: '2026-09-21T23:59:00+07:00' }],
    }));
    expect(result).toEqual([{ date: '2026-09-24', outcome: 'missed' }]);
  });

  it('treats a rejected log as a miss and ignores other children and habits', () => {
    const result = buildOpportunities(input({
      since: '2026-09-23',
      today: '2026-09-24',
      logs: [
        log('2026-09-23', 'rejected'),
        { ...log('2026-09-23', 'completed', 'other-child'), childId: 'someone-else' },
        { ...log('2026-09-23', 'completed', 'other-habit'), activityId: 'another' },
      ],
    }));
    expect(result).toEqual([{ date: '2026-09-23', outcome: 'missed' }]);
  });

  it('only creates opportunities on due days', () => {
    const result = buildOpportunities(input({
      recurrence: { recurrenceType: 'custom', recurrenceDays: [1, 3] },
      today: '2026-09-27',
    }));
    expect(result.map((entry) => entry.date)).toEqual(['2026-09-21', '2026-09-23']);
  });
});

describe('weekly opportunities', () => {
  it('gives one opportunity per calendar week and keeps the current week open', () => {
    const result = buildOpportunities(input({
      cadence: 'weekly',
      since: '2026-09-07',
      today: '2026-09-24',
      logs: [log('2026-09-09'), log('2026-09-10', 'completed', 'later')],
      supportByLogId: new Map<string, SupportLevel>([['later', 'alone']]),
    }));
    expect(result).toEqual([
      { date: '2026-09-07', outcome: 'alone' },
      { date: '2026-09-14', outcome: 'missed' },
    ]);
  });

  it('picks the same support level for a week with two verified logs whatever the array order', () => {
    const first = { ...log('2026-09-08', 'completed', 'first'), completedAt: '2026-09-08T08:00:00.000Z' };
    const second = { ...log('2026-09-10', 'completed', 'second'), completedAt: '2026-09-10T08:00:00.000Z' };
    const supportByLogId = new Map<string, SupportLevel>([['first', 'together'], ['second', 'alone']]);
    const base = { cadence: 'weekly' as const, since: '2026-09-07', today: '2026-09-15', supportByLogId };
    expect(buildOpportunities(input({ ...base, logs: [first, second] }))).toEqual([{ date: '2026-09-07', outcome: 'alone' }]);
    expect(buildOpportunities(input({ ...base, logs: [second, first] }))).toEqual([{ date: '2026-09-07', outcome: 'alone' }]);
  });

  it('does not count a deferred week as missed, but a done week still counts', () => {
    const deferrals = [{ child_id: childId, activity_id: activityId, local_date: '2026-09-09' }];
    const base = { cadence: 'weekly' as const, since: '2026-09-07', today: '2026-09-24', deferrals };
    expect(buildOpportunities(input({ ...base }))).toEqual([{ date: '2026-09-14', outcome: 'missed' }]);
    expect(buildOpportunities(input({ ...base, logs: [log('2026-09-10')] }))).toEqual([
      { date: '2026-09-07', outcome: 'unknown' },
      { date: '2026-09-14', outcome: 'missed' },
    ]);
  });

  it('skips a week that was fully paused', () => {
    const result = buildOpportunities(input({
      cadence: 'weekly',
      since: '2026-09-07',
      today: '2026-09-24',
      pausePeriods: [{ startedAt: '2026-09-07T00:00:00+07:00', endedAt: '2026-09-14T00:00:00+07:00' }],
    }));
    expect(result).toEqual([{ date: '2026-09-14', outcome: 'missed' }]);
  });
});
