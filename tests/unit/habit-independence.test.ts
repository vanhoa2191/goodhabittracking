import { describe, expect, it } from 'vitest';
import { competenceMilestones, freshMilestone } from '@/lib/habit-programs/competence';
import { isGraduationCheckDue, isReadyToGraduate, nextGraduationCheck } from '@/lib/habit-programs/graduation';
import type { PhaseEvaluation } from '@/lib/habit-programs/phase';
import { weekRhythm } from '@/lib/habit-programs/rhythm';
import { habitStatus } from '@/lib/habit-programs/status';
import { supportTrend, supportTrendVerdict } from '@/lib/habit-programs/support-trend';
import { addDays } from '@/lib/habit-programs/opportunities';
import type { Opportunity, OpportunityOutcome } from '@/lib/habit-programs/types';

const evaluation = (overrides: Partial<PhaseEvaluation> = {}): PhaseEvaluation => ({
  phase: 'build', windowSize: 10, opportunitiesInPhase: 4, enteredOn: '2026-09-01', completedInWindow: 8,
  aloneInWindow: 2, promptedInWindow: 4, unknownInWindow: 2, missedInLastFive: 0, consecutiveMissed: 0, ...overrides,
});

const days = (start: string, outcomes: readonly OpportunityOutcome[]): Opportunity[] => (
  outcomes.map((outcome, index) => ({ date: addDays(start, index), outcome }))
);

describe('habitStatus', () => {
  it('is not started without a cue plan', () => {
    expect(habitStatus({ hasCuePlan: false, evaluation: null, suggestionCodes: [] })).toBe('not-started');
  });

  it.each(['stuck-building', 'check-in', 'step-back', 'prompt-reliance'] as const)('needs help when %s is suggested', (code) => {
    expect(habitStatus({ hasCuePlan: true, evaluation: evaluation(), suggestionCodes: [code] })).toBe('needs-help');
  });

  it('is steady once easing off with at least 70% of the recent chances done', () => {
    expect(habitStatus({ hasCuePlan: true, evaluation: evaluation({ phase: 'fade', completedInWindow: 7 }), suggestionCodes: [] })).toBe('steady');
    expect(habitStatus({ hasCuePlan: true, evaluation: evaluation({ phase: 'maintain', completedInWindow: 10 }), suggestionCodes: ['record-support'] })).toBe('steady');
    expect(habitStatus({ hasCuePlan: true, evaluation: evaluation({ phase: 'fade', completedInWindow: 6 }), suggestionCodes: [] })).toBe('forming');
  });

  it('is forming while anchoring or building', () => {
    expect(habitStatus({ hasCuePlan: true, evaluation: evaluation({ phase: 'anchor' }), suggestionCodes: [] })).toBe('forming');
    expect(habitStatus({ hasCuePlan: true, evaluation: evaluation({ phase: 'build', completedInWindow: 10 }), suggestionCodes: [] })).toBe('forming');
  });
});

