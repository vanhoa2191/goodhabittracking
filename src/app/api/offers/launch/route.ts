import { NextResponse } from 'next/server';
import { LAUNCH_OFFER, PROMO_PLANS } from '@/lib/billing/plan-catalog';
import { getMarketingOrigin } from '@/lib/site';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const OFFERS = [
  { code: LAUNCH_OFFER.code, slots: LAUNCH_OFFER.slots, endsAt: null },
  ...Object.values(PROMO_PLANS).map(({ offerCode, slots, endsAt }) => ({ code: offerCode, slots, endsAt })),
];

/**
 * Public: how many places each launch offer has left. Numbers only, read by the marketing site and the pricing cards.
 * The top-level code, slots and remaining fields are the founding offer, kept for older readers.
 */
export async function GET() {
  const headers = {
    'Access-Control-Allow-Origin': getMarketingOrigin().origin,
    Vary: 'Origin',
  };
  try {
    const admin = createAdminSupabaseClient();
    const offers = await Promise.all(OFFERS.map(async (offer) => {
      const { data, error } = await admin.rpc('launch_offer_remaining', { offer: offer.code });
      if (error || typeof data !== 'number') throw new Error('launch offer count unavailable');
      return { ...offer, remaining: data };
    }));
    const founding = offers[0];
    return NextResponse.json(
      { code: founding.code, slots: founding.slots, remaining: founding.remaining, offers: offers.map(({ code, slots, remaining, endsAt }) => ({ code, slots, remaining, endsAt })) },
      { headers: { ...headers, 'Cache-Control': 'public, max-age=60' } }
    );
  } catch {
    return NextResponse.json({ error: 'Offer count is temporarily unavailable.' }, { status: 503, headers });
  }
}
