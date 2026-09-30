import { describe, expect, it } from 'vitest';
import { parseFunnelRows, parseRetention, summarizeFunnel } from '@/lib/admin/funnel';

describe('admin activation funnel', () => {
  const rows = parseFunnelRows([
    { cohort_day: '2026-09-29', families: '4', with_child: 3, with_paired_device: 2, with_first_completion: 2, with_trial: 1, with_payment: 0 },
    { cohort_day: '2026-09-28T00:00:00', families: 6, with_child: 5, with_paired_device: 3, with_first_completion: 2, with_trial: 2, with_payment: 1 },
  ]);

  it('reads counts from the database rows, including numeric strings', () => {
    expect(rows[0]).toEqual({
      cohortDay: '2026-09-29', families: 4, withChild: 3, withPairedDevice: 2, withFirstCompletion: 2, withTrial: 1, withPayment: 0,
    });
    expect(rows[1]!.cohortDay).toBe('2026-09-28');
  });

  it('adds the cohorts and gives each step its share of the sign-ups', () => {
    const steps = summarizeFunnel(rows);
    expect(steps.map((step) => step.count)).toEqual([10, 8, 5, 4, 3, 1]);
    expect(steps[0]!.share).toBe(1);
    expect(steps[1]!.share).toBeCloseTo(0.8);
    expect(steps[5]!.share).toBeCloseTo(0.1);
  });

  it('has no shares before anyone signs up', () => {
    expect(summarizeFunnel([]).every((step) => step.count === 0 && step.share === null)).toBe(true);
  });

  it('ignores anything that is not a count', () => {
    expect(parseFunnelRows('nope')).toEqual([]);
    expect(parseFunnelRows([{ cohort_day: '2026-09-01', families: -3, with_child: 'x' }])[0]).toMatchObject({ families: 0, withChild: 0 });
  });

  it('reads the retention snapshot whether it is a row or a list of rows', () => {
    const row = { families_total: 12, families_with_child: 9, active_last_7_days: 5, active_last_30_days: 8, paying_now: 2 };
    const expected = { familiesTotal: 12, familiesWithChild: 9, activeLast7Days: 5, activeLast30Days: 8, payingNow: 2 };
    expect(parseRetention([row])).toEqual(expected);
    expect(parseRetention(row)).toEqual(expected);
    expect(parseRetention(null).familiesTotal).toBe(0);
  });
});