describe('supportTrend', () => {
  // 2026-09-07 is a Monday.
  const today = '2026-10-04'; // a Sunday, so the current week started on 2026-09-28

  it('counts each week, oldest first, and leaves out weeks with nothing', () => {
    const opportunities = [
      ...days('2026-09-07', ['prompted', 'together']),
      ...days('2026-09-21', ['alone', 'missed']),
    ];
    const buckets = supportTrend(opportunities, today);
    expect(buckets.map((bucket) => [bucket.weekStart, bucket.total])).toEqual([['2026-09-07', 2], ['2026-09-21', 2]]);
    expect(buckets[0]).toMatchObject({ prompted: 1, together: 1 });
    expect(buckets[1]).toMatchObject({ alone: 1, missed: 1 });
  });

  it('ignores chances older than the weeks asked for', () => {
    const buckets = supportTrend(days('2026-08-03', ['alone']), today, 6);
    expect(buckets).toEqual([]);
  });

  it('says easing when the alone share rose by 20 points over three full weeks without a gap', () => {
    const opportunities = [
      ...days('2026-09-07', ['prompted', 'prompted', 'alone', 'together']),
      ...days('2026-09-14', ['prompted', 'alone', 'alone', 'together']),
      ...days('2026-09-21', ['alone', 'alone', 'alone', 'prompted']),
    ];
    expect(supportTrendVerdict(supportTrend(opportunities, today), today)).toBe('easing');
  });

  it('does not say easing with fewer than three full weeks', () => {
    const opportunities = [
      ...days('2026-09-14', ['prompted', 'prompted', 'prompted']),
      ...days('2026-09-21', ['alone', 'alone', 'alone']),
    ];
    expect(supportTrendVerdict(supportTrend(opportunities, today), today)).toBe('not-enough-data');
  });

  it('does not say easing across an empty week', () => {
    const opportunities = [
      ...days('2026-09-07', ['prompted', 'prompted', 'prompted']),
      ...days('2026-09-14', ['alone']).slice(0, 0),
      ...days('2026-09-21', ['alone', 'alone', 'alone']),
      ...days('2026-09-28', ['alone']),
    ];
    expect(supportTrendVerdict(supportTrend(opportunities, today), today)).toBe('not-enough-data');
  });

  it('does not say easing when the rise is under 20 points or support was rarely recorded', () => {
    const flat = [
      ...days('2026-09-07', ['alone', 'prompted', 'alone', 'prompted']),
      ...days('2026-09-14', ['alone', 'prompted', 'alone', 'prompted']),
      ...days('2026-09-21', ['alone', 'alone', 'alone', 'prompted']),
    ];
    // 50% to 75% is a rise of 25 points (easing); 40% to 50% is a rise of 10 points.
    const small = [
      ...days('2026-09-07', ['alone', 'prompted', 'alone', 'prompted', 'prompted']),
      ...days('2026-09-14', ['alone', 'prompted', 'alone', 'prompted']),
      ...days('2026-09-21', ['alone', 'alone', 'alone', 'prompted', 'prompted', 'prompted']),
    ];
    expect(supportTrendVerdict(supportTrend(flat, today), today)).toBe('easing');
    expect(supportTrendVerdict(supportTrend(small, today), today)).toBe('not-enough-data');
    const unrecorded = [
      ...days('2026-09-07', ['unknown', 'unknown', 'alone']),
      ...days('2026-09-14', ['unknown', 'alone']),
      ...days('2026-09-21', ['alone', 'alone', 'alone']),
    ];
    expect(supportTrendVerdict(supportTrend(unrecorded, today), today)).toBe('not-enough-data');
  });

  it('leaves out the current partial week when judging', () => {
    const opportunities = [
      ...days('2026-09-07', ['prompted', 'prompted']),
      ...days('2026-09-14', ['prompted', 'alone']),
      ...days('2026-09-28', ['alone', 'alone']),
    ];
    expect(supportTrendVerdict(supportTrend(opportunities, today), today)).toBe('not-enough-data');
  });
});

describe('isReadyToGraduate', () => {
  const alone = (count: number): Opportunity[] => days('2026-09-10', Array.from({ length: count }, () => 'alone' as const));
  const base = { evaluation: evaluation({ phase: 'maintain', enteredOn: '2026-09-01' }), opportunities: alone(10), today: '2026-09-25', alreadyGraduated: false };

  it('is ready after three settled weeks with 8 of the last 10 done alone', () => {
    expect(isReadyToGraduate(base)).toBe(true);
    const eight = [...alone(10).slice(0, 8).map((entry) => entry), ...days('2026-09-18', ['prompted', 'together'])];
    expect(isReadyToGraduate({ ...base, opportunities: eight })).toBe(true);
  });

  it('is not ready with too few alone, too few chances, or a short stay', () => {
    expect(isReadyToGraduate({ ...base, opportunities: [...alone(7), ...days('2026-09-17', ['prompted', 'prompted', 'prompted'])] })).toBe(false);
    expect(isReadyToGraduate({ ...base, opportunities: alone(9) })).toBe(false);
    expect(isReadyToGraduate({ ...base, today: '2026-09-21' })).toBe(false);
    expect(isReadyToGraduate({ ...base, today: '2026-09-22' })).toBe(true);
  });

  it('is not ready outside the settled phase or once graduated', () => {
    expect(isReadyToGraduate({ ...base, evaluation: evaluation({ phase: 'fade', enteredOn: '2026-09-01' }) })).toBe(false);
    expect(isReadyToGraduate({ ...base, alreadyGraduated: true })).toBe(false);
    expect(isReadyToGraduate({ ...base, evaluation: evaluation({ phase: 'maintain', enteredOn: null }) })).toBe(false);
  });
});

describe('graduation check', () => {
  it('asks again after thirty days and when the day arrives', () => {
    expect(nextGraduationCheck('2026-10-04')).toBe('2026-11-03');
    expect(isGraduationCheckDue('2026-11-03', '2026-11-02')).toBe(false);
    expect(isGraduationCheckDue('2026-11-03', '2026-11-03')).toBe(true);
    expect(isGraduationCheckDue(null, '2026-11-03')).toBe(false);
  });
});

