import { describe, expect, it } from 'vitest';
import { activityMutationSchema } from '@/lib/domain/activity-mutations';
import { mapHabitActivityRow } from '@/lib/supabase/mappers';

const id = '11111111-1111-4111-8111-111111111111';

describe('graduation fields of an activity', () => {
  it('accepts setting a habit aside with a day to ask again, and bringing it back', () => {
    const away = activityMutationSchema.safeParse({
      type: 'update', activityId: id,
      updates: { isActive: false, graduatedAt: '2026-10-04T08:00:00.000Z', graduationCheckDue: '2026-11-03' },
    });
    expect(away.success).toBe(true);
    const back = activityMutationSchema.safeParse({
      type: 'update', activityId: id,
      updates: { isActive: true, graduatedAt: null, graduationCheckDue: null },
    });
    expect(back.success).toBe(true);
  });

  it('accepts stepping the stars down and restoring them, and nothing outside the range', () => {
    expect(activityMutationSchema.safeParse({ type: 'update', activityId: id, updates: { points: 10, basePoints: 20 } }).success).toBe(true);
    expect(activityMutationSchema.safeParse({ type: 'update', activityId: id, updates: { points: 20, basePoints: null } }).success).toBe(true);
    expect(activityMutationSchema.safeParse({ type: 'update', activityId: id, updates: { basePoints: 0 } }).success).toBe(false);
    expect(activityMutationSchema.safeParse({ type: 'update', activityId: id, updates: { graduationCheckDue: 'tomorrow' } }).success).toBe(false);
  });

  it('does not let a new activity be created already graduated', () => {
    const created = activityMutationSchema.safeParse({
      type: 'create',
      activity: {
        id, createdAt: '2026-10-04T08:00:00.000Z', childId: null, title: 'Đọc sách', icon: '📚', category: 'study', points: 10,
        recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6], timeOfDay: 'anytime', requiresApproval: false, isActive: true,
        graduatedAt: '2026-10-04T08:00:00.000Z',
      },
    });
    expect(created.success).toBe(false);
  });

  it('reads the columns from a row, and treats missing ones as not graduated', () => {
    const base = {
      id, family_id: id, child_id: null, title: 'Đọc sách', icon: '📚', category: 'study', points: 10,
      recurrence_type: 'daily', recurrence_days: [0, 1, 2, 3, 4, 5, 6], time_of_day: 'anytime', requires_approval: false,
      is_active: false, created_at: '2026-10-04T08:00:00.000Z',
    };
    expect(mapHabitActivityRow(base)).toMatchObject({ graduatedAt: null, graduationCheckDue: null, basePoints: null });
    expect(mapHabitActivityRow({ ...base, graduated_at: '2026-10-04T08:00:00+00:00', graduation_check_due: '2026-11-03', base_points: 20 }))
      .toMatchObject({ graduatedAt: '2026-10-04T08:00:00+00:00', graduationCheckDue: '2026-11-03', basePoints: 20 });
  });
});
