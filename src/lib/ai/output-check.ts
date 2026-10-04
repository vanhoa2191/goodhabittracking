import { BREAKDOWN_STEPS, STEP_MAX_CHARS, SUMMARY_MAX_CHARS } from './config';
import type { AgeBand } from './prompts';

export type BreakdownStep = { readonly text: string; readonly minutes: number };
export type Breakdown = { readonly steps: readonly BreakdownStep[] };
export type WeeklySummary = { readonly praise: string; readonly notice: string; readonly tryNext: string };

// Words that judge or label a child, name a condition, or promise a result, in Vietnamese and English.
const NEVER = [
  'lười', 'hư hỏng', 'hư đốn', 'ngu', 'dốt', 'chẩn đoán', 'bệnh', 'rối loạn', 'tăng động', 'tự kỷ', 'trầm cảm',
  'đảm bảo', 'chắc chắn', 'cam kết', 'bảo đảm',
  'lazy', 'naughty', 'bad child', 'stupid', 'diagnos', 'disorder', 'adhd', 'autis', 'depress', 'guarantee', 'definitely', 'proven',
];
const LEAKS = /(?:\bjson\b|system prompt|instruction|\bprompt\b|ignore (?:all|the|previous)|bỏ qua)/i;
const LINK_OR_CONTACT = /(?:https?:\/\/|www\.|\S+@\S+\.\S+|\d[\d\s().-]{6,}\d)/i;
const MARKUP = /[{}<>[\]`\\]/;
// Things a young child must not be told to do on their own, even as a "small step".
const RISKY_FOR_YOUNG = /(?:\bdao\b|\bkéo\b|\bbếp\b|\blửa\b|nước sôi|ổ điện|ổ cắm|cắm điện|\bđiện\b|\bknife\b|\bknives\b|\bscissors\b|\bstove\b|\bfire\b|boiling|\bsocket\b|\bplug\b|electric)/i;
// For the youngest children every step must be done with someone, so a step that sends them off alone is refused.
const ALONE = /(?:một mình|tự mình|\bby (?:yourself|themselves)\b|\bon (?:your|their) own\b|\balone\b)/i;
const WITH_ADULT = /(?:cùng|ba mẹ|bố mẹ|người lớn|\bmẹ\b|\bbố\b|\bba\b|\bwith\b|\btogether\b|\bparent|\badult|\bgrown-up)/i;

function fold(text: string): string {
  return text.normalize('NFC').toLowerCase();
}

function isClean(text: string): boolean {
  const lowered = fold(text);
  if (NEVER.some((word) => lowered.includes(word))) return false;
  return !LEAKS.test(text) && !LINK_OR_CONTACT.test(text) && !MARKUP.test(text);
}

/** The first complete JSON object in a reply, or null. Models sometimes wrap it in words or a code block. */
export function extractJson(raw: unknown): unknown {
  if (raw && typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** Exactly three short, plain, safe steps; anything else is refused whole, never repaired. */
export function parseBreakdown(raw: unknown, ageBand: AgeBand): Breakdown | null {
  const data = extractJson(raw);
  if (!isRecord(data) || !Array.isArray(data.steps) || data.steps.length !== BREAKDOWN_STEPS) return null;
  const young = ageBand === '0-3' || ageBand === '3-6' || ageBand === '6-12';
  const steps: BreakdownStep[] = [];
  for (const entry of data.steps) {
    if (!isRecord(entry) || typeof entry.text !== 'string' || typeof entry.minutes !== 'number') return null;
    const text = entry.text.replace(/\s+/g, ' ').trim();
    if (text.length < 3 || text.length > STEP_MAX_CHARS || !isClean(text)) return null;
    if (young && RISKY_FOR_YOUNG.test(text)) return null;
    if (ageBand !== '15-18' && ageBand !== '12-15' && ALONE.test(text) && (ageBand === '0-3' || ageBand === '3-6')) return null;
    if (!Number.isInteger(entry.minutes) || entry.minutes < 1 || entry.minutes > 5) return null;
    steps.push({ text, minutes: entry.minutes });
  }
  if ((ageBand === '0-3' || ageBand === '3-6') && !steps.some((step) => WITH_ADULT.test(step.text))) return null;
  return { steps };
}

export function parseSummary(raw: unknown): WeeklySummary | null {
  const data = extractJson(raw);
  if (!isRecord(data)) return null;
  const read = (key: string): string | null => {
    const value = data[key];
    if (typeof value !== 'string') return null;
    const text = value.replace(/\s+/g, ' ').trim();
    return text.length >= 10 && text.length <= SUMMARY_MAX_CHARS && isClean(text) ? text : null;
  };
  const praise = read('praise');
  const notice = read('notice');
  const tryNext = read('tryNext');
  return praise && notice && tryNext ? { praise, notice, tryNext } : null;
}
