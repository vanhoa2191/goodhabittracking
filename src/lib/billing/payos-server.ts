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

const payOSResponseSchema = z.object({
  code: z.string(),
  desc: z.string().optional(),
  data: z
    .object({
      accountNumber: z.string(),
      accountName: z.string(),
      bin: z.string(),
      qrCode: z.string(),
      checkoutUrl: z.string().url(),
      paymentLinkId: z.string(),
    })
    .optional(),
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

function getApplicationOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
  const origin = new URL(configured).origin;
  if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_APP_URL must use HTTPS in production.');
  }
  return origin;
}

export async function createPayOSPayment(input: {
  planId: PaidPlan;
  orderCode: number;
}): Promise<PaymentResult & { paymentLinkId: string }> {
  const {
    PAYOS_CLIENT_ID: clientId,
    PAYOS_API_KEY: apiKey,
    PAYOS_CHECKSUM_KEY: checksumKey,
  } = requireSafePayOSConfig();
  const plan = getPricingPlan(input.planId);
  const description = `KIDHABIT ${input.orderCode}`.slice(0, 25);
  const origin = getApplicationOrigin();
  const returnUrl = `${origin}/?payment=success&orderCode=${input.orderCode}`;
  const cancelUrl = `${origin}/?payment=cancel&orderCode=${input.orderCode}`;
  const signatureFields = {
    amount: plan.price,
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
      items: [{ name: plan.name, quantity: 1, price: plan.price }],
      signature: createPayOSSignature(signatureFields, checksumKey),
    }),
  });

  const parsed = payOSResponseSchema.safeParse(await response.json());
  if (!response.ok || !parsed.success || parsed.data.code !== '00' || !parsed.data.data) {
    throw new Error('PayOS rejected the payment request.');
  }

  const provider = parsed.data.data;
  return {
    orderCode: input.orderCode,
    amount: plan.price,
    description,
    accountNumber: provider.accountNumber,
    accountName: provider.accountName,
    bin: provider.bin,
    bankName: 'Ngân hàng nhận thanh toán qua PayOS',
    qrCode: provider.qrCode,
    vietQrUrl: await QRCode.toDataURL(provider.qrCode, { width: 448, margin: 1 }),
    checkoutUrl: provider.checkoutUrl,
    paymentLinkId: provider.paymentLinkId,
    planId: input.planId,
  };
}
