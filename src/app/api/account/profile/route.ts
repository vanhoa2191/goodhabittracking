import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const profileSchema = z.object({ displayName: z.string().trim().min(2).max(120), phone: z.string().trim().max(30).optional().default(''), marketingConsent: z.boolean().optional().default(false) }).strict();

export async function GET() {
  const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data, error } = await supabase.from('parent_profiles').select('display_name,email,phone,marketing_consent').eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load profile.' }, { status: 503 });
  return NextResponse.json({ profile: data ?? { display_name: user.user_metadata?.full_name ?? '', email: user.email ?? '', phone: '', marketing_consent: false } });
}

export async function PATCH(request: NextRequest) {
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid profile.' }, { status: 400 });
  const supabase = await createServerSupabaseClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const profileValues = {
    display_name: parsed.data.displayName,
    email: user.email ?? null,
    phone: parsed.data.phone || null,
    marketing_consent: parsed.data.marketingConsent,
    updated_at: new Date().toISOString(),
  };
  const profileColumns = 'display_name,email,phone,marketing_consent';
  const { data: updatedProfile, error: updateError } = await supabase
    .from('parent_profiles')
    .update(profileValues)
    .eq('user_id', user.id)
    .select(profileColumns)
    .maybeSingle();
  if (updateError) {
    console.error('account_profile_save_failed', {
      code: updateError.code,
    });
    return NextResponse.json({ error: 'Could not save profile.' }, { status: 503 });
  }
  if (updatedProfile) {
    return NextResponse.json({ success: true, profile: updatedProfile });
  }
  const { data: insertedProfile, error: insertError } = await supabase
    .from('parent_profiles')
    .insert({ user_id: user.id, ...profileValues })
    .select(profileColumns)
    .single();
  if (insertError || !insertedProfile) {
    console.error('account_profile_save_failed', {
      code: insertError?.code ?? 'missing_returned_profile',
    });
    return NextResponse.json({ error: 'Could not save profile.' }, { status: 503 });
  }
  return NextResponse.json({ success: true, profile: insertedProfile });
}
