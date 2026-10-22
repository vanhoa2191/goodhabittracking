import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { requireParentUnlock } from '@/lib/security/parent-unlock';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const inputSchema = z.object({ childId: z.string().uuid(), localDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), activityId: z.string().uuid(), reason: z.string().trim().min(1).max(500), commandId: z.string().uuid() });
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'authentication_required', messageKey: 'auth.required' }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'invalid_input', messageKey: 'thinkingGames.invalid_input' }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const locked = await requireParentUnlock(request, parent, supabase, { requirePin: true });
  if (locked) return locked;
  const { data, error } = await createAdminSupabaseClient().rpc('thinking_game_excuse_task_as', {
    actor_user_id: parent.user.id, target_child_id: parsed.data.childId, target_local_day: parsed.data.localDay,
    target_activity_id: parsed.data.activityId, reason: parsed.data.reason, command_id: parsed.data.commandId,
  });
  if (error) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'excuse_failed', messageKey: 'thinkingGames.excuse_failed' }, { status: 409 });
  return NextResponse.json({ ok: true, schemaVersion: 'v1', status: 'available', data });
}
