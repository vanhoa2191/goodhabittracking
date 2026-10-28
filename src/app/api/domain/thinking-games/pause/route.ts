import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { failure, success } from '@/lib/thinking-games/server/response';
import { rpcErrorCode, rpcErrorStatus } from '@/lib/thinking-games/server/rpc-error';

const input = z.object({ childId: z.string().uuid(), attemptId: z.string().uuid(), commandId: z.string().uuid() });
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parent = await getParentContext();
  if (!parent) return NextResponse.json(failure('authentication_required'), { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(failure('invalid_input'), { status: 400 });
  const { data, error } = await createAdminSupabaseClient().rpc('thinking_game_parent_pause_as', {
    actor_user_id: parent.user.id, target_child_id: parsed.data.childId,
    attempt_id: parsed.data.attemptId, command_id: parsed.data.commandId,
  });
  if (error) { const code = rpcErrorCode(error); return NextResponse.json(failure(code), { status: rpcErrorStatus(code) }); }
  if (data?.ok === false) return NextResponse.json({ ...data, schemaVersion: 'v1', messageKey: `thinkingGames.${data.code}` },
    { status: rpcErrorStatus(data.code) });
  return NextResponse.json(success(data?.status ?? 'paused', data?.data));
}
