import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Thiết bị chưa được ghép nối.' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('get_child_session', {
    session_token_hash: await sha256Hex(token),
  });

  if (error) {
    return NextResponse.json({ error: 'Không thể tải phiên của bé.' }, { status: 503 });
  }
  if (!data) {
    const response = NextResponse.json({ error: 'Phiên đã hết hạn hoặc bị thu hồi.' }, { status: 401 });
    response.cookies.delete(CHILD_SESSION_COOKIE);
    return response;
  }

  return NextResponse.json(data);
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_SESSION_COOKIE)?.value;
  if (token) {
    const supabase = await createServerSupabaseClient();
    await supabase.rpc('revoke_child_session', {
      session_token_hash: await sha256Hex(token),
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(CHILD_SESSION_COOKIE);
  return response;
}
