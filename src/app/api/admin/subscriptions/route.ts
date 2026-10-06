import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  adminAuthorizationResponse,
  adminJsonResponse,
  authorizeAdmin,
} from '@/lib/auth/admin-access';
import { recordAdminAudit } from '@/lib/auth/admin-audit-server';
import { createCorrelationId } from '@/lib/observability/logger';
import { PAID_PLAN_IDS, isPaidPlanId, planDurationDays } from '@/lib/billing/plan-catalog';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

const roles = ['finance', 'super_admin'] as const;
const schema = z.object({
  familyId: z.string().uuid(),
  plan: z.enum(['free', 'trial', ...PAID_PLAN_IDS, 'lifetime']),
  status: z.enum(['active', 'inactive', 'cancelled']),
  endsAt: z.string().datetime().nullable(),
  /** The `updated_at` the admin screen loaded; a different value means the subscription changed since (a payment, another admin). */
  expectedUpdatedAt: z.string().nullable(),
  reason: z.string().trim().min(5).max(500),
}).strict();

export async function PATCH(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
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
    .select('plan,status,subscription_ends_at,trial_ends_at,trial_consumed_at,updated_at')
    .eq('family_id', parsed.data.familyId)
    .maybeSingle();
  if ((current?.updated_at ?? null) !== parsed.data.expectedUpdatedAt) {
    return adminJsonResponse({ error: 'The subscription changed since you opened it. Reload and review it before saving.', code: 'subscription_changed', correlationId }, correlationId, 409);
  }
  const days = isPaidPlanId(parsed.data.plan)
    ? planDurationDays(parsed.data.plan)
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
    subscriptionEndsAt: isPaidPlanId(parsed.data.plan) ? endsAt : null,
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
    subscription_ends_at: isPaidPlanId(parsed.data.plan) ? endsAt : null,
    trial_ends_at: parsed.data.plan === 'trial' ? endsAt : null,
    // A trial granted here is a trial used: it must count as consumed so the family cannot start another later.
    trial_consumed_at: current?.trial_consumed_at ?? (parsed.data.plan === 'trial' ? new Date().toISOString() : null),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'family_id' });
  await recordAdminAudit(admin, { ...audit, outcome: error ? 'failed' : 'succeeded' });
  return error
    ? adminJsonResponse({ error: 'Could not update subscription.', correlationId }, correlationId, 503)
    : adminJsonResponse({ success: true, correlationId }, correlationId);
}
