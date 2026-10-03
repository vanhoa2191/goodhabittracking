import { z } from 'zod';
import type { PaymentResult } from '@/lib/payos';
import {
  createPaymentRequestSchema,
  paidPlanSchema,
  paymentStatusRequestSchema,
} from '@/lib/billing/schemas';
import type { SubscriptionPlan } from '@/types';

const paymentSchema = z.object({
  orderCode: z.number().int().positive(),
  amount: z.number().int().positive(),
  description: z.string().min(1),
  accountNumber: z.string().min(1),
  accountName: z.string().min(1),
  bankBin: z.string().min(1),
  bankName: z.string().min(1),
  qrCode: z.string().min(1),
  vietQrUrl: z.string().min(1),
  checkoutUrl: z.string().url(),
  planId: paidPlanSchema,
  listPrice: z.number().int().positive().optional(),
  discountPercent: z.number().int().min(1).max(50).optional(),
});

const createPaymentResponseSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), payment: paymentSchema }),
  z.object({ success: z.literal(false), error: z.string().min(1) }),
]);

const paymentStatusResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    paid: z.boolean(),
    status: z.string().min(1),
  }),
  z.object({ success: z.literal(false), error: z.string().min(1) }),
]);

export type PaymentRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type PaymentErrorCode = 'invalid_plan' | 'create_failed' | 'network' | 'auth_required'
  | 'invalid_request' | 'service_unavailable' | 'status_failed' | 'order_not_found';

function paymentError(status: number, input: unknown, step: 'create' | 'status'): PaymentErrorCode {
  const message = typeof input === 'object' && input !== null && 'error' in input ? input.error : null;
  if (status === 401 || message === 'Authentication required.') return 'auth_required';
  if (status === 400 || status === 403 || message === 'Invalid payment request.' || message === 'Invalid status request.') return 'invalid_request';
  if (status === 404 || message === 'Payment order not found.') return 'order_not_found';
  if (message === 'Could not read payment status.') return 'status_failed';
  if (status === 503 || message === 'Payment service is temporarily unavailable.') {
    return step === 'create' ? 'service_unavailable' : 'status_failed';
  }
  return step === 'create' ? 'create_failed' : 'status_failed';
}

export type CreatePaymentResult =
  | { readonly success: true; readonly payment: PaymentResult }
  | { readonly success: false; readonly error: PaymentErrorCode };

export type PaymentStatusResult =
  | { readonly success: true; readonly paid: boolean; readonly status: string }
  | { readonly success: false; readonly error: PaymentErrorCode };

export async function createPaymentOrder(
  planId: SubscriptionPlan,
  requester: PaymentRequester = globalThis.fetch,
): Promise<CreatePaymentResult> {
  const request = createPaymentRequestSchema.safeParse({ planId });
  if (!request.success) return { success: false, error: 'invalid_plan' };

  try {
    const response = await requester('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data),
    });
    const input: unknown = await response.json().catch(() => null);
    const parsed = createPaymentResponseSchema.safeParse(input);
    if (!response.ok || !parsed.success || !parsed.data.success) {
      return {
        success: false,
        error: paymentError(response.status, input, 'create'),
      };
    }
    return { success: true, payment: parsed.data.payment };
  } catch {
    return { success: false, error: 'network' };
  }
}

export async function readPaymentStatus(
  orderCode: number,
  requester: PaymentRequester = globalThis.fetch,
): Promise<PaymentStatusResult> {
  const request = paymentStatusRequestSchema.safeParse({ orderCode });
  if (!request.success) return { success: false, error: 'invalid_request' };

  try {
    const response = await requester('/api/payment/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data),
    });
    const input: unknown = await response.json().catch(() => null);
    const parsed = paymentStatusResponseSchema.safeParse(input);
    if (!response.ok || !parsed.success || !parsed.data.success) {
      return {
        success: false,
        error: paymentError(response.status, input, 'status'),
      };
    }
    return parsed.data;
  } catch {
    return { success: false, error: 'network' };
  }
}
