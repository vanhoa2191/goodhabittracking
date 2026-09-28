import { describe, expect, it } from 'vitest';
import { sanitizeEvent } from '@/lib/observability/logger';

describe('operational event redaction', () => {
  it('does not let profile, child, payment or pairing canaries leave the process', () => {
    const serialized = JSON.stringify(sanitizeEvent({
      operation: 'profile_failure',
      reasonCode: 'child@example.com',
      route: '/api/pairing/exchange?code=PAIR-SECRET',
      correlationId: 'not-a-uuid-0911222333',
      status: 503,
      durationMs: 14,
      childName: 'CANARY_CHILD',
      phone: '0911222333',
      orderCode: 'PAYMENT-SECRET',
      pairingCode: 'PAIR-SECRET',
      error: new Error('private support note'),
    }));

    expect(serialized).not.toMatch(/child@example\.com|0911222333|CANARY_CHILD|PAYMENT-SECRET|PAIR-SECRET|private support note/i);
    expect(JSON.parse(serialized)).toEqual({
      operation: 'profile_failure',
      reasonCode: 'redacted',
      route: 'redacted',
      correlationId: 'redacted',
      status: 503,
      durationMs: 14,
    });
  });
});
