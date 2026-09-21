import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const consentSchema = z.object({
  policyVersion: z.literal('2026-09-19'),
  childDataConsent: z.literal(true),
}).strict();

export async function POST(request: NextRequest) {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  const parsed = consentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Consent is required.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const rows = ['privacy', 'child_data'].map((consentType) => ({
    family_id: parent.familyId,
    user_id: parent.user.id,
    consent_type: consentType,
    policy_version: parsed.data.policyVersion,
    revoked_at: null,
  }));
  const { error } = await supabase.from('family_consents').upsert(rows);
  if (error) return NextResponse.json({ success: false, error: 'Could not save consent.' }, { status: 503 });
  return NextResponse.json({ success: true });
}
