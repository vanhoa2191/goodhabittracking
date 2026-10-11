import { describe, expect, it } from 'vitest';
import { ADDON_IDS, ADDON_PRICES, addonVisible, isAddonId } from '@/lib/billing/addon-catalog';
import { checkoutItemSchema, createPaymentRequestSchema } from '@/lib/billing/schemas';
import { PAID_PLAN_IDS } from '@/lib/billing/plan-catalog';

describe('add-on catalog', () => {
  it('lists the two add-ons with their prices', () => {
    expect(ADDON_IDS).toEqual(['ai_addon_monthly', 'printables']);
    expect(ADDON_PRICES).toEqual({ ai_addon_monthly: 29000, printables: 99000 });
  });

  it('recognises only add-on ids', () => {
    expect(isAddonId('ai_addon_monthly')).toBe(true);
    expect(isAddonId('printables')).toBe(true);
    expect(isAddonId('pro_plus_monthly')).toBe(false);
    expect(isAddonId('monthly')).toBe(false);
    expect(isAddonId(undefined)).toBe(false);
    expect(isAddonId(null)).toBe(false);
  });

  it('shows the AI add-on always and printables only with the sale flag', () => {
    expect(addonVisible('ai_addon_monthly', { printablesSale: false })).toBe(true);
    expect(addonVisible('ai_addon_monthly', { printablesSale: true })).toBe(true);
    expect(addonVisible('printables', { printablesSale: false })).toBe(false);
    expect(addonVisible('printables', { printablesSale: true })).toBe(true);
  });

  it('accepts every plan and add-on as a checkout item, nothing else', () => {
    for (const id of [...PAID_PLAN_IDS, ...ADDON_IDS]) expect(checkoutItemSchema.safeParse(id).success).toBe(true);
    for (const id of ['trial', 'lifetime', 'free', 'family_plus_yearly', '']) expect(checkoutItemSchema.safeParse(id).success).toBe(false);
    expect(createPaymentRequestSchema.safeParse({ planId: 'printables' }).success).toBe(true);
    expect(createPaymentRequestSchema.safeParse({ planId: 'printables', amount: 1 }).success).toBe(false);
  });
});
