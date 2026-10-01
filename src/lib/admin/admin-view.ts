// Pure helpers behind the admin screen, so the grouping and the labels it shows can be tested.

export const ADMIN_TABS = [
  { id: 'tong-quan', label: 'Tổng quan' },
  { id: 'khach-hang', label: 'Khách hàng' },
  { id: 'thanh-toan', label: 'Thanh toán' },
  { id: 'coupon', label: 'Coupon' },
  { id: 'gioi-thieu', label: 'Giới thiệu' },
  { id: 'phieu', label: 'Phễu kích hoạt' },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]['id'];

export const DEFAULT_ADMIN_TAB: AdminTabId = 'tong-quan';

/** The tab named by a URL hash such as "#khach-hang"; anything else opens the overview. */
export function parseAdminTab(hash: string): AdminTabId {
  const id = hash.replace(/^#/, '');
  return ADMIN_TABS.find((tab) => tab.id === id)?.id ?? DEFAULT_ADMIN_TAB;
}

export type SubscriptionView = {
  readonly plan: 'free' | 'trial' | 'solo_monthly' | 'monthly' | 'yearly' | 'lifetime';
  readonly status: 'active' | 'inactive' | 'cancelled';
  readonly subscription_ends_at: string | null;
  readonly trial_ends_at: string | null;
};

export const PLAN_LABELS: Readonly<Record<SubscriptionView['plan'], string>> = {
  free: 'Chưa có gói',
  trial: 'Dùng thử',
  solo_monthly: 'Gói Một Bé',
  monthly: 'Gia Đình · Tháng',
  yearly: 'Gia Đình · Năm',
  lifetime: 'Trọn đời',
};

export type Tone = 'good' | 'warn' | 'bad' | 'neutral';

export type ExpiryView = { readonly label: string; readonly tone: Tone; readonly daysLeft: number | null };

const DAY_MS = 86_400_000;

/** How close a subscription is to running out, in words an admin can scan down a list. */
export function describeExpiry(subscription: SubscriptionView | null, now: Date): ExpiryView {
  if (!subscription || subscription.plan === 'free') return { label: 'Chưa có gói', tone: 'neutral', daysLeft: null };
  if (subscription.status === 'cancelled') return { label: 'Đã hủy', tone: 'bad', daysLeft: null };
  if (subscription.status !== 'active') return { label: 'Chưa hoạt động', tone: 'neutral', daysLeft: null };
  if (subscription.plan === 'lifetime') return { label: 'Không hết hạn', tone: 'good', daysLeft: null };
  const end = subscription.plan === 'trial' ? subscription.trial_ends_at : subscription.subscription_ends_at;
  if (!end) return { label: 'Chưa đặt ngày hết hạn', tone: 'warn', daysLeft: null };
  const remaining = Date.parse(end) - now.getTime();
  if (!Number.isFinite(remaining)) return { label: 'Ngày hết hạn không hợp lệ', tone: 'warn', daysLeft: null };
  if (remaining <= 0) return { label: 'Đã hết hạn', tone: 'bad', daysLeft: 0 };
  const daysLeft = Math.ceil(remaining / DAY_MS);
  if (daysLeft <= 7) return { label: `Còn ${daysLeft} ngày`, tone: 'warn', daysLeft };
  return { label: `Còn ${daysLeft} ngày`, tone: 'good', daysLeft };
}

export const CUSTOMER_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'paying', label: 'Trả phí' },
  { id: 'trial', label: 'Dùng thử' },
  { id: 'expiring', label: 'Sắp hết hạn' },
  { id: 'none', label: 'Chưa có gói' },
] as const;

export type CustomerFilterId = (typeof CUSTOMER_FILTERS)[number]['id'];

export type CustomerView = {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone: string;
  readonly tags: readonly string[];
  readonly familyId: string | null;
  readonly subscription: SubscriptionView | null;
};

const PAID_PLANS = new Set<SubscriptionView['plan']>(['solo_monthly', 'monthly', 'yearly', 'lifetime']);

export function matchesFilter(customer: CustomerView, filter: CustomerFilterId, now: Date): boolean {
  const subscription = customer.subscription;
  const active = subscription?.status === 'active';
  switch (filter) {
    case 'all':
      return true;
    case 'paying':
      // A paid plan that has run out is not paying any more, whatever its status says.
      return Boolean(active && subscription && PAID_PLANS.has(subscription.plan) && describeExpiry(subscription, now).tone !== 'bad');
    case 'trial':
      return Boolean(active && subscription?.plan === 'trial');
    case 'expiring': {
      const { daysLeft, tone } = describeExpiry(subscription, now);
      return tone === 'warn' && daysLeft !== null;
    }
    case 'none':
      return !subscription || subscription.plan === 'free';
  }
}

export function matchesQuery(customer: CustomerView, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [customer.fullName, customer.email, customer.phone, ...customer.tags]
    .some((value) => value.toLowerCase().includes(needle));
}

export function countByFilter(customers: readonly CustomerView[], now: Date): Record<CustomerFilterId, number> {
  const counts: Record<CustomerFilterId, number> = { all: 0, paying: 0, trial: 0, expiring: 0, none: 0 };
  for (const customer of customers) {
    for (const filter of CUSTOMER_FILTERS) {
      if (matchesFilter(customer, filter.id, now)) counts[filter.id] += 1;
    }
  }
  return counts;
}

/** Shown in the list: the first page of matches, with the number still hidden. */
export function pageOf<T>(items: readonly T[], limit: number): { readonly shown: readonly T[]; readonly hidden: number } {
  return { shown: items.slice(0, limit), hidden: Math.max(0, items.length - limit) };
}

const PLAN_DAYS: Readonly<Partial<Record<SubscriptionView['plan'], number>>> = { solo_monthly: 31, monthly: 31, yearly: 366, trial: 7 };

/**
 * What choosing a plan in the admin screen should set. A plan only takes effect while its status is active, so
 * picking one turns it on and starts a full period from today (the admin can still edit the date or cancel);
 * picking "no plan" switches it off.
 */
export function planChangePatch(plan: SubscriptionView['plan'], now: Date): Pick<SubscriptionView, 'plan' | 'status' | 'subscription_ends_at' | 'trial_ends_at'> {
  if (plan === 'free') return { plan, status: 'inactive', subscription_ends_at: null, trial_ends_at: null };
  const days = PLAN_DAYS[plan];
  if (!days) return { plan, status: 'active', subscription_ends_at: null, trial_ends_at: null };
  const end = new Date(now.getTime() + days * DAY_MS).toISOString();
  return plan === 'trial'
    ? { plan, status: 'active', subscription_ends_at: null, trial_ends_at: end }
    : { plan, status: 'active', subscription_ends_at: end, trial_ends_at: null };
}
