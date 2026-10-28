import { describe, expect, it } from 'vitest';

import { translations } from '@/lib/i18n/translations';
import { skipToContent } from '@/lib/i18n/app-skip-copy';

describe('locale catalog', () => {
  it('Given all supported locales When catalogs load Then every locale has Vietnamese key parity', () => {
    const referenceKeys = Object.keys(translations.vi).sort();

    for (const [locale, messages] of Object.entries(translations)) {
      expect(Object.keys(messages).sort(), locale).toEqual(referenceKeys);
    }
  });

  it('has localized, nonempty checkout and payment outcomes in every locale', () => {
    const keys = ['secureCheckoutAction', 'paymentReturnActivated', 'paymentReturnPending', 'paymentReturnCancelled', 'paymentReturnError'] as const;
    for (const [locale, messages] of Object.entries(translations)) {
      for (const key of keys) {
        expect(messages[key].trim().length, `${locale}.${key}`).toBeGreaterThan(0);
        if (locale !== 'en') expect(messages[key], `${locale}.${key}`).not.toBe(translations.en[key]);
      }
    }
  });

  it('has a translated skip link for every supported locale', () => {
    for (const locale of Object.keys(translations) as Array<keyof typeof translations>) {
      expect(skipToContent[locale].trim().length, locale).toBeGreaterThan(0);
      if (locale !== 'en') expect(skipToContent[locale]).not.toBe(skipToContent.en);
    }
  });
});
