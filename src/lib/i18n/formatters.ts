import type { Language } from '@/types';

const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  es: 'es-ES',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
};

export function localeForLanguage(language: Language): string {
  return LOCALE_BY_LANGUAGE[language];
}

export function formatNumber(value: number, language: Language): string {
  return new Intl.NumberFormat(localeForLanguage(language)).format(value);
}

export function formatCurrency(
  value: number,
  language: Language,
  market: 'VN' | 'UNAVAILABLE' = 'VN',
): string {
  const formatter = new Intl.NumberFormat(localeForLanguage(language), {
    style: 'currency',
    currency: 'VND',
    currencyDisplay: market === 'VN' ? 'symbol' : 'code',
    maximumFractionDigits: 0,
  });
  if (market === 'VN') {
    const number = formatter.formatToParts(value)
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('')
      .trim();
    return `${number} VNĐ`;
  }
  return formatter.format(value);
}

export function formatDate(value: string | number | Date, language: Language): string {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    dateStyle: 'medium',
  }).format(new Date(value));
}

export function formatDateTime(value: string | number | Date, language: Language): string {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
