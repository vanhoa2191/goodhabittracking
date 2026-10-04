export type AiKind = 'breakdown' | 'summary';
export type AiLanguage = 'vi' | 'en';

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
export const AI_POLICY_VERSION = '2026-10-04';

/** The free allowance is shared by the whole account, so the system-wide cap is what really limits use. */
export const AI_LIMITS = {
  perFamilyPerDay: 5,
  minSecondsBetweenCalls: 20,
  systemPerDay: 150,
} as const;

export const AI_TITLE_MAX = 80;
export const BREAKDOWN_STEPS = 3;
export const STEP_MAX_CHARS = 60;
export const SUMMARY_MAX_CHARS = 220;
