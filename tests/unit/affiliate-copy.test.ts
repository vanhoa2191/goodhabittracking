import { describe, expect, it } from 'vitest';
import { getAffiliateCopy } from '@/lib/i18n/affiliate-copy';
import type { Language } from '@/types';

const settings = { percent: 30, holdDays: 35, windowDays: 365, minPayout: '200.000 đ' };

describe('affiliate copy', () => {
  it('states the commission, hold, window and minimum from the programme settings', () => {
    for (const language of ['vi', 'en'] as const) {
      const copy = getAffiliateCopy(language);
      const text = copy.rules(settings).join(' ');
      expect(copy.intro(30)).toContain('30%');
      expect(text).toContain('30%');
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

  it('covers every commission status, plan and message in both languages', () => {
    for (const language of ['vi', 'en'] as const) {
      const copy = getAffiliateCopy(language);
      expect(Object.keys(copy.status).sort()).toEqual(['available', 'paid', 'pending', 'requested', 'reversed']);
      expect(Object.keys(copy.plan).sort()).toEqual(['lifetime', 'monthly', 'solo_monthly', 'yearly']);
      for (const message of Object.values(copy.messages)) expect(message.length).toBeGreaterThan(5);
    }
  });

  it('shows English to every language other than Vietnamese', () => {
    const others: readonly Language[] = ['en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
    for (const language of others) expect(getAffiliateCopy(language)).toBe(getAffiliateCopy('en'));
    expect(getAffiliateCopy('vi')).not.toBe(getAffiliateCopy('en'));
  });
});
