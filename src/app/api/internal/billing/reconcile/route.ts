import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { reconcilePendingOrder } from '@/lib/billing/payos-reconcile';
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
 * Safety net for payments whose PayOS webhook never arrived: every pending order from the last three days is
 * checked against PayOS and activated if it was paid. Safe to run often and alongside the webhook.
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
    .order('created_at', { ascending: true })
    .limit(25);
  if (error) {
    logOperationalEvent('error', { operation: 'payment_reconcile', reasonCode: 'database_failure', correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ error: 'Could not read pending orders.', correlationId }, { status: 503 });
  }

  let activated = 0;
  let failed = 0;
  for (const order of orders ?? []) {
    try {
      if (await reconcilePendingOrder(admin, order)) activated += 1;
    } catch {
      failed += 1;
    }
  }
  return NextResponse.json({ checked: orders?.length ?? 0, activated, failed, correlationId });
}
