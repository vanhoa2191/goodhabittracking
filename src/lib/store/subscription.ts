import { isPaidPlanId, planChildLimit, type PaidPlanId } from '@/lib/billing/plan-catalog';
import type { FamilyAddons, SubscriptionPlan } from '@/types';

export interface SubscriptionDetails {
  isPro: boolean;
  plan: SubscriptionPlan;
  label: string;
  daysRemaining: number | null;
  statusText: string;
}

export interface SubscriptionCapabilities {
  readonly canWrite: boolean;
  readonly maxChildren: number | null;
}

export function checkIsPro(
  plan: SubscriptionPlan,
  trialEndsAt: string | null,
  subscriptionEndsAt: string | null,
  now = Date.now(),
): boolean {
  if (plan === 'lifetime') return true;
  if (isPaidPlanId(plan)) {
    // Mirrors family_has_pro_entitlement: a paid plan without an end date is not active.
    if (!subscriptionEndsAt) return false;
    return new Date(subscriptionEndsAt).getTime() > now;
  }
  if (plan === 'trial') {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt).getTime() > now;
  }
  return false;
}

export function buildSubscriptionCapabilities(
  plan: SubscriptionPlan,
  trialEndsAt: string | null,
  subscriptionEndsAt: string | null,
  now = Date.now(),
): SubscriptionCapabilities {
  const canWrite = checkIsPro(plan, trialEndsAt, subscriptionEndsAt, now);
  return {
    canWrite,
    maxChildren: canWrite ? planChildLimit(plan) : 0,
  };
}

const PAID_PLAN_LABELS: Readonly<Record<PaidPlanId, string>> = {
  solo_monthly: 'Gói Cơ bản · Tháng',
  solo_yearly: 'Gói Cơ bản · Năm',
  monthly: 'Gói Pro · Tháng',
  yearly: 'Gói Pro · Năm',
  pro_plus_monthly: 'Gói Pro Plus · Tháng',
  pro_plus_yearly: 'Gói Pro Plus · Năm',
};

function daysUntil(date: string, now: number): number {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((new Date(date).getTime() - now) / millisecondsPerDay));
}

export function buildSubscriptionDetails(
  plan: SubscriptionPlan,
  trialEndsAt: string | null,
  subscriptionEndsAt: string | null,
  isPro: boolean,
  now = Date.now(),
): SubscriptionDetails {
  let daysRemaining: number | null = null;
  let label = 'Chưa có gói';
  let statusText = 'Chưa kích hoạt dùng thử hoặc gói trả phí';

  if (plan === 'lifetime') {
    label = 'Trọn Đời';
    statusText = '👑 Thành viên Trọn Đời (Vĩnh viễn)';
  } else if (isPaidPlanId(plan)) {
    label = PAID_PLAN_LABELS[plan];
    if (subscriptionEndsAt) {
      daysRemaining = daysUntil(subscriptionEndsAt, now);
      statusText = `${label} (${daysRemaining} ngày còn lại)`;
    } else {
      statusText = `${label} (Đang hoạt động)`;
    }
  } else if (plan === 'trial') {
    label = 'Dùng Thử';
    if (trialEndsAt) {
      daysRemaining = daysUntil(trialEndsAt, now);
      statusText = `Dùng thử Pro (${daysRemaining} ngày còn lại)`;
    } else {
      statusText = 'Dùng thử 7 ngày';
    }
  }

  return { isPro, plan, label, daysRemaining, statusText };
}

/** The free trial is an offer for families without a paid plan; a family already on one is not shown it. */
export function shouldOfferTrial(isPro: boolean, plan: SubscriptionPlan): boolean {
  return !isPro || plan === 'trial';
}

/** What a family has bought on top of its plan; used until the entitlement API has answered. */
export const EMPTY_FAMILY_ADDONS: FamilyAddons = { aiUntil: null, aiIncluded: false, printables: false };

/** Reads the `family_addons_snapshot` result, falling back to no add-ons when it is missing or malformed. */
export function parseFamilyAddons(value: unknown): FamilyAddons {
  if (typeof value !== 'object' || value === null) return EMPTY_FAMILY_ADDONS;
  const { aiUntil, aiIncluded, printables } = value as Record<string, unknown>;
  if ((aiUntil !== null && typeof aiUntil !== 'string') || typeof aiIncluded !== 'boolean' || typeof printables !== 'boolean') {
    return EMPTY_FAMILY_ADDONS;
  }
  return { aiUntil, aiIncluded, printables };
}
