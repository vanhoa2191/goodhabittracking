import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  adminAuthorizationResponse,
  adminJsonResponse,
  authorizeAdmin,
} from '@/lib/auth/admin-access';
import { recordAdminAudit, type AdminAuditInput } from '@/lib/auth/admin-audit-server';
import { cancelPendingPayOSOrder } from '@/lib/billing/payos-reconcile';
import { createCorrelationId } from '@/lib/observability/logger';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

const readRoles = ['support', 'finance', 'super_admin'] as const;
const createRoles = ['support', 'finance', 'super_admin'] as const;
const resolveRoles = ['finance', 'super_admin'] as const;

const createSchema = z.object({
  userId: z.string().uuid(),
  familyId: z.string().uuid(),
  orderCode: z.number().int().positive().nullable(),
  caseType: z.enum(['support', 'refund', 'cancellation']),
  reasonCode: z.enum(['duplicate_payment', 'wrong_plan', 'service_issue', 'changed_mind', 'other']),
  reason: z.string().trim().min(5).max(500),
}).strict();

const updateSchema = z.object({
  caseId: z.string().uuid(),
  status: z.enum(['requested', 'reviewing', 'approved', 'rejected', 'completed']),
  resolutionCode: z.enum([
    'information_provided',
    'payment_link_cancelled',
    'manual_refund_required',
    'manual_refund_confirmed',
    'not_eligible',
    'subscription_cancelled',
  ]).nullable(),
  reason: z.string().trim().min(5).max(500),
}).strict();

export async function GET() {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles: readRoles });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const admin = createAdminSupabaseClient();
  const columns = 'id,family_id,user_id,order_code,case_type,reason_code,status,resolution_code,created_at,updated_at,resolved_at';
  // Every unresolved case, however old, plus the most recent resolved ones, so old work is never pushed out by new.
  const [open, closed] = await Promise.all([
    admin.from('billing_support_cases').select(columns).in('status', ['requested', 'reviewing', 'approved']).order('created_at', { ascending: false }).limit(500),
    admin.from('billing_support_cases').select(columns).in('status', ['rejected', 'completed']).order('created_at', { ascending: false }).limit(50),
  ]);
  const data = [...(open.data ?? []), ...(closed.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return open.error || closed.error
    ? adminJsonResponse({ error: 'Could not load billing cases.', correlationId }, correlationId, 503)
    : adminJsonResponse({ cases: data, correlationId }, correlationId);
}

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles: createRoles, requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid billing case.', correlationId }, correlationId, 400);

  const admin = createAdminSupabaseClient();
  const { data: membership } = await admin
    .from('family_memberships')
    .select('family_id,user_id')
    .eq('family_id', parsed.data.familyId)
    .eq('user_id', parsed.data.userId)
    .maybeSingle();
  if (!membership) return adminJsonResponse({ error: 'Customer family not found.', correlationId }, correlationId, 404);
  if (parsed.data.orderCode !== null) {
    const { data: order } = await admin
      .from('payment_orders')
      .select('order_code')
      .eq('order_code', parsed.data.orderCode)
      .eq('family_id', parsed.data.familyId)
      .maybeSingle();
    if (!order) return adminJsonResponse({ error: 'Payment order not found.', correlationId }, correlationId, 404);
  }

  const caseId = crypto.randomUUID();
  const audit = {
    actor: access,
    action: 'billing_case.create',
    targetType: 'billing_support_case',
    targetId: caseId,
    before: {},
    after: { caseType: parsed.data.caseType, status: 'requested' },
    reason: parsed.data.reason,
    correlationId,
  } as const;
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }
  const { error } = await admin.from('billing_support_cases').insert({
    id: caseId,
    family_id: parsed.data.familyId,
    user_id: parsed.data.userId,
    order_code: parsed.data.orderCode,
    case_type: parsed.data.caseType,
    reason_code: parsed.data.reasonCode,
    created_by: access.user.id,
    assigned_to: access.user.id,
  });
  await recordAdminAudit(admin, { ...audit, outcome: error ? 'failed' : 'succeeded' });
  return error
    ? adminJsonResponse({ error: 'Could not create billing case.', correlationId }, correlationId, 503)
    : adminJsonResponse({ success: true, caseId, correlationId }, correlationId);
}

