import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { createPaymentRequestSchema, paidPlanSchema } from '@/lib/billing/schemas';
import { PRICING_PLANS } from '@/lib/payos';
import { getLaunchOfferCopy } from '@/lib/i18n/addons-copy';
import type { Language } from '@/types';

const LANGUAGES: readonly Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];

describe('Pro Plus sale replaces the upcoming announcement', () => {
  it.each(['pro_plus_monthly', 'pro_plus_yearly'])('sells %s through checkout', (id) => {
    expect(paidPlanSchema.safeParse(id).success).toBe(true);
    expect(createPaymentRequestSchema.safeParse({ planId: id }).success).toBe(true);
    expect(PRICING_PLANS.some((plan) => String(plan.id) === id)).toBe(true);
  });
  it('removes the announcement and its obsolete catalog and copy', () => {
    for (const path of ['src/lib/upcoming-plans.ts', 'src/lib/i18n/upcoming-plans-copy.ts', 'src/components/public/UpcomingPlans.tsx']) expect(existsSync(path), path).toBe(false);
  });
  it.each(LANGUAGES)('keeps the launch offer in %s without a future launch promise', (language) => {
    const copy = getLaunchOfferCopy(language);
    for (const text of [copy.offerTitle, copy.offerBody, copy.offerRemaining(3), copy.offerSoldOut]) expect(text.trim().length).toBeGreaterThan(0);
    expect(copy.offerRemaining(3)).toContain('3');
    expect(copy.offerBody).not.toMatch(/before Pro Plus launches|trước khi Pro Plus ra mắt/i);
  });
});
