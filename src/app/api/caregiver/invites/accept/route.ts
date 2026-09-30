import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

const acceptSchema = z.object({ token: z.string().length(72) }).strict();

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const client = await createServerSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Vui lòng đăng nhập.' }, { status: 401 });
  const parsed = acceptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Lời mời không hợp lệ hoặc đã hết hạn.' }, { status: 400 });
  }
  const { data, error } = await client.rpc('accept_caregiver_invite', { raw_token: parsed.data.token });
  if (error || typeof data !== 'string') {
    return NextResponse.json({ error: 'Lời mời không hợp lệ hoặc đã hết hạn.' }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
