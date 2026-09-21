import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isAdminUser } from '@/lib/auth/admin-access';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const schema = z.object({ familyId: z.string().uuid(), plan: z.enum(['free','trial','monthly','yearly']), status: z.enum(['active','inactive','cancelled']), endsAt: z.string().datetime().nullable() }).strict();
export async function PATCH(request: NextRequest) {
  const client = await createServerSupabaseClient(); const { data: { user } } = await client.auth.getUser(); if (!isAdminUser(user)) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 });
  const admin = createAdminSupabaseClient(); const { data: membership } = await admin.from('family_memberships').select('user_id').eq('family_id', parsed.data.familyId).eq('role','owner').maybeSingle(); if (!membership) return NextResponse.json({ error: 'Family not found.' }, { status: 404 });
  const days = parsed.data.plan === 'monthly' ? 31 : parsed.data.plan === 'yearly' ? 366 : parsed.data.plan === 'trial' ? 14 : 0;
  const endsAt = parsed.data.endsAt ?? (days ? new Date(Date.now() + days * 86_400_000).toISOString() : null);
  const { error } = await admin.from('user_subscriptions').upsert({ family_id: parsed.data.familyId, user_id: membership.user_id, plan: parsed.data.plan, status: parsed.data.status, subscription_ends_at: parsed.data.plan === 'monthly' || parsed.data.plan === 'yearly' ? endsAt : null, trial_ends_at: parsed.data.plan === 'trial' ? endsAt : null, updated_at: new Date().toISOString() }, { onConflict: 'family_id' });
  if (error) return NextResponse.json({ error: 'Could not update subscription.' }, { status: 503 }); return NextResponse.json({ success: true });
}
