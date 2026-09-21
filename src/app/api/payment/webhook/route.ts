import { NextRequest, NextResponse } from 'next/server';
import { verifyPayOSWebhook } from '@/lib/billing/payos-server';
import { payOSWebhookSchema } from '@/lib/billing/schemas';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  const rawBody: unknown = await request.json().catch(() => null);
  const parsed = payOSWebhookSchema.safeParse(rawBody);
  if (!parsed.success) {
    logOperationalEvent('warn', { operation: 'payment_webhook', reasonCode: 'invalid_payload', correlationId, route: request.nextUrl.pathname, status: 400 });
    return NextResponse.json({ success: false, message: 'Invalid webhook payload.', correlationId }, { status: 400 });
  }

  const rawData = (rawBody as { data: Record<string, unknown> }).data;
  try {
    if (!verifyPayOSWebhook(rawData, parsed.data.signature)) {
      logOperationalEvent('warn', { operation: 'payment_webhook', reasonCode: 'invalid_signature', correlationId, route: request.nextUrl.pathname, status: 401 });
      return NextResponse.json({ success: false, message: 'Invalid signature.', correlationId }, { status: 401 });
    }

    if (parsed.data.success !== true || parsed.data.code !== '00' || parsed.data.data.code !== '00') {
      return NextResponse.json({ success: true, message: 'No successful payment to process.' });
    }

    const payment = parsed.data.data;
    const admin = createAdminSupabaseClient();
    const { data: result, error } = await admin.rpc('process_payos_webhook', {
      incoming_order_code: payment.orderCode,
      incoming_amount: payment.amount,
      incoming_description: payment.description,
      incoming_reference: payment.reference,
      incoming_payment_link_id: payment.paymentLinkId,
      incoming_payload: rawBody,
    });
    if (error) throw error;

    if (result === 'activated' || result === 'duplicate') {
      return NextResponse.json({ success: true, message: 'Webhook processed.' });
    }
    if (result === 'order_not_found') {
      logOperationalEvent('warn', { operation: 'payment_webhook', reasonCode: 'order_not_found', correlationId, route: request.nextUrl.pathname, status: 404 });
      return NextResponse.json({ success: false, message: 'Order not found.', correlationId }, { status: 404 });
    }
    logOperationalEvent('warn', { operation: 'payment_webhook', reasonCode: 'order_mismatch', correlationId, route: request.nextUrl.pathname, status: 409 });
    return NextResponse.json({ success: false, message: 'Payment did not match the order.', correlationId }, { status: 409 });
  } catch {
    logOperationalEvent('error', { operation: 'payment_webhook', reasonCode: 'processing_failed', correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ success: false, message: 'Webhook processing failed.', correlationId }, { status: 503 });
  }
}
