import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { createOrderCode, isUniqueViolation } from '@/lib/billing/order-code';
import { createPayOSPayment } from '@/lib/billing/payos-server';
import { createPaymentRequestSchema } from '@/lib/billing/schemas';
import { getPricingPlan } from '@/lib/payos';
import { discountedPrice } from '@/lib/billing/referral-discount';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { requireParentUnlock } from '@/lib/security/parent-unlock';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const locked = await requireParentUnlock(request, parent, await createServerSupabaseClient());
  if (locked) return locked;

  const parsed = createPaymentRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid payment request.' }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const plan = getPricingPlan(parsed.data.planId);
    // A family that entered a friend's code pays less for its first yearly plan; the server decides the price.
    let discountBps = 0;
    if (parsed.data.planId === 'yearly') {
      const { data, error: discountError } = await admin.rpc('referral_discount_bps', { target_family: parent.familyId });
      if (discountError) throw discountError;
      discountBps = typeof data === 'number' ? data : 0;
    }
    const amount = discountedPrice(plan.price, discountBps);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Two checkouts in the same millisecond can draw the same code; the second simply draws again.
    let orderCode = 0;
    let insertError: { code?: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      orderCode = createOrderCode();
      ({ error: insertError } = await admin.from('payment_orders').insert({
        order_code: orderCode,
        family_id: parent.familyId,
        user_id: parent.user.id,
        plan_id: parsed.data.planId,
        amount,
        description: `KIDHABIT ${orderCode}`.slice(0, 25),
        status: 'PENDING',
        expires_at: expiresAt,
      }));
      if (!isUniqueViolation(insertError)) break;
    }
    if (insertError) throw insertError;

    try {
      const payment = await createPayOSPayment({ planId: parsed.data.planId, orderCode, amount });
      const { error: updateError } = await admin
        .from('payment_orders')
        .update({
          payment_url: payment.checkoutUrl,
          qr_code: payment.qrCode,
          payment_link_id: payment.paymentLinkId,
        })
        .eq('order_code', orderCode)
        .eq('family_id', parent.familyId);
      if (updateError) throw updateError;

      const { paymentLinkId, ...publicPayment } = payment;
      void paymentLinkId;
      const discount = amount < plan.price ? { listPrice: plan.price, discountPercent: Math.round(discountBps / 100) } : {};
      return NextResponse.json({ success: true, payment: { ...publicPayment, ...discount } });
    } catch (error) {
      await admin
        .from('payment_orders')
        .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
        .eq('order_code', orderCode)
        .eq('family_id', parent.familyId);
      throw error;
    }
  } catch (error) {
    console.error('Payment creation failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json(
      { success: false, error: 'Payment service is temporarily unavailable.' },
      { status: 503 }
    );
  }
}
