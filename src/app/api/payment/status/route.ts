import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { paymentStatusRequestSchema } from '@/lib/billing/schemas';
import { reconcilePendingOrder } from '@/lib/billing/payos-reconcile';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const parsed = paymentStatusRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid status request.' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: order, error } = await supabase
    .from('payment_orders')
    .select('status,amount,description')
    .eq('order_code', parsed.data.orderCode)
    .eq('family_id', parent.familyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: 'Could not read payment status.' }, { status: 503 });
  }
  if (!order) {
    return NextResponse.json({ success: false, error: 'Payment order not found.' }, { status: 404 });
  }

  if (order.status === 'PENDING') {
    // The bank transfer may be done while PayOS's webhook has not reached us (or never will), so ask PayOS directly.
    try {
      if (await reconcilePendingOrder(createAdminSupabaseClient(), { order_code: parsed.data.orderCode, amount: order.amount, description: order.description, status: order.status })) {
        return NextResponse.json({ success: true, paid: true, status: 'PAID' });
      }
    } catch {
      // PayOS being unreachable must not turn a pending check into an error.
    }
  }

  return NextResponse.json({ success: true, paid: order.status === 'PAID', status: order.status });
}
