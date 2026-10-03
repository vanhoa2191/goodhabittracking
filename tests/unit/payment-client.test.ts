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
  bankName: 'MBBank · Ngân hàng TMCP Quân đội',
  qrCode: '000201010212',
  vietQrUrl: 'data:image/png;base64,cXJjb2Rl',
  checkoutUrl: 'https://pay.payos.vn/web/123456',
  planId: 'monthly',
} as const;

describe('payment client', () => {
  it.each([
    [401, 'Authentication required.', 'auth_required', 'auth_required'],
    [400, 'Invalid payment request.', 'invalid_request', 'invalid_request'],
    [400, 'Invalid status request.', 'invalid_request', 'invalid_request'],
    [403, 'Parent PIN required.', 'invalid_request', 'invalid_request'],
    [503, 'Payment service is temporarily unavailable.', 'service_unavailable', 'status_failed'],
    [503, 'Could not read payment status.', 'status_failed', 'status_failed'],
    [404, 'Payment order not found.', 'order_not_found', 'order_not_found'],
    [500, 'Unknown error from provider.', 'create_failed', 'status_failed'],
    [200, 'Authentication required.', 'auth_required', 'auth_required'],
    [200, 'Invalid payment request.', 'invalid_request', 'invalid_request'],
    [200, 'Invalid status request.', 'invalid_request', 'invalid_request'],
    [200, 'Payment service is temporarily unavailable.', 'service_unavailable', 'status_failed'],
    [200, 'Could not read payment status.', 'status_failed', 'status_failed'],
    [200, 'Payment order not found.', 'order_not_found', 'order_not_found'],
  ])('maps HTTP %s and %s without returning server copy', async (status, error, createCode, statusCode) => {
    const requester: PaymentRequester = async () => new Response(JSON.stringify({ success: false, error }), { status });
    await expect(createPaymentOrder('monthly', requester)).resolves.toEqual({ success: false, error: createCode });
    await expect(readPaymentStatus(123456, requester)).resolves.toEqual({ success: false, error: statusCode });
  });

  it.each([
    [401, 'auth_required', 'auth_required'],
    [400, 'invalid_request', 'invalid_request'],
    [403, 'invalid_request', 'invalid_request'],
    [404, 'order_not_found', 'order_not_found'],
    [503, 'service_unavailable', 'status_failed'],
    [502, 'create_failed', 'status_failed'],
    [200, 'create_failed', 'status_failed'],
  ])('maps HTTP %s even when the body is not JSON', async (status, createCode, statusCode) => {
    const requester: PaymentRequester = async () => new Response('<html>unavailable</html>', { status });
    await expect(createPaymentOrder('monthly', requester)).resolves.toEqual({ success: false, error: createCode });
    await expect(readPaymentStatus(123456, requester)).resolves.toEqual({ success: false, error: statusCode });
  });

  it('rejects invalid inputs without calling the server', async () => {
    const requester: PaymentRequester = async () => { throw new Error('Must not request'); };
    await expect(createPaymentOrder('free', requester)).resolves.toEqual({ success: false, error: 'invalid_plan' });
    await expect(readPaymentStatus(-1, requester)).resolves.toEqual({ success: false, error: 'invalid_request' });
  });

  it.each([new TypeError('offline'), new Error('aborted')])('returns a stable network error for %s', async (error) => {
    const requester: PaymentRequester = async () => { throw error; };
    await expect(createPaymentOrder('monthly', requester)).resolves.toEqual({ success: false, error: 'network' });
    await expect(readPaymentStatus(123456, requester)).resolves.toEqual({ success: false, error: 'network' });
  });

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
      error: 'create_failed',
    });
  });

  it('maps a server-declared payment creation error', async () => {
    const requester: PaymentRequester = async () => new Response(JSON.stringify({
      success: false,
      error: 'Authentication required.',
    }), { status: 401, headers: { 'content-type': 'application/json' } });

    await expect(createPaymentOrder('monthly', requester)).resolves.toEqual({
      success: false,
      error: 'auth_required',
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
      error: 'status_failed',
    });
  });
});
