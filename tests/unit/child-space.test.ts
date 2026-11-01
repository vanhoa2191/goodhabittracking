import { describe, expect, it } from 'vitest';
import { evaluateMoodAlert, normalizeSpaceNote, type SpaceMood } from '@/lib/child-space';

const days = (today: string, moods: Array<SpaceMood | null>) => moods.flatMap((mood, index) => {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (moods.length - 1 - index));
  return mood ? [{ local_date: date.toISOString().slice(0, 10), mood }] : [];
});

describe('mood alert', () => {
  const today = '2026-11-02';
  it('stays quiet for ordinary variation', () => {
    expect(evaluateMoodAlert(days(today, ['sad', 'happy', 'sad', 'calm', 'sad']), today).level).toBe('none');
    expect(evaluateMoodAlert([], today).level).toBe('none');
  });
  it('watches after three low days in a row, counting worried, sad and angry', () => {
    expect(evaluateMoodAlert(days(today, ['happy', 'sad', 'worried', 'angry']), today)).toMatchObject({ level: 'watch', streak: 3 });
  });
  it('does not count tiredness alone', () => {
    expect(evaluateMoodAlert(days(today, ['tired', 'tired', 'tired', 'tired']), today).level).toBe('none');
  });
  it('keeps the streak alive when today has no check-in yet', () => {
    expect(evaluateMoodAlert(days(today, ['sad', 'sad', 'sad', null]), today)).toMatchObject({ level: 'watch', streak: 3 });
  });
  it('raises concern after five in a row or five of the last seven', () => {
    expect(evaluateMoodAlert(days(today, ['sad', 'sad', 'sad', 'sad', 'sad']), today).level).toBe('concern');
    expect(evaluateMoodAlert(days(today, ['sad', 'happy', 'sad', 'sad', 'happy', 'sad', 'sad']), today).level).toBe('concern');
  });
  it('a missed day breaks the streak', () => {
    expect(evaluateMoodAlert(days(today, ['sad', 'sad', null, 'sad', 'sad']), today)).toMatchObject({ level: 'none', streak: 2 });
  });
});

describe('space notes', () => {
  it('collapses whitespace and rejects empty or over-long text', () => {
    expect(normalizeSpaceNote('  con   học\nđược  ')).toBe('con học được');
    expect(normalizeSpaceNote('   ')).toBeNull();
    expect(normalizeSpaceNote('a'.repeat(141))).toBeNull();
    expect(normalizeSpaceNote('a'.repeat(140))).not.toBeNull();
  });
});
