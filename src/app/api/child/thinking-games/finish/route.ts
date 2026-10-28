import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { checkAnswer } from '@/lib/thinking-games';
import { pinnedContentFromAttempt, puzzleItemFromContentRow } from '@/lib/thinking-games/server/content-row';
import { failure, success } from '@/lib/thinking-games/server/response';
import { rpcErrorCode, rpcErrorStatus } from '@/lib/thinking-games/server/rpc-error';
import { admitsPinnedItem, getThinkingGameCatalog } from '@/lib/thinking-games/server/catalog';

export const runtime = 'nodejs';
const inputSchema = z.object({
  attemptId: z.string().uuid(),
  answer: z.unknown(),
  commandId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(failure('invalid_input'), { status: 400 });
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json(failure('session_invalid'), { status: 401 });
  const tokenHash = await sha256Hex(token);
  const admin = createAdminSupabaseClient();
  const { data: attempt } = await admin.from('thinking_game_attempts')
    .select('child_id, thinking_game_entitlements(content_id, content_version, thinking_game_content(*))')
    .eq('id', parsed.data.attemptId).maybeSingle();
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
  const { data, error } = await admin.rpc('thinking_game_finish_verified', {
    session_token_hash: tokenHash, attempt_id: parsed.data.attemptId,
    won: checked.correct, answer: parsed.data.answer, command_id: parsed.data.commandId,
  });
  if (error) {
    const code = rpcErrorCode(error);
    return NextResponse.json(failure(code), { status: rpcErrorStatus(code) });
  }
  if (data?.ok === false) return NextResponse.json({ ...data, schemaVersion: 'v1', messageKey: `thinkingGames.${data.code}` },
    { status: rpcErrorStatus(data.code) });
  return NextResponse.json(success(data?.status ?? 'finished', data?.data));
}
