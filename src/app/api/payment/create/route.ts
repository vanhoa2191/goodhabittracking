import { NextRequest, NextResponse } from 'next/server';
import { createPaymentOrder, isPayOSConfigured } from '@/lib/payos';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planId, returnUrl, cancelUrl, userId } = body;

    if (!planId || !['monthly', 'yearly', 'lifetime'].includes(planId)) {
      return NextResponse.json(
        { success: false, error: 'Gói thanh toán không hợp lệ (monthly, yearly, lifetime).' },
        { status: 400 }
      );
    }

    const paymentResult = await createPaymentOrder({
      planId,
      returnUrl,
      cancelUrl,
      userId,
    });

    // Optionally save pending order to Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('payment_orders').insert({
          order_code: paymentResult.orderCode,
          user_id: userId || null,
          plan_id: planId,
          amount: paymentResult.amount,
          description: paymentResult.description,
          status: 'PENDING',
          payment_url: paymentResult.checkoutUrl,
          qr_code: paymentResult.qrCode,
        });
      } catch (dbErr) {
        // Table may not exist yet if migration not run, log gracefully
        console.warn('Could not record pending order to Supabase table:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      payment: paymentResult,
      isPayOSConfigured: isPayOSConfigured(),
    });
  } catch (error: unknown) {
    console.error('Error in /api/payment/create:', error);
    const errMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    return NextResponse.json(
      { success: false, error: 'Không thể tạo mã thanh toán VietQR: ' + errMessage },
      { status: 500 }
    );
  }
}
