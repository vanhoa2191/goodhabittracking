import type { SubscriptionPlan } from '@/types';

export interface SubscriptionDetails {
  isPro: boolean;
  plan: SubscriptionPlan;
  label: string;
  daysRemaining: number | null;
  statusText: string;
}

export function checkIsPro(
  plan: SubscriptionPlan,
  trialEndsAt: string | null,
  subscriptionEndsAt: string | null,
  now = Date.now(),
): boolean {
  if (plan === 'lifetime') return true;
  if (plan === 'monthly' || plan === 'yearly') {
    if (!subscriptionEndsAt) return true;
    return new Date(subscriptionEndsAt).getTime() > now;
  }
  if (plan === 'trial') {
    if (!trialEndsAt) return false;
    return new Date(trialEndsAt).getTime() > now;
  }
  return false;
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
  let label = 'Miễn phí';
  let statusText = 'Gói Miễn Phí (Tối đa 1 bé)';

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
  } else if (plan === 'monthly') {
    label = 'Gói Tháng';
    if (subscriptionEndsAt) {
      daysRemaining = daysUntil(subscriptionEndsAt, now);
      statusText = `Gói Tháng (${daysRemaining} ngày còn lại)`;
    } else {
      statusText = 'Gói Tháng (Đang hoạt động)';
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
