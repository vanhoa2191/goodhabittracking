import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { requireParentUnlock } from '@/lib/security/parent-unlock';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const inputSchema = z.object({ childId: z.string().uuid(), localDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export async function GET(request: NextRequest) {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'authentication_required', messageKey: 'auth.required' }, { status: 401 });
  const parsed = inputSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'invalid_input', messageKey: 'thinkingGames.invalid_input' }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const locked = await requireParentUnlock(request, parent, supabase);
  if (locked) return locked;
  const { data, error } = await createAdminSupabaseClient().rpc('thinking_game_preview_day', {
    actor_user_id: parent.user.id, target_child_id: parsed.data.childId, target_local_day: parsed.data.localDay,
  });
  if (error) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'preview_failed', messageKey: 'thinkingGames.preview_failed' }, { status: 409 });
  return NextResponse.json({ ok: true, schemaVersion: 'v1', status: 'available', data });
}
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  return GET(request);
}
