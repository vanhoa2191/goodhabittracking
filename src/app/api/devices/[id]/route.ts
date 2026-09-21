import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const paramsSchema = z.object({ id: z.string().uuid() });

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Thiết bị không hợp lệ.' }, { status: 400 });
  }

  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập tài khoản phụ huynh.' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('revoke_device_session', {
    target_device_session_id: parsed.data.id,
  });

  if (error) {
    return NextResponse.json({ error: 'Không thể thu hồi thiết bị.' }, { status: 503 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Không tìm thấy thiết bị trong gia đình.' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
