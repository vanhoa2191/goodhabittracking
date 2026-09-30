import { describe, expect, it } from 'vitest';
import { localDayKey } from '@/lib/local-day';
import { localDayKey as habitFireDayKey } from '@/lib/habit-fire';
import { localDateKey } from '@/lib/daily-mascot-letter';

describe('local day key', () => {
  it('uses the device calendar day, not the UTC date', () => {
    const justAfterMidnight = new Date(2026, 8, 20, 0, 30);
    const lateEvening = new Date(2026, 8, 20, 23, 45);
    expect(localDayKey(justAfterMidnight)).toBe('2026-09-20');
    expect(localDayKey(lateEvening)).toBe('2026-09-20');
  });

  it('pads single-digit months and days', () => {
    expect(localDayKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
  });

  it('is the one implementation behind the older helpers', () => {
    const sample = new Date(2026, 10, 3, 9, 15);
    expect(habitFireDayKey(sample)).toBe(localDayKey(sample));
    expect(localDateKey(sample)).toBe(localDayKey(sample));
  });
});