describe('weekRhythm', () => {
  const log = (date: string, status: 'completed' | 'approved' | 'pending_approval' | 'rejected', childId = 'c1') => ({ childId, date, status });

  it('counts the days with something done among the last seven', () => {
    const logs = [log('2026-10-04', 'completed'), log('2026-10-03', 'approved'), log('2026-10-01', 'pending_approval'), log('2026-09-30', 'rejected'), log('2026-10-02', 'completed', 'c2')];
    expect(weekRhythm(logs, 'c1', '2026-10-04', [])).toEqual({ daysDone: 3, daysCounted: 7 });
  });

  it('counts a day only once however many tasks were done', () => {
    const logs = [log('2026-10-04', 'completed'), log('2026-10-04', 'approved')];
    expect(weekRhythm(logs, 'c1', '2026-10-04', []).daysDone).toBe(1);
  });

  it('leaves out days the family paused', () => {
    const pause = [{ startedAt: '2026-10-01T00:00:00', endedAt: '2026-10-03T00:00:00' }] as never;
    expect(weekRhythm([], 'c1', '2026-10-04', pause).daysCounted).toBe(5);
  });
});

describe('competenceMilestones', () => {
  it('finds the first time and the third time a child did it alone', () => {
    const reached = competenceMilestones(days('2026-09-01', ['prompted', 'alone', 'together', 'alone', 'alone']));
    expect(reached).toEqual([
      { milestone: 'first-alone', reachedOn: '2026-09-02' },
      { milestone: 'three-alone', reachedOn: '2026-09-05' },
    ]);
  });

  it('finds seven alone in a row, and a prompt starts the run again', () => {
    const broken = competenceMilestones(days('2026-09-01', ['alone', 'alone', 'alone', 'prompted', 'alone', 'alone', 'alone', 'alone', 'alone', 'alone']));
    expect(broken.map((entry) => entry.milestone)).not.toContain('seven-in-a-row');
    const straight = competenceMilestones(days('2026-09-01', Array.from({ length: 7 }, () => 'alone' as const)));
    expect(straight.find((entry) => entry.milestone === 'seven-in-a-row')?.reachedOn).toBe('2026-09-07');
  });

  it('ends a run of alone at a chance whose way of doing it was not recorded', () => {
    const outcomes: OpportunityOutcome[] = ['alone', 'alone', 'alone', 'alone', 'alone', 'alone', 'unknown', 'alone'];
    expect(competenceMilestones(days('2026-09-01', outcomes)).map((entry) => entry.milestone)).not.toContain('seven-in-a-row');
  });

  it('does not count chances where the way of doing it was not recorded', () => {
    expect(competenceMilestones(days('2026-09-01', ['unknown', 'unknown', 'unknown']))).toEqual([]);
  });

  it('finds two weeks without a reminder only with enough chances over two weeks', () => {
    const fourteen = competenceMilestones(days('2026-09-01', Array.from({ length: 14 }, () => 'alone' as const)));
    expect(fourteen.map((entry) => entry.milestone)).toContain('two-weeks-unprompted');
    const few = competenceMilestones([{ date: '2026-09-01', outcome: 'alone' }, { date: '2026-09-14', outcome: 'alone' }]);
    expect(few.map((entry) => entry.milestone)).not.toContain('two-weeks-unprompted');
    const prompted = days('2026-09-01', Array.from({ length: 14 }, (_, index) => (index === 6 ? 'prompted' as const : 'alone' as const)));
    expect(competenceMilestones(prompted).map((entry) => entry.milestone)).not.toContain('two-weeks-unprompted');
  });
});

describe('freshMilestone', () => {
  it('returns the newest milestone reached today or yesterday, and nothing older', () => {
    const reached = [
      { milestone: 'first-alone' as const, reachedOn: '2026-09-20' },
      { milestone: 'three-alone' as const, reachedOn: '2026-10-03' },
      { milestone: 'seven-in-a-row' as const, reachedOn: '2026-10-04' },
    ];
    expect(freshMilestone(reached, '2026-10-04')?.milestone).toBe('seven-in-a-row');
    expect(freshMilestone(reached.slice(0, 2), '2026-10-04')?.milestone).toBe('three-alone');
    expect(freshMilestone(reached.slice(0, 1), '2026-10-04')).toBeNull();
  });
});
