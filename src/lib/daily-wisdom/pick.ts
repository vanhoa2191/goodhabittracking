export type WisdomKind = 'tn' | 'cd' | 'dn' | 'ch';

export type WisdomQuote = {
  /** tn = tục ngữ, cd = ca dao, dn = danh ngôn (always with an author), ch = câu nói hay. */
  readonly k: WisdomKind;
  readonly t: string;
  readonly a?: string;
  /** Calendar months (1-12) the saying fits; absent means any month. */
  readonly m?: readonly number[];
};

export type HistoryEvent = { readonly y: number; readonly t: string };
export type HistoryByDay = Readonly<Record<string, readonly HistoryEvent[]>>;

export const WISDOM_KIND_LABEL: Readonly<Record<WisdomKind, string>> = {
  tn: 'Tục ngữ',
  cd: 'Ca dao',
  dn: 'Danh ngôn',
  ch: 'Câu nói hay',
};

const LOCAL_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDay(localDay: string): { year: number; month: number; day: number; epochDay: number } | null {
  const match = LOCAL_DAY.exec(localDay);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day, epochDay: Math.floor(time / 86_400_000) };
}

/**
 * One saying per day, the same for everyone. Sayings tied to a month or season are only offered in that month, so a
 * March proverb never appears in September. The pick walks the eligible list in order, so it does not repeat until the
 * whole list has been used.
 */
export function pickQuote(quotes: readonly WisdomQuote[], localDay: string): WisdomQuote | null {
  const parsed = parseLocalDay(localDay);
  if (!parsed || quotes.length === 0) return null;
  const eligible = quotes.filter((quote) => !quote.m || quote.m.length === 0 || quote.m.includes(parsed.month));
  if (eligible.length === 0) return null;
  return eligible[parsed.epochDay % eligible.length] ?? null;
}

/** "Ngày này năm xưa": an event that happened on this calendar day (29 February only exists in leap years). */
export function pickHistory(history: HistoryByDay, localDay: string): HistoryEvent | null {
  const parsed = parseLocalDay(localDay);
  if (!parsed) return null;
  const key = `${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
  const events = history[key];
  if (!events || events.length === 0) return null;
  return events[parsed.year % events.length] ?? null;
}
