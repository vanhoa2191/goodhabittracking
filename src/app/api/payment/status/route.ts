import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { paymentStatusRequestSchema } from '@/lib/billing/schemas';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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
    .select('status')
    .eq('order_code', parsed.data.orderCode)
    .eq('family_id', parent.familyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: 'Could not read payment status.' }, { status: 503 });
  }
  if (!order) {
    return NextResponse.json({ success: false, error: 'Payment order not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, paid: order.status === 'PAID', status: order.status });
}
