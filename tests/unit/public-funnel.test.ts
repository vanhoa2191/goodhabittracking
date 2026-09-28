import { describe, expect, it, vi } from 'vitest';
import { parsePublicFunnelEvent, recordConsentedPublicFunnelEvent } from '@/lib/public-funnel';

describe('public funnel privacy boundary', () => {
  it('accepts only the content-free funnel contract', () => {
    expect(parsePublicFunnelEvent({ event: 'landing_view', locale: 'vi', market: 'VN' })).toEqual({ event: 'landing_view', locale: 'vi', market: 'VN' });
    expect(parsePublicFunnelEvent({ event: 'profile_created', childName: 'Bé A' })).toBeNull();
    expect(parsePublicFunnelEvent({ event: 'checkout_started', plan: 'trial', email: 'parent@example.test' })).toBeNull();
  });

  it('does not emit without both explicit consent and a configured sink', () => {
    const sink = vi.fn();
    expect(recordConsentedPublicFunnelEvent({ payload: { event: 'trial_started' }, hasExplicitConsent: false, sink })).toBe(false);
    expect(recordConsentedPublicFunnelEvent({ payload: { event: 'trial_started' }, hasExplicitConsent: true })).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it('emits a valid event after consent when a sink is deliberately configured', () => {
    const sink = vi.fn();
    expect(recordConsentedPublicFunnelEvent({ payload: { event: 'checkout_started', plan: 'monthly' }, hasExplicitConsent: true, sink })).toBe(true);
    expect(sink).toHaveBeenCalledWith({ event: 'checkout_started', plan: 'monthly' });
  });
});
