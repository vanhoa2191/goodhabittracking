import { NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { EMPTY_FAMILY_ADDONS, parseFamilyAddons } from '@/lib/store/subscription';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('plan, status, trial_ends_at, subscription_ends_at')
    .eq('family_id', parent.familyId)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ success: false, error: 'Could not read entitlement.' }, { status: 503 });
  }

  // Add-ons are extra: if the snapshot cannot be read the family just shows none, the plan still answers.
  let addons = EMPTY_FAMILY_ADDONS;
  try {
    const { data: snapshot, error: snapshotError } = await supabase.rpc('family_addons_snapshot');
    if (!snapshotError) addons = parseFamilyAddons(snapshot);
  } catch {
    // keep the defaults
  }

  return NextResponse.json({
    success: true,
    entitlement: data ?? {
      plan: 'free',
      status: 'active',
      trial_ends_at: null,
      subscription_ends_at: null,
    },
    addons,
  });
}
