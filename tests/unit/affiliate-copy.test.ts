import { describe, expect, it } from 'vitest';
import { getAffiliateCopy } from '@/lib/i18n/affiliate-copy';
const settings = { percent: 30, holdDays: 35, windowDays: 365, minPayout: '200.000 đ' };
const languages = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'] as const;

describe('affiliate copy', () => {
  it('states the commission, hold, window and minimum from the programme settings', () => {
    for (const language of languages) {
      const copy = getAffiliateCopy(language);
      const text = copy.rules(settings).join(' ');
      expect(copy.intro(30)).toContain('30');
      expect(text).toContain('30');
      expect(text).toContain('35');
      expect(text).toContain('12');
      expect(text).toContain('200.000 đ');
    }
  });

  it('says plainly that the referrer cannot see who was referred and that tax is their own matter', () => {
    expect(getAffiliateCopy('vi').rules(settings).join(' ')).toContain('Bạn không xem được thông tin của gia đình được giới thiệu');
    expect(getAffiliateCopy('en').rules(settings).join(' ')).toContain('cannot see any details');
    expect(getAffiliateCopy('vi').tax).toContain('thuế thu nhập cá nhân');
    expect(getAffiliateCopy('en').tax).toContain('income tax');
  });

  it('covers every commission status, plan and message in every language', () => {
    for (const language of languages) {
      const copy = getAffiliateCopy(language);
      expect(Object.keys(copy.status).sort()).toEqual(['available', 'paid', 'pending', 'requested', 'reversed']);
      expect(Object.keys(copy.plan).sort()).toEqual(['lifetime', 'monthly', 'solo_monthly', 'yearly']);
      for (const message of Object.values(copy.messages)) expect(message.length).toBeGreaterThan(5);
    }
  });

  it('answers every outcome of entering a code by hand in every language', () => {
    for (const language of languages) {
      const { entry } = getAffiliateCopy(language);
      expect(Object.keys(entry.results).sort()).toEqual(['already_referred', 'claimed', 'disabled', 'expired', 'failed', 'invalid', 'self']);
      for (const text of [entry.prompt, entry.hint, entry.submit, entry.referred, ...Object.values(entry.results)]) expect(text.length).toBeGreaterThanOrEqual(5);
      expect(entry.hint).toContain('8');
    }
  });

  it('returns a stable copy object for each supported language', () => {
    const copies = languages.map((language) => getAffiliateCopy(language));
    expect(new Set(copies).size).toBe(languages.length);
    expect(getAffiliateCopy('vi')).not.toBe(getAffiliateCopy('en'));
  });
});
