import type { Language } from '@/types';
import type { HelpText, HelpTopic } from './help-topics';
import type { HelpTopicId, HelpTranslationTable } from './help-topic-id';

type Topics = Readonly<Record<HelpTopicId, HelpTopic>>;
export type HelpTranslation = HelpTranslationTable<HelpText>;

let pending: Promise<Topics> | undefined;

/** The texts load on the first "?" that is used and are kept after that. */
export function loadHelpTopics(): Promise<Topics> {
  if (!pending) {
    pending = import('./help-topics').then((module) => module.HELP_TOPICS);
    pending.catch(() => { pending = undefined; });
  }
  return pending;
}

// One explicit import per language so the bundler splits each translation into its own chunk.
function importTranslation(language: Exclude<Language, 'vi' | 'en'>): Promise<HelpTranslation> {
  switch (language) {
    case 'fr': return import('./help-topics-fr').then((module) => module.HELP_TOPICS_FR);
    case 'de': return import('./help-topics-de').then((module) => module.HELP_TOPICS_DE);
    case 'it': return import('./help-topics-it').then((module) => module.HELP_TOPICS_IT);
    case 'es': return import('./help-topics-es').then((module) => module.HELP_TOPICS_ES);
    case 'zh': return import('./help-topics-zh').then((module) => module.HELP_TOPICS_ZH);
    case 'ja': return import('./help-topics-ja').then((module) => module.HELP_TOPICS_JA);
    case 'ko': return import('./help-topics-ko').then((module) => module.HELP_TOPICS_KO);
  }
}

const translations = new Map<Language, Promise<HelpTranslation | null>>();

/**
 * The help texts of one language other than Vietnamese and English, loaded the first time a "?" is used in it and kept
 * after that. Vietnamese and English live in the topics themselves, so they resolve to null. A load that fails also
 * resolves to null and is tried again next time; the caller then reads English.
 */
export function loadHelpTranslation(language: Language): Promise<HelpTranslation | null> {
  if (language === 'vi' || language === 'en') return Promise.resolve(null);
  const cached = translations.get(language);
  if (cached) return cached;
  const loading = importTranslation(language).then(
    (translation): HelpTranslation | null => translation,
    (): null => { translations.delete(language); return null; },
  );
  translations.set(language, loading);
  return loading;
}

/** The text of one topic in a language; a topic the translation lacks (or leaves empty) reads in English. */
export function helpTextFor(id: HelpTopicId, topic: HelpTopic, translation: HelpTranslation | null | undefined, language: Language): HelpText {
  if (language === 'vi') return topic.vi;
  if (language === 'en') return topic.en;
  const translated = translation?.[id];
  return translated && translated.title.trim() && translated.text.trim() ? translated : topic.en;
}
