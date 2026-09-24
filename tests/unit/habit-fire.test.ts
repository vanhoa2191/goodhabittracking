import { describe, expect, it } from 'vitest';
import { habitFireForChild } from '@/lib/habit-fire';
import type { ActivityLog } from '@/types';

const childId = '11111111-1111-4111-8111-111111111111';

function log(date: string, status: ActivityLog['status'], id = date): ActivityLog {
  return {
    id,
    activityId: '22222222-2222-4222-8222-222222222222',
    childId,
    date,
    status,
    pointsAwarded: 10,
    completedAt: `${date}T08:00:00.000Z`,
  };
}

describe('habit fire', () => {
  it('counts distinct consecutive verified days ending today', () => {
    expect(habitFireForChild([
      log('2026-09-23', 'completed'),
      log('2026-09-23', 'approved', 'second'),
      log('2026-09-22', 'approved'),
      log('2026-09-21', 'completed'),
      log('2026-09-19', 'completed'),
    ], childId, '2026-09-23')).toEqual({ kind: 'active', days: 3, pendingToday: false });
  });

  it('keeps yesterday alive without claiming today was completed', () => {
    expect(habitFireForChild([
      log('2026-09-22', 'approved'),
      log('2026-09-21', 'completed'),
      log('2026-09-23', 'pending_approval'),
    ], childId, '2026-09-23')).toEqual({ kind: 'resting', days: 2, pendingToday: true });
  });

  it('does not count pending, rejected, another child, or a broken streak', () => {
    expect(habitFireForChild([
      log('2026-09-23', 'pending_approval'),
      log('2026-09-22', 'rejected'),
      { ...log('2026-09-22', 'completed', 'other'), childId: '33333333-3333-4333-8333-333333333333' },
      log('2026-09-20', 'completed'),
    ], childId, '2026-09-23')).toEqual({ kind: 'cold', days: 0, pendingToday: true });
  });

  it('crosses month and leap-day boundaries', () => {
    expect(habitFireForChild([
      log('2024-02-29', 'approved'),
      log('2024-02-28', 'completed'),
    ], childId, '2024-03-01')).toEqual({ kind: 'resting', days: 2, pendingToday: false });
  });

  it('keeps verified days connected across a family break without counting break days', () => {
    expect(habitFireForChild([
      log('2026-09-20', 'approved'),
      log('2026-09-19', 'completed'),
    ], childId, '2026-09-24', [
      { startedAt: '2026-09-21T00:00:00.000Z', endedAt: '2026-09-23T23:59:59.000Z' },
    ])).toEqual({ kind: 'resting', days: 2, pendingToday: false });
  });
});
