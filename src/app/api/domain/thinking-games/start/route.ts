import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { failure, success } from '@/lib/thinking-games/server/response';
import { rpcErrorCode, rpcErrorStatus } from '@/lib/thinking-games/server/rpc-error';
import { admitsPinnedItem, getThinkingGameCatalog } from '@/lib/thinking-games/server/catalog';
import { pinnedContentFromAttempt, puzzleItemFromContentRow } from '@/lib/thinking-games/server/content-row';
import { toPublicPuzzle } from '@/lib/thinking-games';

const input = z.object({
  childId: z.string().uuid(),
  slot: z.enum(['main', 'bonus']),
  expectedLocalDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  commandId: z.string().uuid(),
});
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parent = await getParentContext();
  if (!parent) return NextResponse.json(failure('authentication_required'), { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(failure('invalid_input'), { status: 400 });
  const catalog = getThinkingGameCatalog();
  if (!catalog.ok) return NextResponse.json(failure(catalog.code), { status: 409 });
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc('thinking_game_parent_start_as', {
    actor_user_id: parent.user.id, target_child_id: parsed.data.childId, p_slot_type: parsed.data.slot,
    p_expected_local_day: parsed.data.expectedLocalDay, command_id: parsed.data.commandId,
  });
  if (error) {
    const code = rpcErrorCode(error);
    return NextResponse.json(failure(code), { status: rpcErrorStatus(code) });
  }
  if (data?.ok === false) return NextResponse.json({ ...data, schemaVersion: 'v1', messageKey: `thinkingGames.${data.code}` }, { status: rpcErrorStatus(data.code) });
  if (data?.data?.attemptId && !data.data.puzzle) {
    // Start has already checked family/child/day/slot. Resume its exact pin,
    // rather than choosing content again or creating another attempt.
    const { data: attempt, error: attemptError } = await admin.from('thinking_game_attempts')
      .select('thinking_game_entitlements(content_id, content_version, thinking_game_content(*))')
      .eq('id', data.data.attemptId).eq('child_id', parsed.data.childId).eq('family_id', parent.familyId).maybeSingle();
    if (attemptError || !attempt) return NextResponse.json(failure('not_found'), { status: 404 });
    try {
      const pinned = pinnedContentFromAttempt(attempt);
      if (!pinned) throw new Error('missing pin');
      const puzzle = puzzleItemFromContentRow(pinned.content, pinned);
      if (!admitsPinnedItem(catalog, puzzle)) return NextResponse.json(failure('content_unavailable'), { status: 409 });
      return NextResponse.json(success(data.status ?? 'started', { ...data.data, puzzle: toPublicPuzzle(puzzle) }));
    } catch {
      return NextResponse.json(failure('invalid_puzzle'), { status: 409 });
    }
  }
  return NextResponse.json(success(data?.status ?? 'started', data?.data));
}
