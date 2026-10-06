import { describe, expect, it } from 'vitest';
import { buildSubscriptionCapabilities, buildSubscriptionDetails, checkIsPro, shouldOfferTrial } from '@/lib/store/subscription';

const now = Date.parse('2026-09-20T00:00:00.000Z');

describe('subscription domain', () => {
  it('evaluates entitlement expiry without depending on the system clock', () => {
    expect(checkIsPro('lifetime', null, null, now)).toBe(true);
    expect(checkIsPro('monthly', null, null, now)).toBe(false);
    expect(checkIsPro('yearly', null, '2026-09-21T00:00:00.000Z', now)).toBe(true);
    expect(checkIsPro('yearly', null, '2026-09-20T00:00:00.000Z', now)).toBe(false);
    expect(checkIsPro('trial', '2026-09-21T00:00:00.000Z', null, now)).toBe(true);
    expect(checkIsPro('trial', null, null, now)).toBe(false);
    expect(checkIsPro('free', null, null, now)).toBe(false);
  });

  it('preserves labels and rounds remaining partial days upward', () => {
    expect(buildSubscriptionDetails(
      'yearly',
      null,
      '2026-09-21T01:00:00.000Z',
      true,
      now,
    )).toEqual({
      isPro: true,
      plan: 'yearly',
      label: 'Gói Pro · Năm',
      daysRemaining: 2,
      statusText: 'Gói Pro · Năm (2 ngày còn lại)',
    });
  });

  it('clamps expired plan details to zero days remaining', () => {
    expect(buildSubscriptionDetails(
      'trial',
      '2026-09-18T00:00:00.000Z',
      null,
      false,
      now,
    )).toMatchObject({
      isPro: false,
      label: 'Dùng Thử',
      daysRemaining: 0,
      statusText: 'Dùng thử Pro (0 ngày còn lại)',
    });
  });

  it('exposes the child limit for each sellable entitlement', () => {
    expect(buildSubscriptionCapabilities('free', null, null, now)).toEqual({ canWrite: false, maxChildren: 0 });
    expect(buildSubscriptionCapabilities('solo_monthly', null, '2026-10-20T00:00:00.000Z', now)).toEqual({ canWrite: true, maxChildren: 1 });
    expect(buildSubscriptionCapabilities('solo_yearly', null, '2027-09-20T00:00:00.000Z', now)).toEqual({ canWrite: true, maxChildren: 1 });
    expect(buildSubscriptionCapabilities('monthly', null, '2026-10-20T00:00:00.000Z', now)).toEqual({ canWrite: true, maxChildren: 5 });
    expect(buildSubscriptionCapabilities('yearly', null, '2027-09-20T00:00:00.000Z', now)).toEqual({ canWrite: true, maxChildren: 5 });
    expect(buildSubscriptionCapabilities('trial', '2026-10-20T00:00:00.000Z', null, now)).toEqual({ canWrite: true, maxChildren: 5 });
    expect(buildSubscriptionCapabilities('lifetime', null, null, now)).toEqual({ canWrite: true, maxChildren: null });
  });

  it('names each plan the way the pricing page does', () => {
    const ends = '2026-10-20T00:00:00.000Z';
    expect(buildSubscriptionDetails('solo_monthly', null, ends, true, now).label).toBe('Gói 1 bé · Tháng');
    expect(buildSubscriptionDetails('solo_yearly', null, ends, true, now).label).toBe('Gói 1 bé · Năm');
    expect(buildSubscriptionDetails('monthly', null, ends, true, now).label).toBe('Gói Pro · Tháng');
    expect(buildSubscriptionDetails('yearly', null, ends, true, now).label).toBe('Gói Pro · Năm');
    expect(buildSubscriptionDetails('yearly', null, null, true, now).statusText).toBe('Gói Pro · Năm (Đang hoạt động)');
  });
});

describe('free trial offer', () => {
  it('is shown to families without a paid plan and to families already on the trial', () => {
    expect(shouldOfferTrial(false, 'free')).toBe(true);
    expect(shouldOfferTrial(true, 'trial')).toBe(true);
    expect(shouldOfferTrial(false, 'monthly')).toBe(true);
  });
  it('is not shown once a family has a paid plan', () => {
    for (const plan of ['solo_monthly', 'solo_yearly', 'monthly', 'yearly', 'lifetime'] as const) expect(shouldOfferTrial(true, plan)).toBe(false);
  });
});
