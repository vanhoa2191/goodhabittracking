import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminAuthorizationResponse, adminJsonResponse, authorizeAdmin } from '@/lib/auth/admin-access';
import { recordAdminAudit } from '@/lib/auth/admin-audit-server';
import { createCorrelationId } from '@/lib/observability/logger';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const schema = z.object({
  orderCode: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  reason: z.string().trim().min(5).max(500),
}).strict();

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles: ['finance', 'super_admin'], requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid commission update.', correlationId }, correlationId, 400);
  const admin = createAdminSupabaseClient();
  const audit = {
    actor: access, action: 'affiliate.commission.unfreeze', targetType: 'referral_commission',
    targetId: String(parsed.data.orderCode), before: { status: 'frozen' }, after: { status: 'unfrozen' },
    reason: parsed.data.reason, correlationId,
  };
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }
  const { data, error } = await admin.rpc('admin_unfreeze_referral_commission', {
    target_order_code: parsed.data.orderCode, admin_user: access.user.id,
    reason: parsed.data.reason, audit_correlation_id: correlationId,
  });
  // The successful audit event is written inside the same SQL transaction as the unfreeze.
  if (!error && data === 'unfrozen') return adminJsonResponse({ success: true, correlationId }, correlationId);
  await recordAdminAudit(admin, { ...audit, outcome: 'failed' });
  if (error) return adminJsonResponse({ error: 'Could not release the commission.', correlationId }, correlationId, 503);
  const messages: Record<string, string> = {
    billing_case_open: 'Resolve the open billing case before releasing this commission.',
    refund_confirmed: 'A refunded commission cannot be released.',
    not_frozen: 'This commission is no longer frozen.',
    no_commission: 'The commission could not be found.',
    not_authorized: 'Your finance membership is no longer active.',
    invalid_status: 'A paid or reversed commission cannot be released.',
  };
  return adminJsonResponse({ error: messages[String(data)] ?? 'The commission could not be released.', status: data, correlationId }, correlationId, 409);
}
