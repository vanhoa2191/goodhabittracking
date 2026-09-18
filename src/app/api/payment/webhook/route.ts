import { NextRequest, NextResponse } from 'next/server';
import { verifyPayOSWebhook, isPayOSConfigured } from '@/lib/payos';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, data, signature } = body;

    // In PayOS webhook: data contains orderCode, amount, description, reference, etc.
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ success: false, message: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    // Verify signature if PayOS is configured
    if (isPayOSConfigured() && signature) {
      const isValid = verifyPayOSWebhook(data, signature);
      if (!isValid) {
        console.warn('Invalid PayOS webhook signature for order:', data.orderCode);
        return NextResponse.json({ success: false, message: 'Sai chữ ký xác thực' }, { status: 401 });
      }
    }

    const orderCode = data.orderCode;
    const isPaid = code === '00' || data.code === '00';

    if (isPaid && orderCode) {
      console.log(`[PayOS Webhook] Payment SUCCESS for orderCode: ${orderCode}`);

      const supabase = getSupabase();
      if (supabase) {
        try {
          // Update payment_orders
          await supabase
            .from('payment_orders')
            .update({
              status: 'PAID',
              paid_at: new Date().toISOString(),
              metadata: data,
            })
            .eq('order_code', orderCode);

          // Find order to know userId and planId
          const { data: order } = await supabase
            .from('payment_orders')
            .select('user_id, plan_id')
            .eq('order_code', orderCode)
            .single();

          if (order?.user_id) {
            const planId = order.plan_id;
            let subscriptionEndsAt: string | null = null;
            const now = new Date();

            if (planId === 'monthly') {
              now.setMonth(now.getMonth() + 1);
              subscriptionEndsAt = now.toISOString();
            } else if (planId === 'yearly') {
              now.setFullYear(now.getFullYear() + 1);
              subscriptionEndsAt = now.toISOString();
            } // 'lifetime' stays null = forever

            await supabase.from('user_subscriptions').upsert({
              user_id: order.user_id,
              plan: planId,
              status: 'active',
              subscription_ends_at: subscriptionEndsAt,
              updated_at: new Date().toISOString(),
            });
          }
        } catch (dbErr) {
          console.warn('Error updating Supabase on payment webhook:', dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error: unknown) {
    console.error('Error handling PayOS webhook:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
