import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminUser } from '@/lib/auth/admin-access';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function authorize() { const client = await createServerSupabaseClient(); const { data: { user } } = await client.auth.getUser(); return isAdminUser(user) ? user : null; }

export async function GET() {
  if (!await authorize()) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const admin = createAdminSupabaseClient();
  const [{ data: users, error: usersError }, { data: profiles }, { data: memberships }, { data: subscriptions }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from('parent_profiles').select('user_id,display_name,email,phone,marketing_consent,customer_tags,admin_notes,created_at'),
    admin.from('family_memberships').select('user_id,family_id,role'),
    admin.from('user_subscriptions').select('family_id,plan,status,trial_ends_at,subscription_ends_at,updated_at'),
  ]);
  if (usersError) return NextResponse.json({ error: 'Could not load customers.' }, { status: 503 });
  const rows = users.users.map((user) => { const profile = profiles?.find((item) => item.user_id === user.id); const membership = memberships?.find((item) => item.user_id === user.id); const subscription = subscriptions?.find((item) => item.family_id === membership?.family_id); return { id: user.id, email: user.email ?? profile?.email ?? '', fullName: profile?.display_name || user.user_metadata?.full_name || '', phone: profile?.phone ?? '', marketingConsent: profile?.marketing_consent ?? false, tags: profile?.customer_tags ?? [], notes: profile?.admin_notes ?? '', createdAt: user.created_at, familyId: membership?.family_id ?? null, role: membership?.role ?? null, subscription: subscription ?? null }; });
  return NextResponse.json({ customers: rows });
}

const updateSchema = z.object({ userId: z.string().uuid(), fullName: z.string().trim().min(2).max(120), phone: z.string().trim().max(30), marketingConsent: z.boolean(), tags: z.array(z.string().trim().min(1).max(30)).max(20), notes: z.string().trim().max(2000) }).strict();
export async function PATCH(request: NextRequest) {
  const actor = await authorize(); if (!actor) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: 'Invalid customer update.' }, { status: 400 });
  const admin = createAdminSupabaseClient(); const { error } = await admin.from('parent_profiles').update({ display_name: parsed.data.fullName, phone: parsed.data.phone || null, marketing_consent: parsed.data.marketingConsent, customer_tags: parsed.data.tags, admin_notes: parsed.data.notes || null, updated_at: new Date().toISOString() }).eq('user_id', parsed.data.userId);
  if (error) return NextResponse.json({ error: 'Could not update customer.' }, { status: 503 }); return NextResponse.json({ success: true });
}
