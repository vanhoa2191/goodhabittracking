import { NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ error: 'Vui lòng đăng nhập tài khoản phụ huynh.' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('device_sessions')
    .select('id, child_id, device_label, capabilities, expires_at, revoked_at, last_seen_at, created_at')
    .eq('family_id', parent.familyId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Không thể tải danh sách thiết bị.' }, { status: 503 });
  }

  return NextResponse.json({
    devices: data.map((device) => ({
      ...device,
      is_active: !device.revoked_at && new Date(device.expires_at).getTime() > Date.now(),
    })),
  });
}
