import { ADDON_IDS, ADDON_PRICES, addonVisible, type AddonId } from '@/lib/billing/addon-catalog';
import { LAUNCH_OFFER, PLAN_PRICES, PROMO_PLANS, planIdFor, type BillingCycle, type PaidPlanId, type PlanTier, type PromoPlanId } from '@/lib/billing/plan-catalog';

export type PricingCard = {
  readonly tier: PlanTier;
  /** The plan id accepted by checkout. */
  readonly planId: PaidPlanId;
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
  const planId = planIdFor(tier, cycle);
  const base = { tier, planId, purchasable: true };
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

export type AddonCard = { readonly id: AddonId; readonly price: number };

/** Customer-visible add-ons, using the same flag as checkout. */
export function addonCards(flags: { readonly printablesSale: boolean }): readonly AddonCard[] {
  return ADDON_IDS.filter((id) => addonVisible(id, flags)).map((id) => ({ id, price: ADDON_PRICES[id] }));
}

export type PricingPromo = { readonly planId: PromoPlanId; readonly remaining: number };

/** Promotions never replace list prices; a yearly card gets an extra action only with a readable, open offer. */
export function promoForCard(tier: PlanTier, cycle: BillingCycle, offers: readonly unknown[], now = Date.now()): PricingPromo | null {
  if (cycle !== 'year' || tier === 'solo') return null;
  if (tier === 'pro') {
    const founding = offers.find((entry): entry is Record<string, unknown> => (
      entry !== null && typeof entry === 'object' && 'code' in entry && entry.code === LAUNCH_OFFER.code
    ));
    // Pro yearly already includes the upgrade while founding seats remain; unknown is not sold out.
    if (founding?.slots !== LAUNCH_OFFER.slots || founding.remaining !== 0) return null;
  }
  const planId = tier === 'pro' ? 'pro_plus_yearly_upsell' : 'pro_plus_yearly_b1g1';
  const promo = PROMO_PLANS[planId];
  if (promo.endsAt !== null && Date.parse(promo.endsAt) <= now) return null;
  for (const entry of offers) {
    if (!entry || typeof entry !== 'object') continue;
    const offer = entry as Record<string, unknown>;
    if (offer.code !== promo.offerCode) continue;
    if (offer.slots !== promo.slots || typeof offer.remaining !== 'number' || !Number.isInteger(offer.remaining) || offer.remaining <= 0 || offer.remaining > promo.slots) return null;
    if (offer.endsAt !== null && (typeof offer.endsAt !== 'string' || !Number.isFinite(Date.parse(offer.endsAt)) || Date.parse(offer.endsAt) <= now)) return null;
    return { planId, remaining: offer.remaining };
  }
  return null;
}

export type CheckoutPromoContext = {
  readonly discountAmount?: number;
  readonly referralState?: 'loading' | 'eligible' | 'referred' | 'hidden';
};

/** The 100k upgrade is accurate only for Pro yearly without a referral discount or eligibility. */
export function promoForCheckout(planId: string, offers: readonly unknown[], context: CheckoutPromoContext = {}, now = Date.now()): PricingPromo | null {
  if (planId !== 'yearly' || (context.discountAmount ?? 0) > 0 || context.referralState === 'eligible' || context.referralState === 'referred' || context.referralState === 'loading') return null;
  return promoForCard('pro', 'year', offers, now);
}

export type LaunchOfferData = { readonly remaining: number | null; readonly offers: readonly unknown[] };

/** One endpoint serves founding seats and promotions; malformed counts never advertise a promo. */
export async function readLaunchOffers(signal: AbortSignal): Promise<LaunchOfferData> {
  const response = await fetch('/api/offers/launch', { signal });
  if (!response.ok) throw new Error('offer unavailable');
  const data = await response.json() as { remaining?: unknown; offers?: unknown } | null;
  return {
    remaining: typeof data?.remaining === 'number' && Number.isInteger(data.remaining) && data.remaining >= 0 ? data.remaining : null,
    offers: Array.isArray(data?.offers) ? data.offers : [],
  };
}
