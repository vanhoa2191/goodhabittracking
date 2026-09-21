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
  bin: z.string().min(1),
  bankName: z.string().min(1),
  qrCode: z.string().min(1),
  vietQrUrl: z.string().min(1),
  checkoutUrl: z.string().url(),
  planId: paidPlanSchema,
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

export type CreatePaymentResult =
  | { readonly success: true; readonly payment: PaymentResult }
  | { readonly success: false; readonly error: string };

export type PaymentStatusResult =
  | { readonly success: true; readonly paid: boolean; readonly status: string }
  | { readonly success: false; readonly error: string };

export async function createPaymentOrder(
  planId: SubscriptionPlan,
  requester: PaymentRequester = globalThis.fetch,
): Promise<CreatePaymentResult> {
  const request = createPaymentRequestSchema.safeParse({ planId });
  if (!request.success) return { success: false, error: 'Invalid payment plan.' };

  try {
    const response = await requester('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data),
    });
    const input: unknown = await response.json();
    const parsed = createPaymentResponseSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Failed to create payment.' };
    if (!response.ok || !parsed.data.success) {
      return {
        success: false,
        error: parsed.data.success ? 'Failed to create payment.' : parsed.data.error,
      };
    }
    return { success: true, payment: parsed.data.payment };
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      return { success: false, error: 'Error connecting to payment server.' };
    }
    if (error instanceof SyntaxError) {
      return { success: false, error: 'Failed to create payment.' };
    }
    throw error;
  }
}

export async function readPaymentStatus(
  orderCode: number,
  requester: PaymentRequester = globalThis.fetch,
): Promise<PaymentStatusResult> {
  const request = paymentStatusRequestSchema.safeParse({ orderCode });
  if (!request.success) return { success: false, error: 'Invalid status request.' };

  try {
    const response = await requester('/api/payment/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data),
    });
    const input: unknown = await response.json();
    const parsed = paymentStatusResponseSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: 'Could not read payment status.' };
    if (!response.ok || !parsed.data.success) {
      return {
        success: false,
        error: parsed.data.success ? 'Could not read payment status.' : parsed.data.error,
      };
    }
    return parsed.data;
  } catch (error: unknown) {
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return { success: false, error: 'Could not read payment status.' };
    }
    throw error;
  }
}
