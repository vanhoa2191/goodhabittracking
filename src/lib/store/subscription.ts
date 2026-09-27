import type { SubscriptionPlan } from '@/types';

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
  if (plan === 'solo_monthly' || plan === 'monthly' || plan === 'yearly') {
    if (!subscriptionEndsAt) return true;
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
    maxChildren: canWrite && plan === 'solo_monthly' ? 1 : canWrite ? null : 0,
  };
}

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
  } else if (plan === 'yearly') {
    label = 'Gói Năm';
    if (subscriptionEndsAt) {
      daysRemaining = daysUntil(subscriptionEndsAt, now);
      statusText = `Gói Năm (${daysRemaining} ngày còn lại)`;
    } else {
      statusText = 'Gói Năm (Đang hoạt động)';
    }
  } else if (plan === 'solo_monthly') {
    label = 'Gói Một Bé';
    if (subscriptionEndsAt) {
      daysRemaining = daysUntil(subscriptionEndsAt, now);
      statusText = `Gói Một Bé (${daysRemaining} ngày còn lại)`;
    } else {
      statusText = 'Gói Một Bé (Đang hoạt động)';
    }
  } else if (plan === 'monthly') {
    label = 'Gói Gia Đình · Tháng';
    if (subscriptionEndsAt) {
      daysRemaining = daysUntil(subscriptionEndsAt, now);
      statusText = `Gói Gia Đình · Tháng (${daysRemaining} ngày còn lại)`;
    } else {
      statusText = 'Gói Gia Đình · Tháng (Đang hoạt động)';
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
