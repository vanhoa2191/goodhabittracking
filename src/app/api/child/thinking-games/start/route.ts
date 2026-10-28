import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { failure, success } from '@/lib/thinking-games/server/response';
import { rpcErrorCode, rpcErrorStatus } from '@/lib/thinking-games/server/rpc-error';
import { getThinkingGameCatalog } from '@/lib/thinking-games/server/catalog';

export const runtime = 'nodejs';
const inputSchema = z.object({
  slot: z.enum(['main', 'bonus']),
  expectedLocalDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  commandId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(failure('invalid_input'), { status: 400 });
  const catalog = getThinkingGameCatalog();
  if (!catalog.ok) return NextResponse.json(failure(catalog.code), { status: 409 });
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json(failure('session_invalid'), { status: 401 });
  const admin = createAdminSupabaseClient();
  const tokenHash = await sha256Hex(token);
  const { data: existing } = await admin.rpc('thinking_game_state', { session_token_hash: tokenHash });
  if (existing?.status === 'started' || existing?.status === 'paused') {
    return NextResponse.json(failure('attempt_already_active'), { status: 409 });
  }
  const { data, error } = await admin.rpc('thinking_game_start', {
    session_token_hash: tokenHash,
    p_slot_type: parsed.data.slot,
    p_expected_local_day: parsed.data.expectedLocalDay,
    command_id: parsed.data.commandId,
  });
  if (error) {
    const code = rpcErrorCode(error);
    return NextResponse.json(failure(code), { status: rpcErrorStatus(code) });
  }
  if (data?.ok === false) return NextResponse.json({ ...data, schemaVersion: 'v1', messageKey: `thinkingGames.${data.code}` },
    { status: rpcErrorStatus(data.code) });
  return NextResponse.json(success(data?.status ?? 'started', data?.data));
}
