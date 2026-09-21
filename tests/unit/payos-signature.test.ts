import { describe, expect, it } from 'vitest';
import { createPayOSSignature, verifyPayOSWebhook } from '@/lib/billing/payos-signature';

describe('PayOS signature canonicalization', () => {
  const key = 'test-checksum-key';
  const data = {
    orderCode: 123,
    amount: 49000,
    description: 'KIDHABIT 123',
    nullable: null,
  };

  it('sorts fields and signs null as an empty string', () => {
    expect(createPayOSSignature(data, key)).toBe(
      '9f93236a42cb27a0711442f32b232b309327808458a16cd2ac22b6ff5e935743'
    );
  });

  it('matches PayOS sentinel and undefined-field canonicalization', () => {
    expect(createPayOSSignature({
      orderCode: 123,
      nullable: 'null',
      omitted: undefined,
    }, key)).toBe('1684b845035933f31db53eab4177bfef6e08e7e83ee5d904c27fc9b72f4e9ee0');
  });

  it('rejects malformed signatures', () => {
    const signature = createPayOSSignature(data, key);
    expect(verifyPayOSWebhook(data, signature, key)).toBe(true);
    expect(verifyPayOSWebhook(data, '00', key)).toBe(false);
  });
});
