import { describe, expect, it } from 'vitest';
import quotesJson from '../../content/daily-wisdom/quotes-vi.json';
import historyJson from '../../content/daily-wisdom/history-vi.json';
import { parseLocalDay, pickHistory, pickQuote, type HistoryByDay, type WisdomQuote } from '@/lib/daily-wisdom/pick';

const quotes = quotesJson as unknown as readonly WisdomQuote[];
const history = historyJson as unknown as HistoryByDay;

const MONTH_NAMES: ReadonlyArray<readonly [RegExp, number]> = [
  [/tháng (giêng|một)\b/i, 1], [/tháng hai\b/i, 2], [/tháng ba\b/i, 3], [/tháng tư\b/i, 4], [/tháng năm\b/i, 5],
  [/tháng sáu\b/i, 6], [/tháng bảy\b/i, 7], [/tháng tám\b/i, 8], [/tháng chín\b/i, 9], [/tháng mười\b(?! (một|hai))/i, 10],
  [/tháng mười một\b/i, 11], [/tháng (chạp|mười hai)\b/i, 12],
];

function daysOfYear(year: number): string[] {
  const days: string[] = [];
  for (let time = Date.UTC(year, 0, 1); new Date(time).getUTCFullYear() === year; time += 86_400_000) {
    days.push(new Date(time).toISOString().slice(0, 10));
  }
  return days;
}

describe('daily wisdom data', () => {
  it('has a large, valid, duplicate-free collection', () => {
    expect(quotes.length).toBeGreaterThanOrEqual(500);
    const texts = new Set(quotes.map((quote) => quote.t.toLowerCase()));
    expect(texts.size).toBe(quotes.length);
    for (const quote of quotes) {
      expect(['tn', 'cd', 'dn', 'ch']).toContain(quote.k);
      expect(quote.t.length).toBeGreaterThan(7);
      if (quote.k === 'dn') expect(quote.a, quote.t).toBeTruthy();
      for (const month of quote.m ?? []) expect(month >= 1 && month <= 12 && Number.isInteger(month)).toBe(true);
    }
  });

  it('tags every saying that names a month, so it only appears in that month', () => {
    for (const quote of quotes) {
      for (const [pattern, month] of MONTH_NAMES) {
        if (pattern.test(quote.t)) {
          expect(quote.m, `"${quote.t}" names month ${month} but has no month tag`).toBeDefined();
          expect(quote.m, `"${quote.t}" must be offered in month ${month}`).toContain(month);
        }
      }
    }
  });

  it('keeps Tết sayings to the winter-spring months and summer sayings away from winter', () => {
    for (const quote of quotes) {
      if (/\bTết\b/.test(quote.t) && !/Trung thu/i.test(quote.t)) {
        expect(quote.m, `"${quote.t}" mentions Tết`).toBeDefined();
        expect(quote.m!.every((month) => [11, 12, 1, 2, 3].includes(month)), quote.t).toBe(true);
      }
      if (/mùa hè|nghỉ hè/i.test(quote.t)) {
        expect(quote.m, quote.t).toBeDefined();
        expect(quote.m!.every((month) => month >= 5 && month <= 8), quote.t).toBe(true);
      }
    }
  });

  it('every month has enough sayings to avoid repeats within a month', () => {
    for (let month = 1; month <= 12; month += 1) {
      const eligible = quotes.filter((quote) => !quote.m || quote.m.includes(month));
      expect(eligible.length).toBeGreaterThanOrEqual(31);
    }
  });
});

describe('pickQuote', () => {
  it('is deterministic and never offers a saying outside its months', () => {
    for (const day of daysOfYear(2026)) {
      const first = pickQuote(quotes, day);
      expect(first).not.toBeNull();
      expect(pickQuote(quotes, day)).toBe(first);
      const month = parseLocalDay(day)!.month;
      if (first!.m && first!.m.length > 0) expect(first!.m).toContain(month);
    }
  });

  it('does not repeat a saying within a month and rejects bad days', () => {
    for (let month = 1; month <= 12; month += 1) {
      const days = daysOfYear(2026).filter((day) => parseLocalDay(day)!.month === month);
      const picked = days.map((day) => pickQuote(quotes, day)!.t);
      expect(new Set(picked).size).toBe(picked.length);
    }
    expect(pickQuote(quotes, 'not-a-day')).toBeNull();
    expect(pickQuote(quotes, '2026-02-30')).toBeNull();
    expect(pickQuote([], '2026-03-01')).toBeNull();
  });
});

describe('pickHistory', () => {
  it('returns an event for the same calendar day and nothing for invalid days', () => {
    const sample: HistoryByDay = { '09-02': [{ y: 1945, t: 'a' }, { y: 1946, t: 'b' }], '02-29': [{ y: 1904, t: 'c' }] };
    expect(pickHistory(sample, '2026-09-02')).toEqual({ y: 1945, t: 'a' });
    expect(pickHistory(sample, '2027-09-02')).toEqual({ y: 1946, t: 'b' });
    expect(pickHistory(sample, '2028-02-29')).toEqual({ y: 1904, t: 'c' });
    expect(pickHistory(sample, '2026-03-03')).toBeNull();
    expect(pickHistory(sample, '2026-13-01')).toBeNull();
  });

  it('covers every calendar day with a short event', () => {
    for (const day of daysOfYear(2028)) {
      const event = pickHistory(history, day);
      expect(event, `no event for ${day}`).not.toBeNull();
      expect(event!.t.length).toBeGreaterThan(15);
      expect(event!.t.length).toBeLessThan(260);
      expect(event!.y).toBeGreaterThan(0);
    }
  });
});
