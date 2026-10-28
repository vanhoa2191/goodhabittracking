import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { failure, success } from '@/lib/thinking-games/server/response';
import { rpcErrorCode, rpcErrorStatus } from '@/lib/thinking-games/server/rpc-error';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json(failure('session_invalid'), { status: 401 });
  const expected = request.nextUrl.searchParams.get('expectedLocalDay');
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('thinking_game_state', {
    session_token_hash: await sha256Hex(token),
    expected_local_day: expected || null,
  });
  if (error) {
    const code = rpcErrorCode(error);
    return NextResponse.json(failure(code), { status: rpcErrorStatus(code) });
  }
  if (data?.ok === false) return NextResponse.json({ ...data, schemaVersion: 'v1', messageKey: `thinkingGames.${data.code}` },
    { status: rpcErrorStatus(data.code) });
  return NextResponse.json(success('available', data));
}

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  return GET(request);
}
