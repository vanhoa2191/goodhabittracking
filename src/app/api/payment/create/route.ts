import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { createPayOSPayment } from '@/lib/billing/payos-server';
import { createPaymentRequestSchema } from '@/lib/billing/schemas';
import { getPricingPlan } from '@/lib/payos';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function createOrderCode(): number {
  return Date.now() * 100 + (crypto.getRandomValues(new Uint8Array(1))[0] % 100);
}

export async function POST(request: NextRequest) {
  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const parsed = createPaymentRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid payment request.' }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const plan = getPricingPlan(parsed.data.planId);
    const orderCode = createOrderCode();
    const description = `KIDHABIT ${orderCode}`.slice(0, 25);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await admin.from('payment_orders').insert({
      order_code: orderCode,
      family_id: parent.familyId,
      user_id: parent.user.id,
      plan_id: parsed.data.planId,
      amount: plan.price,
      description,
      status: 'PENDING',
      expires_at: expiresAt,
    });
    if (insertError) throw insertError;

    try {
      const payment = await createPayOSPayment({ planId: parsed.data.planId, orderCode });
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
      return NextResponse.json({ success: true, payment: publicPayment });
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
