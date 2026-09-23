import { describe, expect, it } from 'vitest';
import { dailyLetterFor, letterFromTemplateKey, localDateKey } from '@/lib/daily-mascot-letter';

describe('daily mascot letter', () => {
  it('waits until 07:00 local time before showing a letter', () => {
    expect(dailyLetterFor('mascot:leo', 'vi', 'An', new Date(2026, 8, 23, 6, 59))).toBeNull();
    expect(dailyLetterFor('mascot:leo', 'vi', 'An', new Date(2026, 8, 23, 7, 0))?.date).toBe('2026-09-23');
  });

  it('keeps a stable template throughout the local day and changes it on another day', () => {
    const morning = dailyLetterFor('mascot:bunny', 'vi', 'An', new Date(2026, 8, 23, 7, 0));
    const evening = dailyLetterFor('🐰', 'vi', 'An', new Date(2026, 8, 23, 23, 59));
    const nextDay = dailyLetterFor('mascot:bunny', 'vi', 'An', new Date(2026, 8, 24, 7, 0));
    expect(morning?.templateKey).toBe(evening?.templateKey);
    expect(nextDay?.templateKey).not.toBe(morning?.templateKey);
    expect(localDateKey(new Date(2026, 8, 24, 0, 1))).toBe('2026-09-24');
  });

  it('provides a three-sentence personality letter in Vietnamese with English fallback', () => {
    const date = new Date(2026, 8, 23, 8, 0);
    const vietnamese = dailyLetterFor('mascot:turtle', 'vi', 'An', date);
    const fallback = dailyLetterFor('mascot:turtle', 'fr', 'An', date);
    expect(vietnamese?.text).toContain('An');
    expect(vietnamese?.text.split(/[.!?] /).length).toBe(3);
    expect(fallback?.text).toMatch(/^Hi An,/);
    expect(fallback?.text.split(/[.!?] /).length).toBe(3);
  });

  it('keeps the stored personality even after the selected mascot changes', () => {
    const date = new Date(2026, 8, 23, 8, 0);
    const letter = letterFromTemplateKey('fox_1', 'vi', 'An', date);
    expect(letter?.text).toContain('Fox');
    expect(letterFromTemplateKey('dragon_1', 'vi', 'An', date)).toBeNull();
  });
});
