import { describe, expect, it } from 'vitest';
import { canStepKidDay, clampKidDay, isEditableDay, kidDayWindow, parseDayKey, shiftDayKey } from '@/lib/kid-day-window';

describe('kid day window', () => {
  const today = '2026-10-03';

  it('reaches back seven days and never past today', () => {
    expect(kidDayWindow(today)).toEqual({ earliest: '2026-09-26', latest: '2026-10-03' });
  });

  it('keeps today and the seventh day back as they are', () => {
    expect(clampKidDay('2026-10-03', today)).toBe('2026-10-03');
    expect(clampKidDay('2026-09-26', today)).toBe('2026-09-26');
  });

  it('pulls the eighth day back and tomorrow into the window', () => {
    expect(clampKidDay('2026-09-25', today)).toBe('2026-09-26');
    expect(clampKidDay('2026-10-04', today)).toBe('2026-10-03');
  });

  it('allows stepping back until the seventh day and forward until today', () => {
    expect(canStepKidDay('2026-10-03', today, -1)).toBe(true);
    expect(canStepKidDay('2026-09-27', today, -1)).toBe(true);
    expect(canStepKidDay('2026-09-26', today, -1)).toBe(false);
    expect(canStepKidDay('2026-10-03', today, 1)).toBe(false);
    expect(canStepKidDay('2026-10-02', today, 1)).toBe(true);
  });

  it('lets only today be changed', () => {
    expect(isEditableDay('2026-10-03', today)).toBe(true);
    expect(isEditableDay('2026-10-02', today)).toBe(false);
    expect(isEditableDay('2026-09-26', today)).toBe(false);
    expect(isEditableDay('2026-10-04', today)).toBe(false);
  });

  it('counts across a month change', () => {
    expect(kidDayWindow('2026-10-03').earliest).toBe('2026-09-26');
    expect(kidDayWindow('2026-03-03').earliest).toBe('2026-02-24');
    expect(shiftDayKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(clampKidDay('2026-02-23', '2026-03-03')).toBe('2026-02-24');
  });

  it('counts across a year change and a leap day', () => {
    expect(kidDayWindow('2027-01-03')).toEqual({ earliest: '2026-12-27', latest: '2027-01-03' });
    expect(shiftDayKey('2028-03-01', -1)).toBe('2028-02-29');
    expect(shiftDayKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('reads a day key back as that calendar day', () => {
    const date = parseDayKey('2026-10-03');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 3]);
  });
});
