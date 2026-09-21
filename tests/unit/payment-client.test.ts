import { describe, expect, it } from 'vitest';
import {
  createPaymentOrder,
  readPaymentStatus,
  type PaymentRequester,
} from '@/lib/billing/payment-client';

const payment = {
  orderCode: 123456,
  amount: 49000,
  description: 'KIDHABIT 123456',
  accountNumber: '0123456789',
  accountName: 'KIDHABIT HERO',
  bankBin: '970422',
  qrCode: '000201010212',
  vietQrUrl: 'data:image/png;base64,cXJjb2Rl',
  checkoutUrl: 'https://pay.payos.vn/web/123456',
  planId: 'monthly',
} as const;

describe('payment client', () => {
  it('creates a payment from a validated server response', async () => {
    const requester: PaymentRequester = async () => new Response(JSON.stringify({
      success: true,
      payment,
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(createPaymentOrder('monthly', requester)).resolves.toEqual({
      success: true,
      payment,
    });
  });

  it('rejects malformed payment details before rendering a QR code', async () => {
    const requester: PaymentRequester = async () => new Response(JSON.stringify({
      success: true,
      payment: { orderCode: 123456, amount: -1 },
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(createPaymentOrder('monthly', requester)).resolves.toEqual({
      success: false,
      error: 'Failed to create payment.',
    });
  });

  it('preserves a server-declared payment creation error', async () => {
    const requester: PaymentRequester = async () => new Response(JSON.stringify({
      success: false,
      error: 'Authentication required.',
    }), { status: 401, headers: { 'content-type': 'application/json' } });

    await expect(createPaymentOrder('monthly', requester)).resolves.toEqual({
      success: false,
      error: 'Authentication required.',
    });
  });

  it('returns paid only from a validated status response', async () => {
    const requester: PaymentRequester = async () => new Response(JSON.stringify({
      success: true,
      paid: true,
      status: 'PAID',
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(readPaymentStatus(123456, requester)).resolves.toEqual({
      success: true,
      paid: true,
      status: 'PAID',
    });
  });

  it('does not report a malformed or failed status response as pending', async () => {
    const requester: PaymentRequester = async () => new Response(JSON.stringify({
      success: false,
      error: 'Could not read payment status.',
    }), { status: 503, headers: { 'content-type': 'application/json' } });

    await expect(readPaymentStatus(123456, requester)).resolves.toEqual({
      success: false,
      error: 'Could not read payment status.',
    });
  });
});
