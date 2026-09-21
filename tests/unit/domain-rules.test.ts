import { describe, expect, it } from 'vitest';
import { domainCommandSchema, ACTIVITY_LOG_TRANSITIONS, REDEMPTION_TRANSITIONS } from '@/lib/domain/commands';
import { getLocalDateKey, isConsecutiveDate } from '@/lib/domain/local-date';

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
});
