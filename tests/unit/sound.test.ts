import { describe, expect, it } from 'vitest';
import { soundGainForLocalTime } from '@/lib/sound';

describe('sound volume by local time', () => {
  it('keeps normal volume from 07:00 until 19:59', () => {
    expect(soundGainForLocalTime(0.2, new Date(2026, 8, 23, 7, 0))).toBe(0.2);
    expect(soundGainForLocalTime(0.2, new Date(2026, 8, 23, 19, 59))).toBe(0.2);
  });

  it('halves volume from 20:00 through 06:59', () => {
    expect(soundGainForLocalTime(0.2, new Date(2026, 8, 23, 20, 0))).toBe(0.1);
    expect(soundGainForLocalTime(0.2, new Date(2026, 8, 24, 6, 59))).toBe(0.1);
  });
});
