import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const consentInput = z.strictObject({ enabled: z.boolean() });
const policyVersion = '2026-09-26';

export async function GET() {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('family_consents')
    .select('revoked_at')
    .eq('family_id', parent.familyId)
    .eq('user_id', parent.user.id)
    .eq('consent_type', 'parent_reminders')
    .eq('policy_version', policyVersion)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Consent unavailable.' }, { status: 503 });
  return NextResponse.json({ enabled: Boolean(data && !data.revoked_at) });
}

export async function PUT(request: NextRequest) {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const parsed = consentInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid consent.' }, { status: 400 });

  const now = new Date().toISOString();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('family_consents').upsert({
    family_id: parent.familyId,
    user_id: parent.user.id,
    consent_type: 'parent_reminders',
    policy_version: policyVersion,
    granted_at: now,
    revoked_at: parsed.data.enabled ? null : now,
  }, { onConflict: 'family_id,user_id,consent_type,policy_version' });
  if (error) return NextResponse.json({ error: 'Consent unavailable.' }, { status: 503 });
  return NextResponse.json({ enabled: parsed.data.enabled });
}
