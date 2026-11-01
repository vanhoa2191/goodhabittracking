import { describe, expect, it } from 'vitest';
import {
  buildMoodTimeline, evaluateMoodAlert, normalizeSpaceGoal, normalizeSpaceLetter, normalizeSpaceNote, spaceSnapshotSchema, weekStartOf,
  type SpaceMood,
} from '@/lib/child-space';

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

describe('phase 2: timeline, weekly goal, letter', () => {
  it('weeks start on Monday', () => {
    expect(weekStartOf('2026-11-02')).toBe('2026-11-02'); // Monday
    expect(weekStartOf('2026-11-08')).toBe('2026-11-02'); // Sunday
    expect(weekStartOf('2026-11-09')).toBe('2026-11-09');
  });
  it('lays out 30 days ending today, lined up under Monday-first weekdays', () => {
    const { leading, cells } = buildMoodTimeline([{ local_date: '2026-11-02', mood: 'happy' }], '2026-11-02', 30);
    expect(cells).toHaveLength(30);
    expect(cells[29]).toEqual({ day: '2026-11-02', mood: 'happy' });
    expect(cells[0]).toEqual({ day: '2026-10-04', mood: null }); // a Sunday
    expect(leading).toBe(6);
  });
  it('limits a goal to one short line of 60 characters', () => {
    expect(normalizeSpaceGoal('  Tự   dọn\nđồ chơi ')).toBe('Tự dọn đồ chơi');
    expect(normalizeSpaceGoal('a'.repeat(60))).not.toBeNull();
    expect(normalizeSpaceGoal('a'.repeat(61))).toBeNull();
    expect(normalizeSpaceGoal('  ')).toBeNull();
  });
  it('limits a letter to 300 characters and keeps its line breaks', () => {
    expect(normalizeSpaceLetter(' Ba mẹ ơi  \r\n\r\n\r\n\r\nCon yêu ba mẹ ')).toBe('Ba mẹ ơi\n\nCon yêu ba mẹ');
    expect(normalizeSpaceLetter('a'.repeat(300))).not.toBeNull();
    expect(normalizeSpaceLetter('a'.repeat(301))).toBeNull();
    expect(normalizeSpaceLetter('\n \n')).toBeNull();
  });
  it('still reads a phase-1 payload that has no goals or letters', () => {
    const parsed = spaceSnapshotSchema.parse({ moods: [], notes: [] });
    expect(parsed.goals).toEqual([]);
    expect(parsed.letters).toEqual([]);
  });
});
