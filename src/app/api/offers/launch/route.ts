import { NextResponse } from 'next/server';
import { LAUNCH_OFFER } from '@/lib/billing/plan-catalog';
import { getMarketingOrigin } from '@/lib/site';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

/** Public: how many launch-offer places are left. Numbers only, read by the marketing site. */
export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': getMarketingOrigin().origin,
    Vary: 'Origin',
  };
  try {
    const { data, error } = await createAdminSupabaseClient().rpc('launch_offer_remaining', { offer: LAUNCH_OFFER.code });
    if (error || typeof data !== 'number') throw new Error('launch offer count unavailable');
    return NextResponse.json(
      { code: LAUNCH_OFFER.code, slots: LAUNCH_OFFER.slots, remaining: data },
      { headers: { ...headers, 'Cache-Control': 'public, max-age=60' } }
    );
  } catch {
    return NextResponse.json({ error: 'Offer count is temporarily unavailable.' }, { status: 503, headers });
  }
}
