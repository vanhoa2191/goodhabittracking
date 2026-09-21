import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createPayOSPayment } from '@/lib/billing/payos-server';

const providerPayment = {
  bin: '970422',
  accountNumber: '113366668888',
  accountName: 'KIDHABIT HERO',
  amount: 49000,
  description: 'KIDHABIT 123456',
  orderCode: 123456,
  currency: 'VND',
  paymentLinkId: 'payos-link-123456',
  status: 'PENDING',
  checkoutUrl: 'https://pay.payos.vn/web/payos-link-123456',
  qrCode: '00020101021238570010A000000727',
} as const;

describe('payOS payment creation', () => {
  beforeEach(() => {
    vi.stubEnv('PAYOS_CLIENT_ID', 'client-current');
    vi.stubEnv('PAYOS_API_KEY', 'api-current');
    vi.stubEnv('PAYOS_CHECKSUM_KEY', 'checksum-current');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://kidhabit.example');
  });

  it('returns exact provider account and transaction values without inventing a bank name', async () => {
    // Given
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      code: '00',
      desc: 'success',
      data: providerPayment,
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    // When
    const payment = await createPayOSPayment({ planId: 'monthly', orderCode: 123456 });

    // Then
    expect(payment).toMatchObject({
      orderCode: providerPayment.orderCode,
      amount: providerPayment.amount,
      description: providerPayment.description,
      accountNumber: providerPayment.accountNumber,
      accountName: providerPayment.accountName,
      bankBin: providerPayment.bin,
      qrCode: providerPayment.qrCode,
      checkoutUrl: providerPayment.checkoutUrl,
    });
    expect(payment).not.toHaveProperty('bankName');
    expect(payment.vietQrUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('rejects provider transaction values that differ from the server-owned order', async () => {
    // Given
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      code: '00',
      desc: 'success',
      data: { ...providerPayment, amount: providerPayment.amount + 1 },
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    // When / Then
    await expect(createPayOSPayment({ planId: 'monthly', orderCode: 123456 }))
      .rejects.toThrow('PayOS returned payment details that do not match the order.');
  });
});
