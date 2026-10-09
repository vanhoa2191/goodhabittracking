import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { createOrderCode, isUniqueViolation } from '@/lib/billing/order-code';
import { cancelPayOSPayment, createPayOSPayment } from '@/lib/billing/payos-server';
import { createPaymentRequestSchema } from '@/lib/billing/schemas';
import { getPricingPlan } from '@/lib/payos';
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
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    let orderCode = 0;
    let amount = 0;
    let discountBps = 0;
    let insertError: { code?: string; message?: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      orderCode = createOrderCode();
      const result = await admin.rpc('create_family_payment_order', {
        target_family: parent.familyId,
        actor_id: parent.user.id,
        new_order_code: orderCode,
        selected_plan: parsed.data.planId,
        expires_at: expiresAt,
      });
      insertError = result.error;
      if (insertError?.message?.includes('yearly_checkout_pending')) {
        return NextResponse.json({ success: false, error: 'Gia đình đang có một đơn năm chờ thanh toán. Vui lòng hoàn tất hoặc hủy đơn đó trước.', code: 'yearly_checkout_pending' }, { status: 409 });
      }
      if (!insertError) {
        const order = Array.isArray(result.data) ? result.data[0] : result.data;
        if (!order || typeof order.amount !== 'number' || typeof order.discount_bps !== 'number') throw new Error('Invalid payment order.');
        amount = order.amount;
        discountBps = order.discount_bps;
        break;
      }
      if (!isUniqueViolation(insertError)) break;
    }
    if (insertError) throw insertError;

    try {
      const payment = await createPayOSPayment({ planId: parsed.data.planId, orderCode, amount, expiresAt });
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
      // A failed response may still have created a provider link. Close locally only after PayOS confirms.
      try {
        await cancelPayOSPayment(orderCode, 'Payment link creation could not be completed');
        await admin.from('payment_orders')
          .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
          .eq('order_code', orderCode)
          .eq('family_id', parent.familyId)
          .eq('status', 'PENDING');
      } catch {
        // Keep PENDING so a paid/open provider link remains eligible for reconciliation.
      }
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
