import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { createOrderCode, isUniqueViolation } from '@/lib/billing/order-code';
import { createPayOSPayment } from '@/lib/billing/payos-server';
import { cancelPendingPayOSOrder, reconcileOrderOutcome } from '@/lib/billing/payos-reconcile';
import { PAYMENT_LINK_LIFETIME_MS, unknownOrderGraceElapsed } from '@/lib/billing/payos-errors';
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
    const expiresAt = new Date(Date.now() + PAYMENT_LINK_LIFETIME_MS).toISOString();
    let orderCode = 0;
    let amount = 0;
    let discountBps = 0;
    let reserved = false;
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
      if (!insertError) {
        const order = Array.isArray(result.data) ? result.data[0] : result.data;
        if (!order || typeof order.amount !== 'number' || typeof order.discount_bps !== 'number') throw new Error('Invalid payment order.');
        amount = order.amount;
        discountBps = order.discount_bps;
        if (order.existing_order_code) {
          const { data: pending, error: readError } = await admin.from('payment_orders')
            .select('order_code,family_id,user_id,family_owner_user_id,plan_id,amount,description,status,created_at,expires_at,payment_link_id,checkout_payment,checkout_creation_finished_at')
            .eq('order_code', order.existing_order_code).maybeSingle();
          if (readError || !pending) throw new Error('Could not read pending checkout.');
          if (pending.status !== 'PENDING') continue;
          // A shared referral identity may have reserved a different family. Do not expose or
          // cancel that family's checkout unless this actor can manage it or originally paid for it.
          if (pending.family_id !== parent.familyId && pending.user_id !== parent.user.id && pending.family_owner_user_id !== parent.user.id) {
            const { data: membership, error: membershipError } = await admin.from('family_memberships')
              .select('family_id').eq('family_id', pending.family_id).eq('user_id', parent.user.id)
              .in('role', ['owner', 'parent', 'guardian']).maybeSingle();
            if (membershipError) throw membershipError;
            if (!membership) return NextResponse.json({ success: false, error: 'Chủ gia đình đang có một đơn năm chờ thanh toán. Vui lòng nhờ chủ gia đình hoàn tất hoặc hủy đơn đó.', code: 'yearly_checkout_pending' }, { status: 409 });
          }
          const outcome = await reconcileOrderOutcome(admin, pending);
          if (outcome === 'paid') {
            return NextResponse.json({ success: false, error: 'Đơn trước đã được thanh toán. Vui lòng tải lại để xem gói hiện tại.', code: 'order_already_paid' }, { status: 409 });
          }
          if (outcome === 'open' && pending.family_id === parent.familyId
            && pending.plan_id === parsed.data.planId && !unknownOrderGraceElapsed(pending)
            && pending.checkout_payment) {
            return NextResponse.json({ success: true, payment: pending.checkout_payment });
          }
          // Do not cancel another request while it is still creating its provider link.
          if (outcome === 'open' && !pending.checkout_payment && !pending.payment_link_id
            && !pending.checkout_creation_finished_at && !unknownOrderGraceElapsed(pending)) {
            return NextResponse.json({ success: false, error: 'Đơn đang được tạo. Vui lòng thử lại sau ít phút.', code: 'yearly_checkout_pending' }, { status: 409 });
          }
          if (outcome !== 'closed') await cancelPendingPayOSOrder(pending, 'Customer selected a new checkout');
          const { error: closeError } = await admin.from('payment_orders')
            .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
            .eq('order_code', pending.order_code).eq('status', 'PENDING');
          if (closeError) throw closeError;
          continue; // Price/discount is recalculated under the same database locks.
        }
        reserved = true;
        break;
      }
      if (!isUniqueViolation(insertError)) break;
    }
    if (insertError) throw insertError;
    // A bounded retry cannot accidentally create a link for an unresolved old reservation.
    if (!reserved) throw new Error('Could not reserve checkout.');

    try {
      const payment = await createPayOSPayment({ planId: parsed.data.planId, orderCode, amount, expiresAt });
      const { paymentLinkId, ...publicPayment } = payment;
      const discount = amount < plan.price ? { listPrice: plan.price, discountPercent: Math.round(discountBps / 100) } : {};
      const checkoutPayment = { ...publicPayment, ...discount };
      const { error: updateError } = await admin
        .from('payment_orders')
        .update({
          payment_url: payment.checkoutUrl,
          qr_code: payment.qrCode,
          payment_link_id: payment.paymentLinkId,
          checkout_payment: checkoutPayment,
          checkout_creation_finished_at: new Date().toISOString(),
        })
        .eq('order_code', orderCode)
        .eq('family_id', parent.familyId)
        .eq('status', 'PENDING');
      if (updateError) throw updateError;

      void paymentLinkId;
      return NextResponse.json({ success: true, payment: checkoutPayment });
    } catch (error) {
      // A failed response may still have created a provider link. Close locally only after PayOS confirms.
      try {
        await cancelPendingPayOSOrder({ order_code: orderCode, amount, description: '', status: 'PENDING', expires_at: expiresAt }, 'Payment link creation could not be completed');
        await admin.from('payment_orders')
          .update({ status: 'CANCELLED', cancelled_at: new Date().toISOString() })
          .eq('order_code', orderCode)
          .eq('family_id', parent.familyId)
          .eq('status', 'PENDING');
      } catch {
        // Keep PENDING so a paid/open provider link remains eligible for reconciliation.
      }
      // The create attempt has settled: a later retry can attempt provider cancellation immediately.
      await admin.from('payment_orders').update({ checkout_creation_finished_at: new Date().toISOString() })
        .eq('order_code', orderCode).eq('family_id', parent.familyId).eq('status', 'PENDING');
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
