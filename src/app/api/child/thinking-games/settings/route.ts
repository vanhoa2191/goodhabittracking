import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { failure } from '@/lib/thinking-games/server/response';
import { rpcErrorCode, rpcErrorStatus } from '@/lib/thinking-games/server/rpc-error';

export const runtime = 'nodejs';
export async function GET() {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json(failure('session_invalid'), { status: 401 });
  const { data, error } = await (await createServerSupabaseClient()).rpc('thinking_game_child_settings', { session_token_hash: await sha256Hex(token) });
  if (error) { const code = rpcErrorCode(error); return NextResponse.json(failure(code), { status: rpcErrorStatus(code) }); }
  return NextResponse.json({ ok: true, schemaVersion: 'v1', status: 'available', data });
}
