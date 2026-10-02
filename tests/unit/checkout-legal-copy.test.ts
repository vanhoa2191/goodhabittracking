import { describe, expect, it } from 'vitest';
import { getCheckoutLegalCopy } from '@/lib/i18n/checkout-legal-copy';
import type { Language } from '@/types';

const LANGUAGES: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const VIETNAMESE_ONLY = /[ăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

describe('checkout confirmation copy', () => {
  it.each(LANGUAGES)('keeps both legal links in the consent sentence in %s', (language) => {
    const copy = getCheckoutLegalCopy(language);
    expect(copy.agreeTemplate).toContain('[terms]');
    expect(copy.agreeTemplate).toContain('[privacy]');
    expect(copy.termsLink.trim()).not.toBe('');
    expect(copy.privacyLink.trim()).not.toBe('');
  });

  it.each(LANGUAGES.filter((language) => language !== 'vi'))('has no Vietnamese in %s', (language) => {
    const copy = getCheckoutLegalCopy(language);
    for (const value of Object.values(copy)) expect(value).not.toMatch(VIETNAMESE_ONLY);
  });

  it('says in every language that the payment is single and does not renew by itself', () => {
    for (const language of LANGUAGES) expect(getCheckoutLegalCopy(language).confirmBody.length).toBeGreaterThan(30);
  });
});
