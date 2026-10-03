import type { Language } from '@/types';

/** Languages the guide has been translated into besides Vietnamese (`public/guide/<code>/`; a test keeps this list true). */
export const GUIDE_TRANSLATIONS = ['en'] as const;

export type GuideLocale = 'vi' | (typeof GUIDE_TRANSLATIONS)[number];

/** The guide language a reader gets: their own when it exists, English when it does not, and Vietnamese as the source. */
export function guideLocaleFor(language: Language): GuideLocale {
  if (language === 'vi') return 'vi';
  const translations: readonly string[] = GUIDE_TRANSLATIONS;
  if (translations.includes(language)) return language as GuideLocale;
  return translations.includes('en') ? 'en' : 'vi';
}

export const guideFilePath = (locale: GuideLocale, name: string): string => `/guide/${locale === 'vi' ? '' : `${locale}/`}${name}.json`;
