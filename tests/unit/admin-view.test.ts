import { describe, expect, it } from 'vitest';
import {
  ADMIN_TABS,
  countByFilter,
  describeExpiry,
  matchesFilter,
  matchesQuery,
  pageOf,
  planChangePatch,
  parseAdminTab,
  type CustomerView,
  type SubscriptionView,
} from '@/lib/admin/admin-view';

const now = new Date('2026-10-01T00:00:00.000Z');
const plus = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();

const subscription = (patch: Partial<SubscriptionView>): SubscriptionView => ({
  plan: 'monthly', status: 'active', subscription_ends_at: plus(20), trial_ends_at: null, ...patch,
});
const customer = (id: string, sub: SubscriptionView | null, patch: Partial<CustomerView> = {}): CustomerView => ({
  id, email: `${id}@example.com`, fullName: `Khách ${id}`, phone: '0900000000', tags: [], familyId: `family-${id}`, subscription: sub, ...patch,
});

describe('admin tabs', () => {
  it('opens the tab named by the hash and falls back to the overview', () => {
    for (const tab of ADMIN_TABS) expect(parseAdminTab(`#${tab.id}`)).toBe(tab.id);
    expect(parseAdminTab('')).toBe('tong-quan');
    expect(parseAdminTab('#khong-co')).toBe('tong-quan');
    expect(parseAdminTab('#__proto__')).toBe('tong-quan');
  });
});

describe('describeExpiry', () => {
  it('reads a paid plan by days left, warning in the last week', () => {
    expect(describeExpiry(subscription({ subscription_ends_at: plus(20) }), now)).toMatchObject({ label: 'Còn 20 ngày', tone: 'good', daysLeft: 20 });
    expect(describeExpiry(subscription({ subscription_ends_at: plus(7) }), now)).toMatchObject({ tone: 'warn', daysLeft: 7 });
    expect(describeExpiry(subscription({ subscription_ends_at: plus(-1) }), now)).toMatchObject({ label: 'Đã hết hạn', tone: 'bad' });
  });
  it('uses the trial end for a trial and never expires a lifetime plan', () => {
    expect(describeExpiry(subscription({ plan: 'trial', trial_ends_at: plus(3), subscription_ends_at: null }), now)).toMatchObject({ daysLeft: 3, tone: 'warn' });
    expect(describeExpiry(subscription({ plan: 'lifetime', subscription_ends_at: null }), now)).toMatchObject({ label: 'Không hết hạn', tone: 'good' });
  });
  it('describes missing, inactive, cancelled and malformed subscriptions without guessing', () => {
    expect(describeExpiry(null, now).label).toBe('Chưa có gói');
    expect(describeExpiry(subscription({ plan: 'free' }), now).label).toBe('Chưa có gói');
    expect(describeExpiry(subscription({ status: 'cancelled' }), now)).toMatchObject({ label: 'Đã hủy', tone: 'bad' });
    expect(describeExpiry(subscription({ status: 'inactive' }), now).label).toBe('Chưa hoạt động');
    expect(describeExpiry(subscription({ subscription_ends_at: null }), now).tone).toBe('warn');
    expect(describeExpiry(subscription({ subscription_ends_at: 'not a date' }), now).tone).toBe('warn');
  });
});

describe('customer filters', () => {
  const list = [
    customer('a', subscription({ plan: 'yearly', subscription_ends_at: plus(200) })),
    customer('b', subscription({ plan: 'trial', trial_ends_at: plus(5), subscription_ends_at: null })),
    customer('c', subscription({ plan: 'monthly', subscription_ends_at: plus(2) })),
    customer('d', null),
    customer('e', subscription({ plan: 'monthly', status: 'cancelled' })),
  ];
  it('groups the list the way an admin triages it', () => {
    const ids = (filter: Parameters<typeof matchesFilter>[1]) => list.filter((item) => matchesFilter(item, filter, now)).map((item) => item.id);
    expect(ids('all')).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(ids('paying')).toEqual(['a', 'c']);
    expect(ids('trial')).toEqual(['b']);
    expect(ids('expiring')).toEqual(['b', 'c']);
    expect(ids('none')).toEqual(['d']);
  });
  it('counts each group for the filter chips', () => {
    expect(countByFilter(list, now)).toEqual({ all: 5, paying: 2, trial: 1, expiring: 2, none: 1 });
  });
  it('searches name, email, phone and tags ignoring case and spaces', () => {
    const target = customer('x', null, { fullName: 'Nguyễn An', phone: '0911222333', tags: ['ưu tiên'] });
    for (const query of ['nguyễn', 'X@EXAMPLE', '0911', 'ƯU TIÊN', '  an  ', '']) expect(matchesQuery(target, query)).toBe(true);
    expect(matchesQuery(target, 'không có')).toBe(false);
  });
  it('pages a long list and reports how many are hidden', () => {
    const items = Array.from({ length: 30 }, (_, index) => index);
    expect(pageOf(items, 25)).toEqual({ shown: items.slice(0, 25), hidden: 5 });
    expect(pageOf(items, 50)).toEqual({ shown: items, hidden: 0 });
  });
});

describe('planChangePatch', () => {
  it('turns a chosen paid plan on and starts a full period from today', () => {
    const monthly = planChangePatch('monthly', now);
    expect(monthly).toMatchObject({ plan: 'monthly', status: 'active', trial_ends_at: null });
    expect(Date.parse(monthly.subscription_ends_at!) - now.getTime()).toBe(31 * 86_400_000);
    expect(Date.parse(planChangePatch('yearly', now).subscription_ends_at!) - now.getTime()).toBe(366 * 86_400_000);
    expect(planChangePatch('solo_monthly', now).status).toBe('active');
  });
  it('puts a trial end on the trial and not on the paid end', () => {
    const trial = planChangePatch('trial', now);
    expect(trial).toMatchObject({ plan: 'trial', status: 'active', subscription_ends_at: null });
    expect(Date.parse(trial.trial_ends_at!) - now.getTime()).toBe(7 * 86_400_000);
  });
  it('gives a lifetime plan no end date and switches "no plan" off', () => {
    expect(planChangePatch('lifetime', now)).toEqual({ plan: 'lifetime', status: 'active', subscription_ends_at: null, trial_ends_at: null });
    expect(planChangePatch('free', now)).toEqual({ plan: 'free', status: 'inactive', subscription_ends_at: null, trial_ends_at: null });
  });
  it('is what an admin needs after choosing a plan for a customer who had none', () => {
    const patch = planChangePatch('monthly', now);
    expect(describeExpiry({ ...patch }, now)).toMatchObject({ tone: 'good', label: 'Còn 31 ngày' });
  });
});
