import type { SubscriptionPlan } from '@/types';

/** The plans a customer can pay for. Every list of sellable plans in the app derives from this one. */
export const PAID_PLAN_IDS = ['solo_monthly', 'solo_yearly', 'monthly', 'yearly'] as const;
export type PaidPlanId = (typeof PAID_PLAN_IDS)[number];

export type BillingCycle = 'month' | 'year';
export type PlanTier = 'solo' | 'pro' | 'pro_plus';

/** Prices in VND. Pro Plus is announced, not on sale, so it has no plan id the payment code accepts. */
export const PLAN_PRICES: Readonly<Record<PlanTier, { readonly month: number; readonly year: number }>> = {
  solo: { month: 39000, year: 399000 },
  pro: { month: 59000, year: 590000 },
  pro_plus: { month: 79000, year: 790000 },
};

/** The first families to pay for a yearly Pro plan get Pro Plus for the rest of the paid year. */
export const LAUNCH_OFFER = { code: 'pro_plus_founding', slots: 10, planId: 'yearly' } as const;

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return typeof value === 'string' && (PAID_PLAN_IDS as readonly string[]).includes(value);
}

export function planTier(id: PaidPlanId): 'solo' | 'pro' {
  return id === 'solo_monthly' || id === 'solo_yearly' ? 'solo' : 'pro';
}

export function planCycle(id: PaidPlanId): BillingCycle {
  return id === 'solo_yearly' || id === 'yearly' ? 'year' : 'month';
}

export function planIdFor(tier: 'solo' | 'pro', cycle: BillingCycle): PaidPlanId {
  if (tier === 'solo') return cycle === 'year' ? 'solo_yearly' : 'solo_monthly';
  return cycle === 'year' ? 'yearly' : 'monthly';
}

export function planDurationDays(id: PaidPlanId): 31 | 366 {
  return planCycle(id) === 'year' ? 366 : 31;
}

/** Children a plan allows; null is unlimited. The trial has the Pro limit. */
export function planChildLimit(plan: SubscriptionPlan): number | null {
  if (plan === 'lifetime') return null;
  if (plan === 'solo_monthly' || plan === 'solo_yearly') return 1;
  if (plan === 'monthly' || plan === 'yearly' || plan === 'trial') return 5;
  return 0;
}
