import type { SubscriptionPlan } from '@/types';

/** The plans a customer can pay for. Every list of sellable plans in the app derives from this one. */
export const PAID_PLAN_IDS = ['solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'pro_plus_monthly', 'pro_plus_yearly'] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export type BillingCycle = 'month' | 'year';
export type PlanTier = 'solo' | 'pro' | 'pro_plus';

/** Prices in VND. */
export const PLAN_PRICES: Readonly<Record<PlanTier, { readonly month: number; readonly year: number }>> = {
  solo: { month: 49000, year: 399000 },
  pro: { month: 69000, year: 590000 },
  pro_plus: { month: 79000, year: 790000 },
};

/** The first families to pay for a yearly Pro plan get Pro Plus for the rest of the paid year. */
export const LAUNCH_OFFER = { code: 'pro_plus_founding', slots: 10, planId: 'yearly' } as const;

/**
 * Limited Pro Plus Năm offers. Each is its own order id; the subscription it creates is always `pro_plus_yearly`,
 * for `years` years. `endsAt` stops new orders only; a paid order is always honoured.
 */
export const PROMO_PLAN_IDS = ['pro_plus_yearly_upsell', 'pro_plus_yearly_b1g1'] as const;
export type PromoPlanId = (typeof PROMO_PLAN_IDS)[number];

export const PROMO_PLANS: Readonly<Record<PromoPlanId, { readonly price: number; readonly years: 1 | 2; readonly offerCode: string; readonly slots: number; readonly endsAt: string | null }>> = {
  pro_plus_yearly_upsell: { price: 690000, years: 1, offerCode: 'pro_plus_upsell_690', slots: 200, endsAt: null },
  // 01/01/2027 00:00 Asia/Saigon.
  pro_plus_yearly_b1g1: { price: 790000, years: 2, offerCode: 'pro_plus_b1g1', slots: 100, endsAt: '2026-12-31T17:00:00.000Z' },
};

export function isPromoPlanId(value: unknown): value is PromoPlanId {
  return typeof value === 'string' && (PROMO_PLAN_IDS as readonly string[]).includes(value);
}

/** The plan a promo order activates. */
export function promoBasePlan(id: PromoPlanId): PaidPlanId {
  const base: Record<PromoPlanId, PaidPlanId> = { pro_plus_yearly_upsell: 'pro_plus_yearly', pro_plus_yearly_b1g1: 'pro_plus_yearly' };
  return base[id];
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return typeof value === 'string' && (PAID_PLAN_IDS as readonly string[]).includes(value);
}

export function planTier(id: PaidPlanId): PlanTier {
  if (id === 'solo_monthly' || id === 'solo_yearly') return 'solo';
  if (id === 'pro_plus_monthly' || id === 'pro_plus_yearly') return 'pro_plus';
  return 'pro';
}

export function planCycle(id: PaidPlanId): BillingCycle {
  return id === 'solo_yearly' || id === 'yearly' || id === 'pro_plus_yearly' ? 'year' : 'month';
}

export function planIdFor(tier: PlanTier, cycle: BillingCycle): PaidPlanId {
  if (tier === 'solo') return cycle === 'year' ? 'solo_yearly' : 'solo_monthly';
  if (tier === 'pro_plus') return cycle === 'year' ? 'pro_plus_yearly' : 'pro_plus_monthly';
  return cycle === 'year' ? 'yearly' : 'monthly';
}

export function planDurationDays(id: PaidPlanId): 31 | 366 {
  return planCycle(id) === 'year' ? 366 : 31;
}

/** Children a plan allows; null is unlimited. The trial has the Pro limit. */
export function planChildLimit(plan: SubscriptionPlan): number | null {
  if (plan === 'lifetime') return null;
  if (plan === 'solo_monthly' || plan === 'solo_yearly') return 1;
  if (plan === 'monthly' || plan === 'yearly' || plan === 'pro_plus_monthly' || plan === 'pro_plus_yearly' || plan === 'trial') return 5;
  return 0;
}
