'use client';

import { useEffect, useState } from 'react';
import type { Language } from '@/types';
import {
  HABIT_FRAMEWORK_CATALOG,
  HABIT_FRAMEWORK_STAGES,
  parseFrameworkData,
  type FrameworkHabit,
  type FrameworkStage,
} from './catalog';

export type LocalizedFramework = Readonly<{
  language: Language;
  stages: readonly FrameworkStage[];
  habits: readonly FrameworkHabit[];
}>;

/** Vietnamese is the authoritative text and is always at hand; every other language is a translation. */
export const VIETNAMESE_FRAMEWORK: LocalizedFramework = {
  language: 'vi',
  stages: HABIT_FRAMEWORK_STAGES,
  habits: HABIT_FRAMEWORK_CATALOG,
};

// Each translation is a static file under /data, fetched only for a reader of that language. They are kept out
// of the JavaScript bundles on purpose: bundled, all eight would ship inside the server worker. A language
// without a file reads the English text.
const TRANSLATED_LANGUAGES: ReadonlySet<Language> = new Set<Language>(['en', 'ko', 'fr', 'de', 'it', 'es', 'zh', 'ja']);

async function fetchTranslation(language: Language): Promise<unknown> {
  const response = await fetch(`/data/habit-framework-v1.${language}.json`);
  if (!response.ok) throw new Error(`The ${language} framework text could not be loaded.`);
  return response.json();
}

/** The language whose text a reader of `language` actually sees. */
export function frameworkLanguageFor(language: Language): Language {
  return language === 'vi' || TRANSLATED_LANGUAGES.has(language) ? language : 'en';
}

const loads = new Map<Language, Promise<LocalizedFramework>>();

export function loadFramework(requested: Language): Promise<LocalizedFramework> {
  const language = frameworkLanguageFor(requested);
  if (language === 'vi') return Promise.resolve(VIETNAMESE_FRAMEWORK);
  let load = loads.get(language);
  if (!load) {
    load = fetchTranslation(language).then((data) => {
      const parsed = parseFrameworkData(data, language);
      return { language, stages: parsed.stages, habits: parsed.habits };
    });
    load.catch(() => loads.delete(language));
    loads.set(language, load);
  }
  return load;
}

/** The framework in the reader's language: Vietnamese at once, then the translation as soon as it has loaded. */
export function useLocalizedFramework(requested: Language): LocalizedFramework {
  const language = frameworkLanguageFor(requested);
  const [loaded, setLoaded] = useState<LocalizedFramework | null>(null);

  useEffect(() => {
    if (language === 'vi') return;
    let active = true;
    void loadFramework(language).then((framework) => { if (active) setLoaded(framework); }).catch(() => undefined);
    return () => { active = false; };
  }, [language]);

  return language !== 'vi' && loaded?.language === language ? loaded : VIETNAMESE_FRAMEWORK;
}
