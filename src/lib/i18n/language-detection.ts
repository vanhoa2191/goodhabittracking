import type { Language } from '@/types';

export const LANGUAGE_PREFERENCE_KEY = 'kidhabit_language';

const LANGUAGE_BY_COUNTRY: Readonly<Record<string, Language>> = {
  VN: 'vi',
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', SG: 'en', IN: 'en', ZA: 'en', PH: 'en',
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr',
  DE: 'de', AT: 'de', CH: 'de', LI: 'de',
  IT: 'it', SM: 'it', VA: 'it',
  ES: 'es', MX: 'es', AR: 'es', BO: 'es', CL: 'es', CO: 'es', CR: 'es', CU: 'es',
  DO: 'es', EC: 'es', SV: 'es', GQ: 'es', GT: 'es', HN: 'es', NI: 'es', PA: 'es',
  PY: 'es', PE: 'es', PR: 'es', UY: 'es', VE: 'es',
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh',
  JP: 'ja',
  KR: 'ko',
};

type LocalePreference = {
  readonly locale: string;
  readonly quality: number;
  readonly index: number;
};

export type LanguageDetectionInput = {
  readonly savedLanguage: string | null;
  readonly preferredLocales: readonly string[];
  readonly countryCode: string | null;
};

export function isLanguage(value: string | null): value is Language {
  return value === 'vi'
    || value === 'en'
    || value === 'zh'
    || value === 'ja'
    || value === 'ko'
    || value === 'fr'
    || value === 'de'
    || value === 'it'
    || value === 'es';
}

function languageFromLocale(locale: string): Language | null {
  const primaryLanguage = locale.trim().toLowerCase().split(/[-_]/)[0] ?? null;
  return isLanguage(primaryLanguage) ? primaryLanguage : null;
}

export function detectLanguage(input: LanguageDetectionInput): Language {
  if (isLanguage(input.savedLanguage)) return input.savedLanguage;

  const explicitCountry = input.countryCode?.trim().toUpperCase() ?? null;
  if (explicitCountry) {
    const countryLanguage = LANGUAGE_BY_COUNTRY[explicitCountry];
    if (countryLanguage) return countryLanguage;
  }

  for (const locale of input.preferredLocales) {
    const language = languageFromLocale(locale);
    if (language) return language;
  }

  return 'en';
}

export function parseAcceptLanguage(header: string | null): readonly string[] {
  if (!header) return [];

  const preferences: LocalePreference[] = [];
  header.split(',').forEach((entry, index) => {
    const [localePart = '', ...parameters] = entry.split(';');
    const locale = localePart.trim();
    if (!locale || locale === '*') return;

    const qualityParameter = parameters
      .map((parameter) => parameter.trim())
      .find((parameter) => /^q=/i.test(parameter));
    const qualityMatch = qualityParameter === undefined
      ? null
      : /^q=([01](?:\.\d{0,3})?)$/i.exec(qualityParameter);
    if (qualityParameter !== undefined && qualityMatch === null) return;

    const quality = qualityMatch === null ? 1 : Number(qualityMatch[1]);
    if (!Number.isFinite(quality) || quality <= 0 || quality > 1) return;
    preferences.push({ locale, quality, index });
  });

  return preferences
    .sort((left, right) => right.quality - left.quality || left.index - right.index)
    .map(({ locale }) => locale);
}
