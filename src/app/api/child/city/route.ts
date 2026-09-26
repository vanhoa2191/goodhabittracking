import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cityItemIdSchema, parseCityPurchase, parseCityPurchases } from '@/lib/dream-city';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function sessionHash(): Promise<string | null> {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  return token ? sha256Hex(token) : null;
}

async function invalidSession() {
  (await cookies()).delete(CHILD_SESSION_COOKIE);
  return NextResponse.json({ error: 'Child device session expired or revoked.' }, { status: 401 });
}

export async function GET() {
  if (!defaultExperienceFlags.dreamCity) return NextResponse.json({ error: 'City is unavailable.' }, { status: 404 });
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('read_child_city', { session_token_hash: tokenHash });
  if (error) return NextResponse.json({ error: 'City could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  const parsed = z.object({ status: z.literal('ready'), purchases: z.unknown() }).safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'City could not be loaded.' }, { status: 503 });
  try {
    return NextResponse.json({ purchases: parseCityPurchases(parsed.data.purchases) });
  } catch {
    return NextResponse.json({ error: 'City could not be loaded.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!defaultExperienceFlags.dreamCity) return NextResponse.json({ error: 'City is unavailable.' }, { status: 404 });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid city item.' }, { status: 400 });
  }
  const parsed = z.object({ itemId: cityItemIdSchema }).strict().safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid city item.' }, { status: 400 });
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('purchase_child_city_item', {
    session_token_hash: tokenHash,
    target_item_id: parsed.data.itemId,
  });
  if (error) return NextResponse.json({ error: 'City item could not be built.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status === 'insufficient_points') return NextResponse.json({ error: 'Not enough points.' }, { status: 409 });
  if (data?.status === 'item_unavailable' || data?.status === 'child_unavailable') {
    return NextResponse.json({ error: 'City item is unavailable.' }, { status: 409 });
  }
  const built = z.object({
    status: z.enum(['built', 'already_built']),
    purchase: z.unknown(),
    remainingPoints: z.number().int().nonnegative(),
  }).safeParse(data);
  if (!built.success) return NextResponse.json({ error: 'City item could not be built.' }, { status: 503 });
  try {
    const purchase = parseCityPurchase(built.data.purchase);
    if (purchase.item_id !== parsed.data.itemId) throw new Error('Unexpected city item.');
    return NextResponse.json({ status: built.data.status, purchase, remainingPoints: built.data.remainingPoints });
  } catch {
    return NextResponse.json({ error: 'City item could not be built.' }, { status: 503 });
  }
}
