import { describe, expect, it } from 'vitest';
import { detectLanguage, parseAcceptLanguage } from '@/lib/i18n/language-detection';

describe('language detection', () => {
  it('uses a saved manual choice before device language and country', () => {
    // Given
    const input = {
      savedLanguage: 'ja',
      preferredLocales: ['fr-FR'],
      countryCode: 'DE',
    } as const;

    // When
    const language = detectLanguage(input);

    // Then
    expect(language).toBe('ja');
  });

  it('uses the country language before a different supported device language', () => {
    // Given
    const input = {
      savedLanguage: null,
      preferredLocales: ['th-TH', 'fr-CA'],
      countryCode: 'VN',
    } as const;

    // When
    const language = detectLanguage(input);

    // Then
    expect(language).toBe('vi');
  });

  it('uses the first supported device language when country detection is unavailable', () => {
    // Given
    const input = {
      savedLanguage: null,
      preferredLocales: ['th-TH', 'fr-CA'],
      countryCode: null,
    } as const;

    // When
    const language = detectLanguage(input);

    // Then
    expect(language).toBe('fr');
  });

  it.each([
    ['VN', 'vi'],
    ['US', 'en'],
    ['FR', 'fr'],
    ['DE', 'de'],
    ['IT', 'it'],
    ['MX', 'es'],
    ['TW', 'zh'],
    ['JP', 'ja'],
    ['KR', 'ko'],
  ] as const)('maps country %s to %s when device locales are unsupported', (countryCode, expected) => {
    // Given
    const input = {
      savedLanguage: null,
      preferredLocales: ['th-TH'],
      countryCode,
    } as const;

    // When
    const language = detectLanguage(input);

    // Then
    expect(language).toBe(expected);
  });

  it('recognizes script and region subtags in a supported device locale', () => {
    // Given
    const input = {
      savedLanguage: null,
      preferredLocales: ['zh-Hant-TW'],
      countryCode: null,
    } as const;

    // When
    const language = detectLanguage(input);

    // Then
    expect(language).toBe('zh');
  });

  it('falls back to English outside supported locale markets', () => {
    // Given
    const input = {
      savedLanguage: null,
      preferredLocales: ['th-TH'],
      countryCode: 'TH',
    } as const;

    // When
    const language = detectLanguage(input);

    // Then
    expect(language).toBe('en');
  });

  it('does not infer a supported language from the region of an unsupported locale', () => {
    // Given
    const input = {
      savedLanguage: null,
      preferredLocales: ['nl-BE'],
      countryCode: null,
    } as const;

    // When
    const language = detectLanguage(input);

    // Then
    expect(language).toBe('en');
  });

  it('orders Accept-Language values by quality and ignores wildcards', () => {
    // Given
    const header = 'de-DE;q=0.7, fr-CA;q=0.9, *;q=0.8, en;q=0.5';

    // When
    const locales = parseAcceptLanguage(header);

    // Then
    expect(locales).toEqual(['fr-CA', 'de-DE', 'en']);
  });

  it('ignores locales with malformed Accept-Language quality values', () => {
    // Given
    const header = 'fr;q=bogus, de;q=1.0000, en;q=0.8';

    // When
    const locales = parseAcceptLanguage(header);

    // Then
    expect(locales).toEqual(['en']);
  });
});
