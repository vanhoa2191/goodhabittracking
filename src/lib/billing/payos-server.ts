import 'server-only';

import QRCode from 'qrcode';
import { z } from 'zod';
import {
  createPayOSSignature as signPayOSData,
  verifyPayOSWebhook as verifyPayOSData,
} from '@/lib/billing/payos-signature';
import { getPricingPlan, type PaymentResult } from '@/lib/payos';
import type { PaidPlan } from '@/lib/billing/schemas';
import { requireSafePayOSConfig } from '@/lib/billing/payos-config';
import { resolveVietQrBankName } from '@/lib/billing/vietqr-bank-directory';
import { getAppOrigin } from '@/lib/site';

const payOSResponseSchema = z.object({
  code: z.string(),
  desc: z.string().optional(),
  data: z
    .object({
      accountNumber: z.string(),
      accountName: z.string(),
      bin: z.string(),
      amount: z.number().int().positive(),
      description: z.string().min(1),
      orderCode: z.number().int().positive(),
      qrCode: z.string(),
      checkoutUrl: z.string().url(),
      paymentLinkId: z.string(),
    })
    .optional(),
});

const payOSCancellationSchema = z.object({
  code: z.string(),
  data: z.object({ status: z.string() }).optional(),
});

export function createPayOSSignature(data: Record<string, unknown>, checksumKey?: string): string {
  const key = checksumKey ?? requireSafePayOSConfig().PAYOS_CHECKSUM_KEY;
  return signPayOSData(data, key);
}

export function verifyPayOSWebhook(
  data: Record<string, unknown>,
  signature: string,
  checksumKey?: string
): boolean {
  const key = checksumKey ?? requireSafePayOSConfig().PAYOS_CHECKSUM_KEY;
  return verifyPayOSData(data, signature, key);
}

export async function createPayOSPayment(input: {
  planId: PaidPlan;
  orderCode: number;
  /** The amount to charge when it differs from the list price (a referral discount); defaults to the plan price. */
  amount?: number;
}): Promise<PaymentResult & { paymentLinkId: string }> {
  const {
    PAYOS_CLIENT_ID: clientId,
    PAYOS_API_KEY: apiKey,
    PAYOS_CHECKSUM_KEY: checksumKey,
  } = requireSafePayOSConfig();
  const plan = getPricingPlan(input.planId);
  const amount = input.amount ?? plan.price;
  const description = `KIDHABIT ${input.orderCode}`.slice(0, 25);
  const returnUrlValue = new URL('/checkout', getAppOrigin());
  returnUrlValue.searchParams.set('payment', 'success');
  returnUrlValue.searchParams.set('orderCode', String(input.orderCode));
  const cancelUrlValue = new URL('/checkout', getAppOrigin());
  cancelUrlValue.searchParams.set('payment', 'cancel');
  cancelUrlValue.searchParams.set('orderCode', String(input.orderCode));
  const returnUrl = returnUrlValue.toString();
  const cancelUrl = cancelUrlValue.toString();
  const signatureFields = {
    amount,
    cancelUrl,
    description,
    orderCode: input.orderCode,
    returnUrl,
  };

  const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
    method: 'POST',
    headers: {
      'x-client-id': clientId,
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...signatureFields,
      items: [{ name: plan.name, quantity: 1, price: amount }],
      signature: createPayOSSignature(signatureFields, checksumKey),
    }),
  });

  const parsed = payOSResponseSchema.safeParse(await response.json());
  if (!response.ok || !parsed.success || parsed.data.code !== '00' || !parsed.data.data) {
    throw new Error('PayOS rejected the payment request.');
  }

  const provider = parsed.data.data;
  if (
    provider.orderCode !== input.orderCode
    || provider.amount !== amount
    || provider.description !== description
  ) {
    throw new Error('PayOS returned payment details that do not match the order.');
  }

  const [bankName, vietQrUrl] = await Promise.all([
    resolveVietQrBankName(provider.bin),
    QRCode.toDataURL(provider.qrCode, { width: 448, margin: 1 }),
  ]);

  return {
    orderCode: provider.orderCode,
    amount: provider.amount,
    description: provider.description,
    accountNumber: provider.accountNumber,
    accountName: provider.accountName,
    bankBin: provider.bin,
    bankName,
    qrCode: provider.qrCode,
    vietQrUrl,
    checkoutUrl: provider.checkoutUrl,
    paymentLinkId: provider.paymentLinkId,
    planId: input.planId,
  };
}

export async function cancelPayOSPayment(orderCode: number, reason: string): Promise<void> {
  const { PAYOS_CLIENT_ID: clientId, PAYOS_API_KEY: apiKey } = requireSafePayOSConfig();
  const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}/cancel`, {
    method: 'POST',
    headers: {
      'x-client-id': clientId,
      'x-api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ cancellationReason: reason.slice(0, 200) }),
  });
  const parsed = payOSCancellationSchema.safeParse(await response.json().catch(() => null));
  if (!response.ok || !parsed.success || parsed.data.code !== '00' || parsed.data.data?.status !== 'CANCELLED') {
    throw new Error('PayOS rejected the cancellation request.');
  }
}
