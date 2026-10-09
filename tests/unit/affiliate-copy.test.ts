import { describe, expect, it } from 'vitest';
import { getAffiliateCopy } from '@/lib/i18n/affiliate-copy';

const languages = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const;

describe('affiliate referral outcome contracts', () => {
  it('provides a user-facing result for every outcome of entering a referral code', () => {
    for (const language of languages) {
      expect(Object.keys(getAffiliateCopy(language).entry.results).sort()).toEqual([
        'already_referred', 'claimed', 'disabled', 'expired', 'failed', 'invalid', 'self',
      ]);
    }
  });
});
