import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { failure, success } from '@/lib/thinking-games/server/response';
import { rpcErrorCode, rpcErrorStatus } from '@/lib/thinking-games/server/rpc-error';

export const runtime = 'nodejs';
const inputSchema = z.object({ attemptId: z.string().uuid(), commandId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(failure('invalid_input'), { status: 400 });
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json(failure('session_invalid'), { status: 401 });
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('thinking_game_pause', {
    session_token_hash: await sha256Hex(token),
    attempt_id: parsed.data.attemptId,
    command_id: parsed.data.commandId,
  });
  if (error) {
    const code = rpcErrorCode(error);
    return NextResponse.json(failure(code), { status: rpcErrorStatus(code) });
  }
  if (data?.ok === false) return NextResponse.json({ ...data, schemaVersion: 'v1', messageKey: `thinkingGames.${data.code}` },
    { status: rpcErrorStatus(data.code) });
  return NextResponse.json(success(data?.status ?? 'paused', data?.data));
}
