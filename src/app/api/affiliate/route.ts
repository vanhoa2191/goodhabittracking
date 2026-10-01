import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { requireParentUnlock } from '@/lib/security/parent-unlock';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('enroll'), acceptTerms: z.literal(true) }).strict(),
  z.object({
    action: z.literal('savePayout'),
    bank: z.string().trim().min(2).max(80),
    accountNumber: z.string().trim().regex(/^[0-9A-Za-z -]{4,30}$/),
    accountName: z.string().trim().min(2).max(80),
  }).strict(),
  z.object({ action: z.literal('requestPayout') }).strict(),
]);

export async function GET() {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('affiliate_overview');
  if (error || !data) return NextResponse.json({ error: 'Could not load the referral programme.' }, { status: 503 });
  return NextResponse.json(data, { headers: { 'cache-control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const supabase = await createServerSupabaseClient();

  const command = parsed.data;
  if (command.action === 'enroll') {
    const { data, error } = await supabase.rpc('affiliate_enroll', { accept_terms: true });
    if (error || typeof data !== 'string') return NextResponse.json({ error: 'Could not join the programme.' }, { status: 409 });
    return NextResponse.json({ status: 'enrolled', code: data });
  }

  // Payout details and payouts move money, so they need the parent PIN entered in this browser.
  const locked = await requireParentUnlock(request, parent, supabase);
  if (locked) return locked;

  if (command.action === 'savePayout') {
    const { data, error } = await supabase.rpc('affiliate_save_payout_details', {
      bank: command.bank,
      account_number: command.accountNumber,
      account_name: command.accountName,
    });
    if (error || !data) return NextResponse.json({ error: 'Could not save payout details.' }, { status: 503 });
    const status = (data as { status?: string }).status;
    return NextResponse.json({ status }, { status: status === 'saved' ? 200 : 400 });
  }

  const { data, error } = await supabase.rpc('request_affiliate_payout');
  if (error || !data) return NextResponse.json({ error: 'Could not request the payout.' }, { status: 503 });
  const result = data as { status?: string; amount?: number; available?: number; minimum?: number };
  return NextResponse.json(result, { status: result.status === 'requested' ? 200 : 409 });
}
