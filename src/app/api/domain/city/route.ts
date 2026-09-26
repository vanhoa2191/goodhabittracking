import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { cityItemIdSchema, parseCityPurchase } from '@/lib/dream-city';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!defaultExperienceFlags.dreamCity) return NextResponse.json({ error: 'City is unavailable.' }, { status: 404 });
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid city item.' }, { status: 400 });
  }
  const parsed = z.object({ childId: z.string().uuid(), itemId: cityItemIdSchema }).strict().safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid city item.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('purchase_parent_city_item', {
    target_family_id: parent.familyId,
    target_child_id: parsed.data.childId,
    target_item_id: parsed.data.itemId,
  });
  if (error) return NextResponse.json({ error: 'City item could not be built.' }, { status: 503 });
  if (data?.status === 'session_invalid') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
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
    if (purchase.family_id !== parent.familyId || purchase.child_id !== parsed.data.childId || purchase.item_id !== parsed.data.itemId) {
      throw new Error('Unexpected city purchase.');
    }
    return NextResponse.json({ status: built.data.status, purchase, remainingPoints: built.data.remainingPoints });
  } catch {
    return NextResponse.json({ error: 'City item could not be built.' }, { status: 503 });
  }
}
