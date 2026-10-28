import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { requireParentUnlock } from '@/lib/security/parent-unlock';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const settingsSchema = z.object({
  enabled: z.boolean(),
  bonusEnabled: z.boolean().default(false),
  timezone: z.string().min(1).max(80),
  cutoffLocal: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  bedtimeStartLocal: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  bedtimeEndLocal: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  ageTrackOverride: z.enum(['age_6_8', 'age_9_12']).nullable().default(null),
  commandId: z.string().uuid(),
});

function errorResponse(error: { message?: string; code?: string }) {
  const message = error.message ?? '';
  const code = ['family_manage_required', 'timezone_required', 'timezone_invalid', 'excuse_reason_required']
    .find((candidate) => message.includes(candidate)) ?? 'settings_failed';
  const status = code === 'family_manage_required' ? 403 : code === 'timezone_invalid' ? 400 : 409;
  return NextResponse.json({ ok: false, schemaVersion: 'v1', code, messageKey: `thinkingGames.${code}` }, { status });
}

export async function GET() {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'authentication_required', messageKey: 'auth.required' }, { status: 401 });
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('thinking_game_settings')
    .select('enabled,bonus_enabled,timezone,cutoff_local,bedtime_start_local,bedtime_end_local,age_track_override,effective_from_local_day,settings_version,pending_settings,pending_effective_local_day')
    .eq('family_id', parent.familyId).maybeSingle();
  if (error) return errorResponse(error);
  return NextResponse.json({ ok: true, schemaVersion: 'v1', status: 'available', data: data ?? { enabled: false } });
}

export async function PUT(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'authentication_required', messageKey: 'auth.required' }, { status: 401 });
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, schemaVersion: 'v1', code: 'invalid_input', messageKey: 'thinkingGames.invalid_input' }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const locked = await requireParentUnlock(request, parent, supabase, { requirePin: true });
  if (locked) return locked;
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc('thinking_game_update_settings_as', {
    actor_user_id: parent.user.id, target_family_id: parent.familyId,
    new_enabled: parsed.data.enabled, new_bonus_enabled: parsed.data.bonusEnabled,
    new_timezone: parsed.data.timezone, new_cutoff_local: parsed.data.cutoffLocal,
    new_bedtime_start_local: parsed.data.bedtimeStartLocal, new_bedtime_end_local: parsed.data.bedtimeEndLocal,
    new_age_track_override: parsed.data.ageTrackOverride, command_id: parsed.data.commandId,
  });
  if (error) return errorResponse(error);
  return NextResponse.json({ ok: true, schemaVersion: 'v1', status: 'available', data });
}
