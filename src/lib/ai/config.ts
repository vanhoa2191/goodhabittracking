export type AiKind = 'breakdown' | 'summary';
export type AiLanguage = 'vi' | 'en';
export type AiTier = 'plus' | 'standard' | 'free';

/** The model is asked in Vietnamese for a Vietnamese parent and in English for everyone else, until other languages are tried. */
export function aiLanguageOf(language: string): AiLanguage {
  return language === 'vi' ? 'vi' : 'en';
}

/**
 * The Workers AI model. A small instruction model keeps a call cheap against the free daily allowance (10,000 Neurons for
 * the whole account); changing it never needs a change anywhere else. Choose it with the trial in the plan, not by guess.
 */
export const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';
/** Models listed as supporting JSON mode accept a schema; others are asked for JSON in the prompt and checked the same way. */
export const AI_USES_JSON_MODE = true;
export const AI_TIMEOUT_MS = 8000;
/** Changes whenever the text the parent agrees to changes, so an old agreement never covers a new use. */
export const AI_POLICY_VERSION = '2026-10-20';

const DEFAULT_SYSTEM_PER_DAY = 5000;

/** `AI_SYSTEM_PER_DAY` when it is a whole number from 1 to 100000; anything else (empty, text, zero, negative) keeps the default. */
export function systemPerDayFrom(raw: string | undefined): number {
  const value = Number(raw);
  return raw !== undefined && Number.isInteger(value) && value >= 1 && value <= 100000 ? value : DEFAULT_SYSTEM_PER_DAY;
}

/**
 * Monthly allowance by tier (the Plus tier has none), a daily safety cap for every tier, and the cap for the whole
 * system. The system cap is read when asked, so a Worker variable changes it without a new build.
 */
export const AI_LIMITS = {
  perMonth: { free: 10, standard: 20 },
  perDaySafety: 100,
  minSecondsBetweenCalls: 20,
  get systemPerDay(): number { return systemPerDayFrom(process.env.AI_SYSTEM_PER_DAY); },
} as const;

export const AI_TITLE_MAX = 80;
export const BREAKDOWN_STEPS = 3;
export const STEP_MAX_CHARS = 60;
export const SUMMARY_MAX_CHARS = 220;
