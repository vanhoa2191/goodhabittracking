import { AI_TITLE_MAX } from './config';

const URL_LIKE = /\b(?:https?:\/\/|www\.)\S+/gi;
const EMAIL_LIKE = /\S+@\S+\.\S+/g;
// Seven or more digits in a row, with the separators people type in phone numbers and ids.
const LONG_NUMBER = /\+?\d[\d\s().-]{5,}\d/g;
const CONTROL = new RegExp('[' + ['\\u0000-\\u001f', '\\u007f-\\u009f', '\\u200b-\\u200f', '\\u2028-\\u202e', '\\u2066-\\u2069'].join('') + ']', 'g');
const QUOTES_AND_BRACES = /["`{}<>\\]/g;

/**
 * The only free text that ever reaches the model: the name of a habit the parent has just typed. It is trimmed to a short
 * plain line with anything that identifies a person or tries to look like markup taken out. Null when nothing useful is left.
 */
export function cleanHabitTitle(raw: string): string | null {
  const cleaned = raw
    .normalize('NFC')
    .replace(CONTROL, ' ')
    .replace(URL_LIKE, ' ')
    .replace(EMAIL_LIKE, ' ')
    .replace(LONG_NUMBER, ' ')
    .replace(QUOTES_AND_BRACES, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, AI_TITLE_MAX)
    .trim();
  return cleaned.length >= 2 && !LOOKS_LIKE_INSTRUCTION.test(cleaned) ? cleaned : null;
}

// A habit name never needs these words; a title that has them is trying to talk to the model, so it is not sent at all.
const LOOKS_LIKE_INSTRUCTION = /(?:ignore|disregard|system|prompt|instruction|jailbreak|bỏ qua|hệ thống|quy tắc|lời nhắc|hướng dẫn trên|in ra|tiết lộ|reveal|override)/i;

const TITLES_BEFORE_NAMES: ReadonlySet<string> = new Set(['bé', 'con', 'em', 'cậu', 'cô', 'anh', 'chị']);

const escapeForPattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Takes the children's names out of a title the parent typed, so a name typed by habit ("An tự đánh răng") never leaves
 * the app. Whole names and nicknames go, and so does every word of a name (short given names such as "An" or "Mai" are
 * the common case), except the polite words that come before a name. A habit title may lose an ordinary word that is
 * also someone's name; leaking a child's name is the worse mistake. The screen also asks parents not to type names.
 */
export function removeChildNames(title: string, names: readonly string[]): string | null {
  const wanted = new Set<string>();
  for (const name of names) {
    const whole = name.normalize('NFC').trim();
    if (whole.length >= 2) wanted.add(whole);
    for (const word of whole.split(/\s+/)) if (word.length >= 2 && !TITLES_BEFORE_NAMES.has(word.toLowerCase())) wanted.add(word);
  }
  let result = title.normalize('NFC');
  for (const name of [...wanted].sort((a, b) => b.length - a.length)) {
    result = result.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeForPattern(name)}(?![\\p{L}\\p{N}])`, 'giu'), ' ');
  }
  result = result.replace(/\s+/g, ' ').trim();
  return result.length >= 2 ? result : null;
}
