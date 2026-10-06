import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  adminAuthorizationResponse,
  adminJsonResponse,
  authorizeAdmin,
} from '@/lib/auth/admin-access';
import { recordAdminAudit } from '@/lib/auth/admin-audit-server';
import { LAUNCH_OFFER } from '@/lib/billing/plan-catalog';
import { createCorrelationId } from '@/lib/observability/logger';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

const roles = ['finance', 'super_admin'] as const;

/** Claims as the admin sees them: order, date, state and a shortened family id, nothing that names a person. */
export async function GET() {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const { data, error } = await createAdminSupabaseClient()
    .from('launch_offer_claims')
    .select('order_code,family_id,claimed_at,revoked_at')
    .eq('offer_code', LAUNCH_OFFER.code)
    .order('claimed_at', { ascending: true });
  if (error) return adminJsonResponse({ error: 'Could not load launch offer claims.', correlationId }, correlationId, 503);
  const claims = (data ?? []).map((row) => ({
    orderCode: Number(row.order_code),
    familyShort: String(row.family_id).slice(0, 8),
    claimedAt: row.claimed_at as string,
    revoked: row.revoked_at !== null,
  }));
  return adminJsonResponse({ claims, slots: LAUNCH_OFFER.slots, correlationId }, correlationId);
}

const schema = z.object({
  orderCode: z.number().int().positive(),
  reason: z.string().trim().min(1).max(200),
}).strict();

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles, requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid request.', correlationId }, correlationId, 400);

  const { orderCode, reason } = parsed.data;
  const admin = createAdminSupabaseClient();
  const audit = {
    actor: access,
    action: 'launch_offer.revoke',
    targetType: 'launch_offer_claim',
    targetId: String(orderCode),
    before: { revoked: false },
    after: { revoked: true },
    reason,
    correlationId,
  } as const;
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }
  const { error } = await admin.rpc('admin_revoke_launch_offer_claim', { target_order_code: orderCode, reason });
  await recordAdminAudit(admin, { ...audit, outcome: error ? 'failed' : 'succeeded' });
  return error
    ? adminJsonResponse({ error: 'Could not revoke the claim.', correlationId }, correlationId, 503)
    : adminJsonResponse({ success: true, correlationId }, correlationId);
}
