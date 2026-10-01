import 'server-only';

import { z } from 'zod';
import { verifyPayOSWebhook } from '@/lib/billing/payos-server';
import { requireSafePayOSConfig } from '@/lib/billing/payos-config';

const paymentInfoSchema = z.object({
  code: z.string(),
  data: z.object({
    orderCode: z.number().int().positive(),
    amount: z.number().int().nonnegative(),
    amountPaid: z.number().int().nonnegative().optional(),
    status: z.string(),
    transactions: z.array(z.object({ reference: z.string().optional() }).passthrough()).optional(),
  }).passthrough().optional(),
  signature: z.string().optional(),
}).passthrough();

export type PayOSPaymentInfo = {
  readonly orderCode: number;
  readonly amount: number;
  readonly amountPaid: number;
  readonly status: string;
  readonly reference: string | null;
  readonly raw: unknown;
};

/** What PayOS itself says about a payment link, asked with our API key. Null when PayOS cannot answer or the answer is not trustworthy. */
export async function fetchPayOSPaymentInfo(orderCode: number): Promise<PayOSPaymentInfo | null> {
  const { PAYOS_CLIENT_ID: clientId, PAYOS_API_KEY: apiKey, PAYOS_CHECKSUM_KEY: checksumKey } = requireSafePayOSConfig();
  const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
    headers: { 'x-client-id': clientId, 'x-api-key': apiKey },
  });
  const raw: unknown = await response.json().catch(() => null);
  const parsed = paymentInfoSchema.safeParse(raw);
  if (!response.ok || !parsed.success || parsed.data.code !== '00' || !parsed.data.data) return null;
  const { data, signature } = parsed.data;
  // PayOS signs this answer like a webhook; when a signature is present it must match our checksum key.
  if (signature && !verifyPayOSWebhook(data as Record<string, unknown>, signature, checksumKey)) return null;
  return {
    orderCode: data.orderCode,
    amount: data.amount,
    amountPaid: data.amountPaid ?? 0,
    status: data.status,
    reference: data.transactions?.find((transaction) => typeof transaction.reference === 'string' && transaction.reference !== '')?.reference ?? null,
    raw,
  };
}

type PendingOrder = {
  readonly order_code: number | string;
  readonly amount: number;
  readonly description: string;
  readonly status: string;
};

type RpcClient = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }> };

export type OrderOutcome = 'paid' | 'closed' | 'open';

/**
 * Settles a pending order that PayOS reports as fully paid, through the same function the webhook uses, so a
 * webhook that never arrived (or arrives later) cannot leave a paid order unactivated or activate it twice.
 * 'closed' means PayOS itself says the link was cancelled or expired with nothing paid, so no money can still
 * arrive for it; anything else unsettled stays 'open'.
 */
export async function reconcileOrderOutcome(admin: RpcClient, order: PendingOrder): Promise<OrderOutcome> {
  if (order.status === 'PAID') return 'paid';
  if (order.status !== 'PENDING') return 'open';
  const orderCode = Number(order.order_code);
  const info = await fetchPayOSPaymentInfo(orderCode);
  if (!info || info.orderCode !== orderCode) return 'open';
  if ((info.status === 'CANCELLED' || info.status === 'EXPIRED') && info.amountPaid === 0) return 'closed';
  if (info.status !== 'PAID' || info.amountPaid !== order.amount || info.amount !== order.amount) return 'open';
  const { data, error } = await admin.rpc('process_payos_webhook', {
    incoming_order_code: orderCode,
    incoming_amount: order.amount,
    incoming_description: order.description,
    incoming_reference: info.reference ?? `payos-status-${orderCode}`,
    incoming_payment_link_id: '',
    incoming_payload: info.raw,
  });
  return !error && (data === 'activated' || data === 'duplicate' || data === 'order_already_paid') ? 'paid' : 'open';
}

/** True when the order is paid after this call. */
export async function reconcilePendingOrder(admin: RpcClient, order: PendingOrder): Promise<boolean> {
  return (await reconcileOrderOutcome(admin, order)) === 'paid';
}
