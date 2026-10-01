import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  adminAuthorizationResponse,
  adminJsonResponse,
  authorizeAdmin,
} from '@/lib/auth/admin-access';
import { recordAdminAudit, type AdminAuditInput } from '@/lib/auth/admin-audit-server';
import { createCorrelationId } from '@/lib/observability/logger';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { maskPayoutAccounts, type AffiliateOverviewPayload } from '@/lib/referral/mask-account';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

const resolveRoles = ['finance', 'super_admin'] as const;

const resolveSchema = z.object({
  payoutId: z.string().uuid(),
  resolution: z.enum(['claim', 'paid', 'rejected']),
  reference: z.string().trim().max(120).default(''),
  note: z.string().trim().max(500).default(''),
  reason: z.string().trim().min(5).max(500),
}).strict();

export async function GET() {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles: ['support', 'finance', 'super_admin'] });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const { data, error } = await createAdminSupabaseClient().rpc('admin_affiliate_overview');
  if (error || !data) return adminJsonResponse({ error: 'Could not load the referral programme.', correlationId }, correlationId, 503);
  const overview = access.role === 'support' ? maskPayoutAccounts(data as AffiliateOverviewPayload) : (data as AffiliateOverviewPayload);
  return adminJsonResponse({ ...overview, correlationId }, correlationId);
}

// Money leaves the business only through this route: the admin transfers it by hand first, then records
// the bank reference here. Marking a payout paid needs a reference, an MFA session and an audit entry.
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles: resolveRoles, requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = resolveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid payout update.', correlationId }, correlationId, 400);
  if (parsed.data.resolution === 'paid' && parsed.data.reference === '') {
    return adminJsonResponse({ error: 'A bank reference is required to mark a payout as paid.', correlationId }, correlationId, 400);
  }

  const admin = createAdminSupabaseClient();
  const audit: Omit<AdminAuditInput, 'outcome'> = {
    actor: access,
    action: 'affiliate.payout.resolve',
    targetType: 'affiliate_payout',
    targetId: parsed.data.payoutId,
    before: { status: 'requested' },
    after: { status: parsed.data.resolution },
    reason: parsed.data.reason,
    correlationId,
  };
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }

  if (parsed.data.resolution === 'claim') {
    const claimed = await admin.rpc('admin_claim_affiliate_payout', { target_payout_id: parsed.data.payoutId, admin_user: access.user.id });
    const claimedOk = !claimed.error && claimed.data === 'claimed';
    await recordAdminAudit(admin, { ...audit, action: 'affiliate.payout.claim', before: null, after: { claimed: claimedOk }, outcome: claimedOk ? 'succeeded' : 'failed' });
    if (claimed.error) return adminJsonResponse({ error: 'Could not claim the payout.', correlationId }, correlationId, 503);
    if (!claimedOk) {
      const message = claimed.data === 'taken'
        ? 'Another admin is already handling this payout. Wait for them to finish or for the claim to expire after two hours.'
        : 'The payout was already resolved or could not be found.';
      return adminJsonResponse({ error: message, status: claimed.data, correlationId }, correlationId, 409);
    }
    return adminJsonResponse({ success: true, correlationId }, correlationId);
  }

  const { data, error } = await admin.rpc('admin_resolve_affiliate_payout', {
    target_payout_id: parsed.data.payoutId,
    resolution: parsed.data.resolution,
    admin_user: access.user.id,
    payout_reference: parsed.data.reference,
    payout_note: parsed.data.note,
  });
  const ok = !error && data === parsed.data.resolution;
  await recordAdminAudit(admin, { ...audit, outcome: ok ? 'succeeded' : 'failed' });
  if (error) return adminJsonResponse({ error: 'Could not update the payout.', correlationId }, correlationId, 503);
  if (data === 'claimed_by_other' || data === 'claim_required') {
    return adminJsonResponse({
      error: data === 'claim_required'
        ? 'Claim this payout first, then transfer the money and record the bank reference.'
        : 'Another admin is handling this payout. Wait for them to finish or for the claim to expire after two hours.',
      status: data,
      correlationId,
    }, correlationId, 409);
  }
  if (data === 'amount_mismatch') {
    return adminJsonResponse({ error: 'The commissions in this payout no longer add up to its amount, usually because a refund took one back. Reject the payout so the parent can request again.', status: data, correlationId }, correlationId, 409);
  }
  if (!ok) return adminJsonResponse({ error: 'The payout was already resolved or could not be found.', status: data, correlationId }, correlationId, 409);
  return adminJsonResponse({ success: true, correlationId }, correlationId);
}
