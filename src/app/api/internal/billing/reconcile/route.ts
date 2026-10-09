import { NextRequest, NextResponse } from 'next/server';
import { reconcileOrderOutcome } from '@/lib/billing/payos-reconcile';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { hasBearerSecret } from '@/lib/security/bearer-secret';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/**
 * Walk every pending order with a stable order-code cursor. Status changes cannot shift later pages,
 * and a snapshot cutoff prevents new checkouts from keeping this run open indefinitely.
 */
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  if (!hasBearerSecret(request, process.env.CRON_SECRET)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const correlationId = createCorrelationId();
  const admin = createAdminSupabaseClient();
  const startedAt = new Date().toISOString();
  let cursor = 0;
  let checked = 0;
  let activated = 0;
  let closed = 0;
  let failed = 0;
  while (true) {
    const { data: orders, error } = await admin
      .from('payment_orders')
      .select('order_code,amount,description,status')
      .eq('status', 'PENDING')
      .lte('created_at', startedAt)
      .gt('order_code', cursor)
      .order('order_code', { ascending: true })
      .limit(25);
    if (error) {
      logOperationalEvent('error', { operation: 'payment_reconcile', reasonCode: 'database_failure', correlationId, route: request.nextUrl.pathname, status: 503 });
      return NextResponse.json({ error: 'Could not read pending orders.', correlationId }, { status: 503 });
    }

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
    checked += orders?.length ?? 0;
    if (!orders || orders.length < 25) break;
    cursor = Number(orders.at(-1)!.order_code);
  }
  return NextResponse.json({ checked, activated, closed, failed, correlationId });
}
