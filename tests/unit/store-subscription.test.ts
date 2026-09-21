import { describe, expect, it } from 'vitest';
import { buildSubscriptionDetails, checkIsPro } from '@/lib/store/subscription';

const now = Date.parse('2026-09-20T00:00:00.000Z');

describe('subscription domain', () => {
  it('evaluates entitlement expiry without depending on the system clock', () => {
    expect(checkIsPro('lifetime', null, null, now)).toBe(true);
    expect(checkIsPro('monthly', null, null, now)).toBe(true);
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
      label: 'Gói Năm',
      daysRemaining: 2,
      statusText: 'Gói Năm (2 ngày còn lại)',
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
});
