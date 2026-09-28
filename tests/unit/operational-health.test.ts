import { describe, expect, it } from 'vitest';
import { evaluateOperationalHealth } from '@/lib/observability/operational-health';

describe('operational alert thresholds', () => {
  it('stays quiet below every threshold', () => {
    expect(evaluateOperationalHealth({
      paymentWebhookFailures: 2,
      profileMutationFailures: 4,
      pairingFailures: 19,
      deadLetters: 0,
      stuckOutbox: 0,
    })).toEqual({ ready: true, alerts: [] });
  });

  it('reports every signal that reaches its threshold', () => {
    const result = evaluateOperationalHealth({
      paymentWebhookFailures: 3,
      profileMutationFailures: 5,
      pairingFailures: 20,
      deadLetters: 1,
      stuckOutbox: 1,
    });
    expect(result.ready).toBe(false);
    expect(result.alerts.map((alert) => alert.signal)).toEqual([
      'paymentWebhookFailures',
      'profileMutationFailures',
      'pairingFailures',
      'deadLetters',
      'stuckOutbox',
    ]);
  });
});
