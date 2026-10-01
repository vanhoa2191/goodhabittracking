import { describe, expect, it } from 'vitest';
import { kidPraise } from '@/lib/i18n/kid-praise-copy';
import type { Language } from '@/types';

const languages: Language[] = ['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'it', 'es'];

describe('kidPraise', () => {
  it.each(languages)('has a praise line with the stars in %s', (language) => {
    const line = kidPraise(language, { points: 20, waitsForParent: false, seed: 'activity-1' });
    expect(line.length).toBeGreaterThan(4);
    expect(line).toContain('20');
  });

  it('tells the child a parent will check when approval is needed, without promising stars', () => {
    const line = kidPraise('vi', { points: 20, waitsForParent: true, seed: 'a' });
    expect(line).toContain('ba mẹ');
    expect(line).not.toContain('20');
  });

  it('leaves out the stars for a task worth nothing', () => {
    expect(kidPraise('en', { points: 0, waitsForParent: false, seed: 'a' })).not.toMatch(/\+/);
  });

  it('keeps the same line for the same task and can differ between tasks', () => {
    const first = kidPraise('vi', { points: 5, waitsForParent: false, seed: 'task-a' });
    expect(kidPraise('vi', { points: 5, waitsForParent: false, seed: 'task-a' })).toBe(first);
    const lines = new Set(['a', 'b', 'c', 'd', 'e'].map((seed) => kidPraise('vi', { points: 5, waitsForParent: false, seed })));
    expect(lines.size).toBeGreaterThan(1);
  });
});
