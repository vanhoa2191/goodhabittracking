import { describe, expect, it } from 'vitest';
import { createPaymentRequestSchema, paidPlanSchema } from '@/lib/billing/schemas';
import { PRICING_PLANS } from '@/lib/payos';
import { getUpcomingPlansCopy } from '@/lib/i18n/upcoming-plans-copy';
import { UPCOMING_PLAN_IDS } from '@/lib/upcoming-plans';
import type { Language } from '@/types';

const LANGUAGES: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
const VIETNAMESE_ONLY = /[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u;

describe('upcoming plans', () => {
  it('cannot be bought: none is a plan the payment code knows', () => {
    for (const id of UPCOMING_PLAN_IDS) {
      expect(paidPlanSchema.safeParse(id).success, id).toBe(false);
      expect(createPaymentRequestSchema.safeParse({ planId: id }).success, id).toBe(false);
      expect(PRICING_PLANS.some((plan) => String(plan.id) === id), id).toBe(false);
    }
  });

  it('are announced without a price in every language', () => {
    for (const language of LANGUAGES) {
      const copy = getUpcomingPlansCopy(language);
      const text = [copy.heading, copy.note, copy.badge, copy.priceSoon, copy.button, copy.includes, ...Object.values(copy.names), ...Object.values(copy.periods), copy.coachFeature, ...copy.features].join(' ');
      expect(text, language).not.toMatch(/\d{2,}|₫|VN[DĐ]|\$|€|¥/);
      expect(copy.features.length, language).toBe(2);
      for (const part of [copy.heading, copy.note, copy.badge, copy.priceSoon, copy.button, copy.includes]) expect(part.trim().length, language).toBeGreaterThan(0);
      if (language !== 'vi') expect(VIETNAMESE_ONLY.test(text.normalize('NFC')), language).toBe(false);
    }
  });

  it('says the current plans do not change', () => {
    expect(getUpcomingPlansCopy('en').note).toContain('current plans do not change');
    expect(getUpcomingPlansCopy('vi').note).toContain('các gói hiện tại không thay đổi');
  });
});
