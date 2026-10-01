import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { normalizeReferralCode } from '@/lib/referral/referral-code';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const schema = z.object({ code: z.string().trim().min(6).max(16) }).strict();

// The programme decides everything (own family, too late, already referred); the visitor only learns
// whether the code was taken, so a refusal reveals nothing about other families.
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  const code = parsed.success ? normalizeReferralCode(parsed.data.code) : null;
  if (!code) return NextResponse.json({ status: 'invalid' }, { status: 400 });

  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('claim_referral', { referral_code: code });
  if (error || typeof data !== 'string') return NextResponse.json({ error: 'Could not record the referral.' }, { status: 503 });
  return NextResponse.json({ status: data });
}
