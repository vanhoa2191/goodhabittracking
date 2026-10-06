import { PLAN_PRICES, planIdFor, type BillingCycle, type PaidPlanId, type PlanTier } from '@/lib/billing/plan-catalog';

export type PricingCard = {
  readonly tier: PlanTier;
  /** The id the payment code accepts; null while the plan is announced and cannot be bought. */
  readonly planId: PaidPlanId | null;
  readonly price: number;
  /** Twelve monthly payments, shown struck through next to the yearly price. */
  readonly fullYearPrice: number | null;
  readonly perMonth: number | null;
  readonly perDay: number;
  readonly saving: number | null;
  readonly savingPercent: number | null;
  readonly purchasable: boolean;
};

const TIERS: readonly PlanTier[] = ['solo', 'pro', 'pro_plus'];
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

function buildCard(tier: PlanTier, cycle: BillingCycle): PricingCard {
  const { month, year } = PLAN_PRICES[tier];
  const planId = tier === 'pro_plus' ? null : planIdFor(tier, cycle);
  const base = { tier, planId, purchasable: planId !== null };
  if (cycle === 'month') {
    return { ...base, price: month, fullYearPrice: null, perMonth: null, perDay: roundTo(month / 30, 10), saving: null, savingPercent: null };
  }
  const fullYearPrice = month * 12;
  const saving = fullYearPrice - year;
  return {
    ...base,
    price: year,
    fullYearPrice,
    perMonth: roundTo(year / 12, 100),
    perDay: roundTo(year / 365, 10),
    saving,
    savingPercent: Math.round((saving / fullYearPrice) * 100),
  };
}

/** The three plan cards for a billing cycle, in display order: one child, Pro, Pro Plus. */
export function buildPricingView(cycle: BillingCycle): readonly PricingCard[] {
  return TIERS.map((tier) => buildCard(tier, cycle));
}

/** The largest yearly saving across the plans, for the "save up to" line. */
export const MAX_SAVING_PERCENT = Math.max(...buildPricingView('year').map((card) => card.savingPercent ?? 0));
