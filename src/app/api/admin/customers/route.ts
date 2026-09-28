import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  adminAuthorizationResponse,
  adminJsonResponse,
  authorizeAdmin,
} from '@/lib/auth/admin-access';
import { recordAdminAudit } from '@/lib/auth/admin-audit-server';
import { createCorrelationId } from '@/lib/observability/logger';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { listAllAuthUsers } from '@/lib/auth/admin-user-directory';
import { listAllRows } from '@/lib/auth/admin-paginated';

const readRoles = ['support', 'finance', 'super_admin'] as const;
const writeRoles = ['support', 'super_admin'] as const;

export async function GET() {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles: readRoles });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);

  const admin = createAdminSupabaseClient();
  const [authUsers, profiles, memberships, subscriptions] = await Promise.all([
    listAllAuthUsers(admin),
    listAllRows((from, to) => admin
      .from('parent_profiles')
      .select('user_id,display_name,email,phone,marketing_consent,customer_tags,admin_notes,created_at')
      .order('user_id', { ascending: true })
      .range(from, to)),
    listAllRows((from, to) => admin
      .from('family_memberships')
      .select('user_id,family_id,role')
      .order('user_id', { ascending: true })
      .range(from, to)),
    listAllRows((from, to) => admin
      .from('user_subscriptions')
      .select('family_id,plan,status,trial_ends_at,subscription_ends_at,updated_at')
      .order('family_id', { ascending: true })
      .range(from, to)),
  ]);
  if (authUsers.error || profiles.error || memberships.error || subscriptions.error) {
    return adminJsonResponse({ error: 'Could not load customers.', correlationId }, correlationId, 503);
  }

  const rows = authUsers.users.map((user) => {
    const profile = profiles.rows.find((item) => item.user_id === user.id);
    const membership = memberships.rows.find((item) => item.user_id === user.id);
    const subscription = subscriptions.rows.find((item) => item.family_id === membership?.family_id);
    return {
      id: user.id,
      email: user.email ?? profile?.email ?? '',
      fullName: profile?.display_name || user.user_metadata?.full_name || '',
      phone: profile?.phone ?? '',
      marketingConsent: profile?.marketing_consent ?? false,
      tags: profile?.customer_tags ?? [],
      notes: profile?.admin_notes ?? '',
      createdAt: user.created_at,
      familyId: membership?.family_id ?? null,
      role: membership?.role ?? null,
      subscription: subscription ?? null,
    };
  });
  return adminJsonResponse({ customers: rows, correlationId }, correlationId);
}

const updateSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30),
  marketingConsent: z.boolean(),
  tags: z.array(z.string().trim().min(1).max(30)).max(20),
  notes: z.string().trim().max(2000),
  reason: z.string().trim().min(5).max(500),
}).strict();

export async function PATCH(request: NextRequest) {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles: writeRoles, requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid customer update.', correlationId }, correlationId, 400);

  const admin = createAdminSupabaseClient();
  const { data: current } = await admin
    .from('parent_profiles')
    .select('display_name,phone,marketing_consent,customer_tags,admin_notes')
    .eq('user_id', parsed.data.userId)
    .maybeSingle();
  const before = {
    hasDisplayName: Boolean(current?.display_name),
    hasPhone: Boolean(current?.phone),
    marketingConsent: current?.marketing_consent ?? false,
    tagCount: current?.customer_tags?.length ?? 0,
    hasNotes: Boolean(current?.admin_notes),
  };
  const after = {
    hasDisplayName: Boolean(parsed.data.fullName),
    hasPhone: Boolean(parsed.data.phone),
    marketingConsent: parsed.data.marketingConsent,
    tagCount: parsed.data.tags.length,
    hasNotes: Boolean(parsed.data.notes),
  };
  const audit = {
    actor: access,
    action: 'customer_profile.update',
    targetType: 'parent_profile',
    targetId: parsed.data.userId,
    before,
    after,
    reason: parsed.data.reason,
    correlationId,
  } as const;
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }

  const { data: updated, error } = await admin.from('parent_profiles').update({
    display_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    marketing_consent: parsed.data.marketingConsent,
    customer_tags: parsed.data.tags,
    admin_notes: parsed.data.notes || null,
    updated_at: new Date().toISOString(),
  }).eq('user_id', parsed.data.userId).select('user_id').maybeSingle();
  await recordAdminAudit(admin, { ...audit, outcome: error || !updated ? 'failed' : 'succeeded' });
  return error || !updated
    ? adminJsonResponse({ error: 'Could not update customer.', correlationId }, correlationId, 503)
    : adminJsonResponse({ success: true, correlationId }, correlationId);
}
