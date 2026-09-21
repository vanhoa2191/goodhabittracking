import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { inspectPayOSConfig, requireSafePayOSConfig } from '@/lib/billing/payos-config';

const completeEnvironment = {
  PAYOS_CLIENT_ID: 'client-current',
  PAYOS_API_KEY: 'api-current',
  PAYOS_CHECKSUM_KEY: 'checksum-current',
};

describe('PayOS configuration safety', () => {
  it('reports every missing payment credential without exposing values', () => {
    expect(inspectPayOSConfig({ PAYOS_CLIENT_ID: 'client-current' })).toEqual({
      ready: false,
      reason: 'missing',
      missing: ['PAYOS_API_KEY', 'PAYOS_CHECKSUM_KEY'],
    });
  });

  it('rejects a credential whose fingerprint is on the compromised denylist', () => {
    const compromised = createHash('sha256').update('api-current').digest('hex');
    const readiness = inspectPayOSConfig(completeEnvironment, new Set([compromised]));

    expect(readiness).toEqual({ ready: false, reason: 'compromised' });
    expect(() => requireSafePayOSConfig(completeEnvironment, new Set([compromised])))
      .toThrow('PayOS credential rotation is required.');
  });

  it('returns trimmed credentials only when the complete set is safe', () => {
    expect(requireSafePayOSConfig({
      PAYOS_CLIENT_ID: ' client-current ',
      PAYOS_API_KEY: ' api-current ',
      PAYOS_CHECKSUM_KEY: ' checksum-current ',
    }, new Set())).toEqual(completeEnvironment);
  });
});
