import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { PAID_PLAN_IDS } from '@/lib/billing/plan-catalog';
import { getCheckoutPlanFeatures, PLAN_LOCALIZATION } from '@/lib/i18n/pricing-plan-copy';
import { getUpcomingPlansCopy } from '@/lib/i18n/upcoming-plans-copy';
import { getPublicPricingCopy } from '@/lib/i18n/public-pricing-copy';
import { getAiCopy } from '@/lib/i18n/ai-copy';

const LANGUAGES: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const OLD_VI_NAMES = /Gia Đình Plus|Gói Gia Đình|Gói cả nhà|Gói Một Bé|Gia Đình ·/;

describe('plan names and copy', () => {
  it('names, describes and prices every sellable plan in every language', () => {
    for (const id of PAID_PLAN_IDS) {
      for (const language of LANGUAGES) {
        const plan = PLAN_LOCALIZATION[id]?.[language];
        expect(plan, `${id} ${language}`).toBeDefined();
        for (const value of [plan.name, plan.desc, plan.period, plan.cta, ...getCheckoutPlanFeatures(id, language)]) {
          expect(value.trim().length, `${id} ${language}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('uses the new Vietnamese and English plan names', () => {
    expect(PLAN_LOCALIZATION.solo_monthly.vi.name).toBe('Gói Cơ bản · Tháng');
    expect(PLAN_LOCALIZATION.solo_yearly.vi.name).toBe('Gói Cơ bản · Năm');
    expect(PLAN_LOCALIZATION.monthly.vi.name).toBe('Gói Pro · Tháng');
    expect(PLAN_LOCALIZATION.yearly.vi.name).toBe('Gói Pro · Năm');
    expect(PLAN_LOCALIZATION.solo_yearly.en.name).toContain('Basic plan');
    expect(PLAN_LOCALIZATION.yearly.en.name).toContain('Pro plan');
  });

  it('keeps no old Vietnamese plan name anywhere', () => {
    const upcoming = getUpcomingPlansCopy('vi');
    const text = [
      ...PAID_PLAN_IDS.flatMap((id) => Object.values(PLAN_LOCALIZATION[id].vi)),
      ...Object.values(getPublicPricingCopy('vi')),
      upcoming.includes, upcoming.coachFeature, upcoming.offerBody, ...Object.values(upcoming.names), ...upcoming.features,
      getAiCopy('vi').soonTitle,
    ].join('\n');
    expect(text).not.toMatch(OLD_VI_NAMES);
  });

  it('states the new yearly savings and no longer promises unlimited children or removed perks', () => {
    expect(getPublicPricingCopy('vi').savings).toContain('118.000');
    expect(getPublicPricingCopy('vi').soloSavings).toContain('69.000');
    for (const language of LANGUAGES) {
      expect(getPublicPricingCopy(language).savings, language).toContain('17');
      expect(getPublicPricingCopy(language).soloSavings, language).toContain('15');
      expect(getPublicPricingCopy(language).savings, language).not.toContain('189');
      for (const id of PAID_PLAN_IDS) {
        const features = getCheckoutPlanFeatures(id, language).join(' ');
        expect(features, `${id} ${language}`).not.toMatch(/Ebook|ebook|e-book|电子书|電子書籍|전자책|tournament|torneo|Turnier|tournoi|竞赛|大会|대회/);
      }
    }
    expect(getPublicPricingCopy('vi').upToFive).toContain('5');
  });

  it('includes caregiver invitations in every paid tier and language', () => {
    for (const language of LANGUAGES) {
      const sharedBenefit = getPublicPricingCopy(language).caregiverInvites;
      expect(sharedBenefit.trim().length, language).toBeGreaterThan(0);
      for (const id of PAID_PLAN_IDS) {
        expect(getCheckoutPlanFeatures(id, language), `${id} ${language}`).toContain(sharedBenefit);
      }
    }
  });

  it('announces Pro Plus with the habit coach and the launch offer in every language', () => {
    for (const language of LANGUAGES) {
      const copy = getUpcomingPlansCopy(language);
      expect(copy.coachFeature.trim().length, language).toBeGreaterThan(0);
      expect(copy.offerTitle.trim().length, language).toBeGreaterThan(0);
      expect(copy.offerBody.trim().length, language).toBeGreaterThan(0);
      expect(copy.offerSoldOut.trim().length, language).toBeGreaterThan(0);
      expect(copy.offerRemaining(3), language).toContain('3');
      expect(copy.offerRemaining(10), language).toContain('10');
    }
    expect(getUpcomingPlansCopy('vi').coachFeature).toBe('Huấn luyện viên thói quen: gợi ý chia nhỏ thói quen và tóm tắt tuần bằng AI');
    expect(getUpcomingPlansCopy('vi').offerRemaining(3)).toBe('Còn 3/10 suất');
    expect(getUpcomingPlansCopy('vi').offerSoldOut).toBe('Đã hết suất ưu đãi');
    expect(getUpcomingPlansCopy('vi').names.family_plus_yearly).toBe('Gói Pro Plus · Năm');
    expect(getUpcomingPlansCopy('en').offerTitle).toBe('Launch offer');
    expect(getUpcomingPlansCopy('en').names.family_plus_monthly).toContain('Pro Plus plan');
  });

  it('calls the AI suggestions the habit coach', () => {
    expect(getAiCopy('vi').soonTitle).toBe('Huấn luyện viên thói quen');
    expect(getAiCopy('en').soonTitle).toBe('Habit coach');
  });

});

describe('each language shows its own wording', () => {
  it('names the AI suggestions with the same habit-coach term the Pro Plus card starts with', () => {
    for (const language of LANGUAGES) {
      const title = getAiCopy(language).soonTitle;
      expect(getUpcomingPlansCopy(language).coachFeature.startsWith(title), language).toBe(true);
    }
  });

  it('keeps every script and language-specific term in its own language', () => {
    const hangul = /[ᄀ-ᇿ㄰-㆏가-힯]/u;
    const kana = /[぀-ヿ]/u;
    const han = /[一-鿿]/u;
    const german = /Ein-Kind|Pro-Paket|Gewohnheits/;
    for (const language of LANGUAGES) {
      const text = JSON.stringify([
        Object.values(getPublicPricingCopy(language)),
        Object.values(getAiCopy(language)).filter((value) => typeof value === 'string'),
        Object.values(getUpcomingPlansCopy(language)).map((value) => (typeof value === 'function' ? value(3) : value)),
        PAID_PLAN_IDS.map((id) => PLAN_LOCALIZATION[id][language]),
      ]);
      expect(hangul.test(text), `hangul in ${language}`).toBe(language === 'ko');
      expect(kana.test(text), `kana in ${language}`).toBe(language === 'ja');
      expect(han.test(text), `han in ${language}`).toBe(language === 'zh' || language === 'ja');
      expect(german.test(text), `german in ${language}`).toBe(language === 'de');
    }
  });
});
