import { NextRequest, NextResponse } from 'next/server';
import { isPayOSConfigured } from '@/lib/payos';
import { getSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderCode, simulateSuccess } = body;

    if (!orderCode) {
      return NextResponse.json({ success: false, error: 'Thiếu mã đơn hàng orderCode' }, { status: 400 });
    }

    // 1. Simulation mode for easy testing / offline demo
    if (simulateSuccess) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase
            .from('payment_orders')
            .update({ status: 'PAID', paid_at: new Date().toISOString() })
            .eq('order_code', orderCode);
        } catch {}
      }

      return NextResponse.json({
        success: true,
        paid: true,
        status: 'PAID',
        message: 'Mô phỏng thanh toán thành công!',
      });
    }

    // 2. Real PayOS verification
    if (isPayOSConfigured()) {
      try {
        const clientId = process.env.PAYOS_CLIENT_ID!;
        const apiKey = process.env.PAYOS_API_KEY!;

        const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
          method: 'GET',
          headers: {
            'x-client-id': clientId,
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
          },
        });

        const json = await response.json();
        if (json.code === '00' && json.data) {
          const status = json.data.status;
          const isPaid = status === 'PAID';

          return NextResponse.json({
            success: true,
            paid: isPaid,
            status,
            data: json.data,
          });
        }
      } catch (payosErr) {
        console.error('Error fetching PayOS order status:', payosErr);
      }
    }

    // 3. Fallback check from database
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: order } = await supabase
          .from('payment_orders')
          .select('status')
          .eq('order_code', orderCode)
          .single();

        if (order) {
          return NextResponse.json({
            success: true,
            paid: order.status === 'PAID',
            status: order.status,
          });
        }
      } catch {}
    }

    // Default pending
    return NextResponse.json({
      success: true,
      paid: false,
      status: 'PENDING',
    });
  } catch (error: unknown) {
    console.error('Error in /api/payment/status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi kiểm tra trạng thái' },
      { status: 500 }
    );
  }
}
