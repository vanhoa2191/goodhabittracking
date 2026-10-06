import { describe, expect, it } from 'vitest';
import type { Language } from '@/types';
import { getPaymentErrorCopy } from '@/lib/i18n/payment-error-copy';
import { getCheckoutPlanFeatures, PLAN_LOCALIZATION } from '@/lib/i18n/pricing-plan-copy';

const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const codes = ['invalid_plan', 'create_failed', 'network', 'auth_required', 'invalid_request', 'service_unavailable', 'status_failed', 'order_not_found'];

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

  it('never reassures a status failure that money has not been debited', () => {
    const noDebit = /chưa có khoản nào|has not charged|aucun débit|nichts abgebucht|non ha addebitato|ningún cobro|没有扣款|引き落としはありません|출금된 금액은 없/iu;
    for (const language of languages) {
      expect(getPaymentErrorCopy(language).create.network).toMatch(noDebit);
      for (const message of Object.values(getPaymentErrorCopy(language).status)) expect(message).not.toMatch(noDebit);
    }
  });
});
