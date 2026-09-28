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

const roles = ['finance', 'super_admin'] as const;
const schema = z.object({
  familyId: z.string().uuid(),
  plan: z.enum(['free', 'trial', 'solo_monthly', 'monthly', 'yearly', 'lifetime']),
  status: z.enum(['active', 'inactive', 'cancelled']),
  endsAt: z.string().datetime().nullable(),
  reason: z.string().trim().min(5).max(500),
}).strict();

export async function PATCH(request: NextRequest) {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles, requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid subscription.', correlationId }, correlationId, 400);

  const admin = createAdminSupabaseClient();
  const { data: membership } = await admin
    .from('family_memberships')
    .select('user_id')
    .eq('family_id', parsed.data.familyId)
    .eq('role', 'owner')
    .maybeSingle();
  if (!membership) return adminJsonResponse({ error: 'Family not found.', correlationId }, correlationId, 404);

  const { data: current } = await admin
    .from('user_subscriptions')
    .select('plan,status,subscription_ends_at,trial_ends_at')
    .eq('family_id', parsed.data.familyId)
    .maybeSingle();
  const days = parsed.data.plan === 'solo_monthly' || parsed.data.plan === 'monthly'
    ? 31
    : parsed.data.plan === 'yearly'
      ? 366
      : parsed.data.plan === 'trial'
        ? 7
        : 0;
  const endsAt = parsed.data.endsAt
    ?? (days ? new Date(Date.now() + days * 86_400_000).toISOString() : null);
  const before = current
    ? {
      plan: current.plan,
      status: current.status,
      subscriptionEndsAt: current.subscription_ends_at,
      trialEndsAt: current.trial_ends_at,
    }
    : {};
  const after = {
    plan: parsed.data.plan,
    status: parsed.data.status,
    subscriptionEndsAt: ['solo_monthly', 'monthly', 'yearly'].includes(parsed.data.plan) ? endsAt : null,
    trialEndsAt: parsed.data.plan === 'trial' ? endsAt : null,
  };
  const audit = {
    actor: access,
    action: 'subscription.update',
    targetType: 'family_subscription',
    targetId: parsed.data.familyId,
    before,
    after,
    reason: parsed.data.reason,
    correlationId,
  } as const;
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }

  const { error } = await admin.from('user_subscriptions').upsert({
    family_id: parsed.data.familyId,
    user_id: membership.user_id,
    plan: parsed.data.plan,
    status: parsed.data.status,
    subscription_ends_at: ['solo_monthly', 'monthly', 'yearly'].includes(parsed.data.plan) ? endsAt : null,
    trial_ends_at: parsed.data.plan === 'trial' ? endsAt : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'family_id' });
  await recordAdminAudit(admin, { ...audit, outcome: error ? 'failed' : 'succeeded' });
  return error
    ? adminJsonResponse({ error: 'Could not update subscription.', correlationId }, correlationId, 503)
    : adminJsonResponse({ success: true, correlationId }, correlationId);
}
