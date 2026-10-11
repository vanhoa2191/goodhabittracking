import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getPaymentErrorCopy } from '@/lib/i18n/payment-error-copy';
import { getCheckoutPlanFeatures, PLAN_LOCALIZATION } from '@/lib/i18n/pricing-plan-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const codes = ['invalid_plan', 'create_failed', 'network', 'auth_required', 'invalid_request', 'service_unavailable', 'status_failed', 'order_not_found',
  'addon_requires_plan', 'already_included', 'already_owned', 'not_available', 'higher_plan_active', 'lifetime_active', 'offer_unavailable', 'offer_already_used'];

describe('payment translations', () => {
  it.each(languages)('provides complete nonempty copy for %s', (language) => {
    const copy = getPaymentErrorCopy(language);
    for (const step of [copy.create, copy.status]) {
      expect(Object.keys(step).sort()).toEqual([...codes].sort());
      for (const message of Object.values(step)) expect(message.trim().length).toBeGreaterThan(0);
    }
    for (const field of ['title', 'retry', 'clipboardFailure', 'beforeQr'] as const) {
      expect(copy[field].trim().length).toBeGreaterThan(0);
    }
    expect(copy.status.network).not.toBe(copy.create.network);
    for (const planId of ['solo_monthly', 'solo_yearly', 'monthly', 'yearly'] as const) {
      const plan = PLAN_LOCALIZATION[planId][language];
      for (const value of [plan.name, plan.desc, plan.period, ...getCheckoutPlanFeatures(planId, language)]) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('gives Vietnamese refusal copy for the add-on and plan-rank codes', () => {
    const { create } = getPaymentErrorCopy('vi');
    expect(create.addon_requires_plan).toBe('Add-on AI cần Gói Cơ bản hoặc Gói Pro đang hoạt động.');
    expect(create.already_included).toBe('Gói của bạn đã gồm gợi ý AI.');
    expect(create.already_owned).toBe('Gia đình bạn đã sở hữu mục này.');
    expect(create.not_available).toBe('Mục này chưa mở bán.');
    expect(create.lifetime_active).toBe('Gói Trọn đời của gia đình đã bao gồm mọi gói; không cần mua thêm gói.');
    expect(create.higher_plan_active).toBe('Gia đình đang dùng gói cao hơn. Hãy gia hạn đúng gói đang dùng.');
  });

  it('gives Vietnamese refusal copy for the promo offers', () => {
    const { create } = getPaymentErrorCopy('vi');
    expect(create.offer_unavailable).toBe('Ưu đãi này đã hết suất hoặc đã kết thúc.');
    expect(create.offer_already_used).toBe('Gia đình bạn đã dùng ưu đãi này.');
  });

  it.each(languages)('labels the promo checkouts in %s', (language) => {
    for (const id of ['pro_plus_yearly_upsell', 'pro_plus_yearly_b1g1']) {
      expect(PLAN_LOCALIZATION[id][language].name.trim().length).toBeGreaterThan(0);
    }
  });

  it('labels the promo checkouts in Vietnamese', () => {
    expect(PLAN_LOCALIZATION.pro_plus_yearly_upsell.vi.name).toBe('Pro Plus · Năm (ưu đãi nâng cấp)');
    expect(PLAN_LOCALIZATION.pro_plus_yearly_b1g1.vi.name).toBe('Pro Plus · 2 năm (mua 1 tặng 1)');
  });

  it('never reassures a status failure that money has not been debited', () => {
    const noDebit = /chưa có khoản nào|has not charged|aucun débit|nichts abgebucht|non ha addebitato|ningún cobro|没有扣款|引き落としはありません|출금된 금액은 없/iu;
    for (const language of languages) {
      expect(getPaymentErrorCopy(language).create.network).toMatch(noDebit);
      for (const message of Object.values(getPaymentErrorCopy(language).status)) expect(message).not.toMatch(noDebit);
    }
  });
});
