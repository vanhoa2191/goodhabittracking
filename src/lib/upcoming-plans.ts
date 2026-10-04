/**
 * Plans announced but not on sale. They are a separate list on purpose: nothing here has a price, a plan id the payment
 * code knows, or a way to be bought, so showing them can never start a payment.
 */
export const UPCOMING_PLAN_IDS = ['family_plus_monthly', 'family_plus_yearly'] as const;
export type UpcomingPlanId = (typeof UPCOMING_PLAN_IDS)[number];