export async function PATCH(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles: resolveRoles, requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid case update.', correlationId }, correlationId, 400);

  const admin = createAdminSupabaseClient();
  const { data: supportCase } = await admin
    .from('billing_support_cases')
    .select('id,family_id,order_code,case_type,status,resolution_code')
    .eq('id', parsed.data.caseId)
    .maybeSingle();
  if (!supportCase) return adminJsonResponse({ error: 'Billing case not found.', correlationId }, correlationId, 404);

  if (parsed.data.resolutionCode === 'payment_link_cancelled'
    && (supportCase.case_type !== 'cancellation' || !supportCase.order_code)) {
    return adminJsonResponse({ error: 'This case has no cancellable payment link.', correlationId }, correlationId, 409);
  }
  if (supportCase.case_type === 'refund'
    && parsed.data.status === 'completed'
    && parsed.data.resolutionCode !== 'manual_refund_confirmed') {
    return adminJsonResponse({ error: 'A refund can be completed only after manual confirmation.', correlationId }, correlationId, 409);
  }
  if (parsed.data.resolutionCode === 'subscription_cancelled'
    && (supportCase.case_type !== 'cancellation' || parsed.data.status !== 'completed')) {
    return adminJsonResponse({ error: 'Subscription cancellation requires a completed cancellation case.', correlationId }, correlationId, 409);
  }

  // A closed case is final. Saving the same result again is allowed (a retry), but an old page cannot reopen it.
  if ((supportCase.status === 'completed' || supportCase.status === 'rejected')
    && (parsed.data.status !== supportCase.status || parsed.data.resolutionCode !== supportCase.resolution_code)) {
    return adminJsonResponse({ error: 'This case is already closed.', code: 'case_closed', correlationId }, correlationId, 409);
  }
  if (supportCase.case_type === 'refund' && parsed.data.status === 'completed' && parsed.data.resolutionCode === 'manual_refund_confirmed') {
    if (!supportCase.order_code) {
      return adminJsonResponse({ error: 'A refund can only be confirmed for a paid order. Link the order first.', code: 'refund_needs_order', correlationId }, correlationId, 409);
    }
    const { data: paidOrder } = await admin
      .from('payment_orders')
      .select('order_code,amount,description,status,created_at,expires_at')
      .eq('order_code', supportCase.order_code)
      .eq('family_id', supportCase.family_id)
      .maybeSingle();
    if (paidOrder?.status !== 'PAID') {
      return adminJsonResponse({ error: 'Only a paid order can be refunded.', code: 'refund_order_not_paid', correlationId }, correlationId, 409);
    }
    const { data: alreadyConfirmed } = await admin
      .from('billing_support_cases')
      .select('id')
      .eq('order_code', supportCase.order_code)
      .eq('case_type', 'refund')
      .eq('status', 'completed')
      .eq('resolution_code', 'manual_refund_confirmed')
      .neq('id', supportCase.id)
      .limit(1);
    if ((alreadyConfirmed ?? []).length > 0) {
      return adminJsonResponse({ error: 'This order already has a confirmed refund.', code: 'refund_already_confirmed', correlationId }, correlationId, 409);
    }
  }

  const audit: Omit<AdminAuditInput, 'outcome'> = {
    actor: access,
    action: 'billing_case.resolve',
    targetType: 'billing_support_case',
    targetId: supportCase.id,
    before: { status: supportCase.status, resolutionCode: supportCase.resolution_code },
    after: { status: parsed.data.status, resolutionCode: parsed.data.resolutionCode },
    reason: parsed.data.reason,
    correlationId,
  };
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }
  const fail = async (message: string, status: number) => {
    await recordAdminAudit(admin, { ...audit, outcome: 'failed' });
    return adminJsonResponse({ error: message, correlationId }, correlationId, status);
  };

  if (parsed.data.resolutionCode === 'payment_link_cancelled') {
    const { data: order } = await admin
      .from('payment_orders')
      .select('order_code,amount,description,status,created_at,expires_at')
      .eq('order_code', supportCase.order_code)
      .eq('family_id', supportCase.family_id)
      .maybeSingle();
    // A link already cancelled by an earlier attempt of this same action only needs the case saved, so a retry can finish.
    if (!order || (order.status !== 'PENDING' && order.status !== 'CANCELLED')) return fail('Only a pending payment link can be cancelled.', 409);
    if (order.status === 'PENDING') {
      try {
        await cancelPendingPayOSOrder(order, 'Customer support cancellation');
      } catch {
        return fail('PayOS did not confirm the cancellation.', 503);
      }
      const { data: cancelledOrder, error: orderError } = await admin.from('payment_orders').update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
      })
        .eq('order_code', supportCase.order_code)
        .eq('family_id', supportCase.family_id)
        .eq('status', 'PENDING')
        .select('order_code')
        .maybeSingle();
      if (orderError || !cancelledOrder) return fail('Could not store the payment cancellation.', 503);
    }
  }

  // The row lock, finality check, refund uniqueness and financial side effects share one transaction.
  const { data: result, error } = await admin.rpc('admin_resolve_billing_case', {
    target_case: supportCase.id,
    next_status: parsed.data.status,
    next_resolution: parsed.data.resolutionCode,
    actor_id: access.user.id,
    reason: parsed.data.reason,
  });
  await recordAdminAudit(admin, { ...audit, outcome: error || result?.code !== 'updated' ? 'failed' : 'succeeded' });
  if (error || !result) return adminJsonResponse({ error: 'Could not update billing case.', correlationId }, correlationId, 503);
  if (result.code !== 'updated') return adminJsonResponse({ error: 'This case changed or cannot be resolved. Reload and review it.', code: result.code, correlationId }, correlationId, result.code === 'case_not_found' ? 404 : 409);
  if (result.referralCommission) {
    await recordAdminAudit(admin, { ...audit, action: 'affiliate.commission.reverse', targetType: 'payment_order', targetId: String(supportCase.order_code), before: null, after: { referral: result.referralCommission }, outcome: 'succeeded' });
  }
  if (result.launchOfferClaim === 'revoked') {
    await recordAdminAudit(admin, { ...audit, action: 'launch_offer.revoke', targetType: 'launch_offer_claim', targetId: String(supportCase.order_code), before: null, after: { revoked: true }, outcome: 'succeeded' });
  }
  return adminJsonResponse({ success: true, referralCommission: result.referralCommission, launchOfferClaim: result.launchOfferClaim, correlationId }, correlationId);
}
