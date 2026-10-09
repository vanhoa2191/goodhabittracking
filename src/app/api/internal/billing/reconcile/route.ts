import { NextRequest, NextResponse } from 'next/server';
import { reconcileOrderOutcome, type PendingOrder } from '@/lib/billing/payos-reconcile';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { hasBearerSecret } from '@/lib/security/bearer-secret';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/** Each run checks recent payments first, then resumes a descending sweep of the backlog. */
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  if (!hasBearerSecret(request, process.env.CRON_SECRET)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const correlationId = createCorrelationId();
  const admin = createAdminSupabaseClient();
  const started = Date.now();
  const deadline = started + 20_000;
  const startedAt = new Date(started).toISOString();
  const remainingSignal = () => AbortSignal.timeout(Math.max(1, deadline - Date.now()));
  let checked = 0;
  let activated = 0;
  let closed = 0;
  let failed = 0;
  const seen = new Set<string>();
  const fail = (reasonCode: string) => {
    logOperationalEvent('error', { operation: 'payment_reconcile', reasonCode, correlationId, route: request.nextUrl.pathname, status: 503 });
    return NextResponse.json({ error: 'Could not reconcile pending orders.', correlationId }, { status: 503 });
  };

  const { data: state, error: stateError } = await admin.from('billing_reconcile_state')
    .select('cursor_order_code,cursor_created_at').eq('singleton', true).abortSignal(remainingSignal()).maybeSingle();
  if (stateError) return fail('cursor_read_failed');
  // Preserve bigint as text/number without arithmetic, avoiding precision loss in stored cursors.
  let cursor: number | string | null = state?.cursor_order_code ?? null;
  let cursorCreatedAt: string | null = state?.cursor_created_at ?? null;
  const processOrder = async (order: PendingOrder, phaseDeadline: number) => {
    const signal = AbortSignal.timeout(Math.max(1, Math.min(4000, phaseDeadline - Date.now())));
    try {
      const outcome = await reconcileOrderOutcome({ rpc: (name, args) => admin.rpc(name, args).abortSignal(signal) }, order, signal);
      if (outcome === 'paid') activated += 1;
      if (outcome === 'closed') {
        const { error } = await admin.from('payment_orders')
          .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
          .eq('order_code', order.order_code).eq('status', 'PENDING').abortSignal(signal);
        if (error) failed += 1;
        else closed += 1;
      }
    } catch {
      failed += 1;
    }
    checked += 1;
    seen.add(String(order.order_code));
  };
  const fields = 'order_code,amount,description,status,created_at,expires_at';
  // Spend at most five seconds on fresh links so a busy provider cannot starve older orders.
  const freshDeadline = Math.min(deadline, started + 5000);
  const { data: fresh, error: freshError } = await admin.from('payment_orders').select(fields)
    .eq('status', 'PENDING').lte('created_at', startedAt)
    .order('created_at', { ascending: false }).order('order_code', { ascending: false })
    .limit(10).abortSignal(remainingSignal());
  if (freshError) return fail('database_failure');
  for (const order of fresh ?? []) {
    if (Date.now() >= freshDeadline) break;
    await processOrder(order, freshDeadline);
  }

  // Reserve a second for saving progress. Snapshot cutoff keeps new checkouts out of this sweep.
  const sweepDeadline = deadline - 1000;
  let complete = false;
  while (Date.now() < sweepDeadline) {
    let query = admin.from('payment_orders').select(fields)
      .eq('status', 'PENDING').lte('created_at', startedAt);
    if (cursor !== null && cursorCreatedAt !== null) {
      // Keep PostgreSQL's full timestamp precision; JS Date would truncate microseconds and skip rows.
      const timestamp = cursorCreatedAt;
      query = query.or(`created_at.lt.${timestamp},and(created_at.eq.${timestamp},order_code.lt.${cursor})`);
    }
    const { data: orders, error } = await query.order('created_at', { ascending: false }).order('order_code', { ascending: false })
      .limit(25).abortSignal(remainingSignal());
    if (error) return fail('database_failure');
    let processed = 0;
    for (const order of orders ?? []) {
      if (Date.now() >= sweepDeadline) break;
      if (!seen.has(String(order.order_code))) await processOrder(order, sweepDeadline);
      cursor = order.order_code;
      cursorCreatedAt = order.created_at!;
      processed += 1;
    }
    if (processed === (orders?.length ?? 0) && (orders?.length ?? 0) < 25) {
      complete = true;
      cursor = null; // Restart at newest on the next sweep, retrying transient failures.
      cursorCreatedAt = null;
      break;
    }
  }
  const { error: saveError } = await admin.from('billing_reconcile_state')
    .upsert({ singleton: true, cursor_order_code: cursor, cursor_created_at: cursorCreatedAt, updated_at: new Date().toISOString() })
    .abortSignal(remainingSignal());
  if (saveError) return fail('cursor_save_failed');
  return NextResponse.json({ checked, activated, closed, failed, complete, cursor, correlationId });
}
