import { describe, expect, it } from 'vitest';
import { reduceAnalyticsConsent } from '@/lib/analytics-consent-context';

describe('analytics consent state', () => {
  it('keeps analytics disabled while an opt-in save is pending', () => {
    const state = { displayedEnabled: false, committedEnabled: false };

    const pending = reduceAnalyticsConsent(state, { type: 'save-started', enabled: true });

    expect(pending).toEqual({ displayedEnabled: true, committedEnabled: false });
  });

  it('disables analytics immediately while revocation is pending', () => {
    const state = { displayedEnabled: true, committedEnabled: true };

    const pending = reduceAnalyticsConsent(state, { type: 'save-started', enabled: false });

    expect(pending).toEqual({ displayedEnabled: false, committedEnabled: false });
  });

  it('restores both display and authorization after a failed save', () => {
    const previous = { displayedEnabled: true, committedEnabled: true };
    const pending = reduceAnalyticsConsent(previous, { type: 'save-started', enabled: false });

    const restored = reduceAnalyticsConsent(pending, { type: 'save-failed', previous });

    expect(restored).toEqual(previous);
  });
});
