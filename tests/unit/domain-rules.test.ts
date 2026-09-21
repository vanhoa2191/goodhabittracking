import { describe, expect, it } from 'vitest';
import { activityMutationSchema } from '@/lib/domain/activity-mutations';
import { domainCommandSchema, ACTIVITY_LOG_TRANSITIONS, REDEMPTION_TRANSITIONS } from '@/lib/domain/commands';
import { getLocalDateKey, isConsecutiveDate } from '@/lib/domain/local-date';
import { mapHabitActivityRow } from '@/lib/supabase/mappers';

describe('authoritative domain rules', () => {
  it('uses the family timezone rather than UTC for date-only commands', () => {
    const instant = new Date('2026-09-18T18:30:00.000Z');
    expect(getLocalDateKey(instant, 'Asia/Ho_Chi_Minh')).toBe('2026-09-19');
    expect(getLocalDateKey(instant, 'America/Los_Angeles')).toBe('2026-09-18');
  });

  it('detects consecutive dates across month boundaries', () => {
    expect(isConsecutiveDate('2026-02-28', '2026-03-01')).toBe(true);
    expect(isConsecutiveDate('2026-03-01', '2026-03-03')).toBe(false);
  });

  it('rejects malformed and client-extended commands', () => {
    expect(domainCommandSchema.safeParse({
      type: 'completeHabit',
      activityId: crypto.randomUUID(),
      childId: crypto.randomUUID(),
      date: '2026-09-19',
      commandId: crypto.randomUUID(),
      points: 999999,
    }).success).toBe(false);
    expect(domainCommandSchema.safeParse({ type: 'reviewHabit', logId: 'bad', decision: 'approve' }).success).toBe(false);
  });

  it('allows only the documented terminal transitions', () => {
    expect(ACTIVITY_LOG_TRANSITIONS.pending_approval).toEqual(['approved', 'rejected']);
    expect(ACTIVITY_LOG_TRANSITIONS.approved).toEqual([]);
    expect(REDEMPTION_TRANSITIONS.pending).toEqual(['approved', 'rejected']);
    expect(REDEMPTION_TRANSITIONS.delivered).toEqual([]);
  });

  it('normalizes blank task instructions while preserving meaningful guidance', () => {
    // Given
    const activity = {
      id: '11111111-1111-4111-8111-111111111111',
      childId: null,
      title: 'Đọc sách',
      description: 'Nuôi dưỡng tình yêu đọc sách',
      icon: '📚',
      category: 'study',
      points: 20,
      recurrenceType: 'daily',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: 'evening',
      durationMinutes: 15,
      requiresApproval: false,
      isActive: true,
      createdAt: '2026-09-20T00:00:00.000Z',
    };

    // When
    const blank = activityMutationSchema.parse({
      type: 'create',
      activity: { ...activity, instructions: '   ' },
    });
    const guided = activityMutationSchema.parse({
      type: 'create',
      activity: { ...activity, instructions: '  Đọc chậm 15 phút.  ' },
    });

    // Then
    expect(blank.type === 'create' ? blank.activity.instructions : 'wrong mutation').toBeUndefined();
    expect(guided.type === 'create' ? guided.activity.instructions : 'wrong mutation')
      .toBe('Đọc chậm 15 phút.');
  });

  it('maps nullable cloud instructions into the optional activity field', () => {
    // Given
    const row = {
      id: '11111111-1111-4111-8111-111111111111',
      user_id: null,
      family_id: '22222222-2222-4222-8222-222222222222',
      child_id: null,
      title: 'Đọc sách',
      description: 'Nuôi dưỡng tình yêu đọc sách',
      instructions: 'Chọn một cuốn sách và đọc chậm 15 phút.',
      icon: '📚',
      category: 'study',
      points: 20,
      recurrence_type: 'daily',
      recurrence_days: [0, 1, 2, 3, 4, 5, 6],
      time_of_day: 'evening',
      duration_minutes: 15,
      requires_approval: false,
      is_active: true,
      target_age_stage: 'all',
      is_parent_role: false,
      portrait16_key: null,
      bo_thi7_key: null,
      created_at: '2026-09-20T00:00:00.000Z',
    };

    // When
    const activity = mapHabitActivityRow(row);

    // Then
    expect(activity.instructions).toBe('Chọn một cuốn sách và đọc chậm 15 phút.');
  });
});
