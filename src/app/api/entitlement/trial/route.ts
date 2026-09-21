import { NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST() {
  const parent = await getParentContext();
  if (!parent) {
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('activate_family_trial');
  if (error) {
    const conflict = error.message.includes('trial_already_consumed');
    return NextResponse.json(
      { success: false, error: conflict ? 'Free trial has already been used.' : 'Could not activate trial.' },
      { status: conflict ? 409 : 503 }
    );
  }

  const entitlement = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ success: true, entitlement });
}
