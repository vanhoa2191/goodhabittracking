import { describe, expect, it } from 'vitest';

import { translations } from '@/lib/i18n/translations';

describe('locale catalog', () => {
  it('contains no retired fabricated landing testimonials', () => {
    for (const [locale, messages] of Object.entries(translations)) {
      expect(Object.keys(messages).filter((key) => key.startsWith('landingTestimonial')), locale).toEqual([]);
    }
  });

  it('Given all supported locales When catalogs load Then every locale has Vietnamese key parity', () => {
    const referenceKeys = Object.keys(translations.vi).sort();

    for (const [locale, messages] of Object.entries(translations)) {
      expect(Object.keys(messages).sort(), locale).toEqual(referenceKeys);
    }
  });
});
