import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { checkAnswer } from '@/lib/thinking-games';
import { pinnedContentFromAttempt, puzzleItemFromContentRow } from '@/lib/thinking-games/server/content-row';
import { failure, success } from '@/lib/thinking-games/server/response';
import { rpcErrorCode, rpcErrorStatus } from '@/lib/thinking-games/server/rpc-error';
import { admitsPinnedItem, getThinkingGameCatalog } from '@/lib/thinking-games/server/catalog';

const input = z.object({ childId: z.string().uuid(), attemptId: z.string().uuid(), answer: z.unknown(), commandId: z.string().uuid() });
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parent = await getParentContext();
  if (!parent) return NextResponse.json(failure('authentication_required'), { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(failure('invalid_input'), { status: 400 });
  const admin = createAdminSupabaseClient();
  const { data: attempt, error: attemptError } = await admin.from('thinking_game_attempts')
    .select('child_id, entitlement_id, thinking_game_entitlements(content_id, content_version, thinking_game_content(*))')
    .eq('id', parsed.data.attemptId).eq('child_id', parsed.data.childId).maybeSingle();
  if (attemptError || !attempt) return NextResponse.json(failure('not_found'), { status: 404 });
  const pinned = pinnedContentFromAttempt(attempt);
  let puzzle: ReturnType<typeof puzzleItemFromContentRow>;
  try {
    if (!pinned) throw new Error('attempt content is missing');
    puzzle = puzzleItemFromContentRow(pinned.content, pinned);
  } catch {
    return NextResponse.json(failure('invalid_puzzle'), { status: 409 });
  }
  const catalog = getThinkingGameCatalog();
  if (!catalog.ok || !admitsPinnedItem(catalog, puzzle)) {
    return NextResponse.json(failure(catalog.ok ? 'content_unavailable' : catalog.code), { status: 409 });
  }
  const checked = checkAnswer(puzzle, parsed.data.answer);
  if (!checked.ok) return NextResponse.json(failure(checked.code), { status: 400 });
  const { data, error } = await admin.rpc('thinking_game_parent_finish_as', {
    actor_user_id: parent.user.id, target_child_id: parsed.data.childId, attempt_id: parsed.data.attemptId,
    won: checked.correct, answer: parsed.data.answer, command_id: parsed.data.commandId,
  });
  if (error) { const code = rpcErrorCode(error); return NextResponse.json(failure(code), { status: rpcErrorStatus(code) }); }
  return NextResponse.json(success(data?.status ?? 'finished', data?.data));
}
