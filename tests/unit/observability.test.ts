import { describe, expect, it, vi } from 'vitest';
import { logOperationalEvent, sanitizeEvent } from '@/lib/observability/logger';

describe('operational telemetry redaction', () => {
  it('keeps only allowlisted non-sensitive fields', () => {
    expect(sanitizeEvent({
      operation: 'payment_webhook',
      reasonCode: 'signature_invalid',
      correlationId: 'trace-1',
      token: 'secret',
      email: 'child@example.com',
      payload: { apiKey: 'secret' },
    })).toEqual({
      operation: 'payment_webhook',
      reasonCode: 'signature_invalid',
      correlationId: 'trace-1',
    });
  });

  it('writes structured JSON without rejected values', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logOperationalEvent('error', { operation: 'pairing', reasonCode: 'denied', token: 'secret' });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('"operation":"pairing"');
    expect(spy.mock.calls[0][0]).not.toContain('secret');
  });
});
