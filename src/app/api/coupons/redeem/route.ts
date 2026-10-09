import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

const schema = z.object({ code: z.string().trim().min(8).max(32) }).strict();

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Mã không hợp lệ.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Chỉ người quản lý gia đình có thể sử dụng mã.' }, { status: 403 });
  const { data: canManage, error: permissionError } = await supabase.rpc('can_manage_family', { target_family_id: parent.familyId });
  if (permissionError) return NextResponse.json({ error: 'Không kiểm tra được quyền quản lý.' }, { status: 503 });
  if (!canManage) return NextResponse.json({ error: 'Chỉ người quản lý gia đình có thể sử dụng mã.' }, { status: 403 });

  const { data, error } = await supabase.rpc('redeem_family_coupon', { coupon_code: parsed.data.code });
  if (error?.message.includes('coupon_rate_limited')) {
    return NextResponse.json({ error: 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.' }, { status: 429 });
  }
  const subscription = Array.isArray(data) ? data[0] : data;
  if (error || !subscription?.plan) {
    return NextResponse.json({ error: 'Mã không tồn tại, đã dùng hoặc đã hết hạn.' }, { status: 400 });
  }
  return NextResponse.json({ success: true, subscription });
}
