import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { reconcileOrderOutcome } from '@/lib/billing/payos-reconcile';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function authorized(request: NextRequest): boolean {
  const configured = process.env.CRON_SECRET?.trim();
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!configured || configured.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(configured), Buffer.from(provided));
}

/**
 * Safety net for payments whose PayOS webhook never arrived: pending orders from the last three days are
 * checked against PayOS, newest first, and activated if they were paid. Orders PayOS reports as cancelled or
 * expired with nothing paid are closed here, so abandoned checkouts do not fill the batch and crowd out a fresh
 * payment. Safe to run often and alongside the webhook.
 */
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  if (!authorized(request)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const correlationId = createCorrelationId();
  const admin = createAdminSupabaseClient();
  const since = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const { data: orders, error } = await admin
    .from('payment_orders')
    .select('order_code,amount,description,status')
    .eq('status', 'PENDING')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(25);
  if (error) {
    logOperationalEvent('error', { operation: 'payment_reconcile', reasonCode: 'database_failure', correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ error: 'Could not read pending orders.', correlationId }, { status: 503 });
  }

  let activated = 0;
  let closed = 0;
  let failed = 0;
  for (const order of orders ?? []) {
    try {
      const outcome = await reconcileOrderOutcome(admin, order);
      if (outcome === 'paid') activated += 1;
      if (outcome === 'closed') {
        const { error: closeError } = await admin
          .from('payment_orders')
          .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
          .eq('order_code', order.order_code)
          .eq('status', 'PENDING');
        if (closeError) failed += 1;
        else closed += 1;
      }
    } catch {
      failed += 1;
    }
  }
  return NextResponse.json({ checked: orders?.length ?? 0, activated, closed, failed, correlationId });
}
