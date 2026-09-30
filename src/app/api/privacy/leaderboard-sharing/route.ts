import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

const sharingInput = z.strictObject({ enabled: z.boolean() });

export async function GET() {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('parent_settings')
    .select('is_public_leaderboard')
    .eq('family_id', parent.familyId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Sharing setting unavailable.' }, { status: 503 });
  return NextResponse.json({ enabled: data?.is_public_leaderboard === true });
}

export async function PUT(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const parsed = sharingInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid sharing choice.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('set_family_public_leaderboard', {
    target_family_id: parent.familyId,
    enabled: parsed.data.enabled,
  });
  if (error) return NextResponse.json({ error: 'Sharing setting unavailable.' }, { status: 503 });
  if (data?.status === 'session_invalid') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const saved = z.object({ status: z.literal('saved'), enabled: z.boolean() }).safeParse(data);
  if (!saved.success || saved.data.enabled !== parsed.data.enabled) {
    return NextResponse.json({ error: 'Sharing setting unavailable.' }, { status: 503 });
  }
  return NextResponse.json({ enabled: saved.data.enabled });
}
