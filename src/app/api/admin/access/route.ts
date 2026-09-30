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
import { findAuthUserByEmail } from '@/lib/auth/admin-user-directory';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

const roles = ['super_admin'] as const;
const grantSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(['support', 'finance', 'super_admin']),
  expiresAt: z.string().datetime(),
  reason: z.string().trim().min(5).max(500),
}).strict();
const revokeSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(5).max(500),
}).strict();

export async function GET() {
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from('admin_memberships')
    .select('user_id,role,granted_at,expires_at,revoked_at')
    .order('granted_at', { ascending: false });
  return error
    ? adminJsonResponse({ error: 'Could not load admin access.', correlationId }, correlationId, 503)
    : adminJsonResponse({ memberships: data, correlationId }, correlationId);
}

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles, requireAal2: true, allowEmergencyBootstrap: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = grantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid admin grant.', correlationId }, correlationId, 400);

  const expiresAt = Date.parse(parsed.data.expiresAt);
  const now = Date.now();
  if (expiresAt <= now || expiresAt > now + 366 * 86_400_000) {
    return adminJsonResponse({ error: 'Admin access must expire within one year.', correlationId }, correlationId, 400);
  }

  const admin = createAdminSupabaseClient();
  const lookup = await findAuthUserByEmail(admin, parsed.data.email);
  const target = lookup.user;
  if (lookup.error) return adminJsonResponse({ error: 'Could not search accounts.', correlationId }, correlationId, 503);
  if (!target) return adminJsonResponse({ error: 'Account not found.', correlationId }, correlationId, 404);
  if (access.source === 'emergency_bootstrap' && target.id !== access.user.id) {
    return adminJsonResponse({ error: 'Emergency bootstrap can only establish its own DB membership.', correlationId }, correlationId, 403);
  }

  const { data: current } = await admin
    .from('admin_memberships')
    .select('role,expires_at,revoked_at')
    .eq('user_id', target.id)
    .maybeSingle();
  const audit = {
    actor: access,
    action: current ? 'admin_access.replace' : 'admin_access.grant',
    targetType: 'admin_membership',
    targetId: target.id,
    before: current ? { role: current.role, expiresAt: current.expires_at } : {},
    after: { role: parsed.data.role, expiresAt: parsed.data.expiresAt },
    reason: parsed.data.reason,
    correlationId,
  } as const;
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }
  const { data: granted, error } = await admin.rpc('grant_admin_membership', {
    target_user_id: target.id,
    target_role: parsed.data.role,
    target_expires_at: parsed.data.expiresAt,
    actor_id: access.user.id,
    reason: parsed.data.reason,
  });
  await recordAdminAudit(admin, { ...audit, outcome: error || granted !== true ? 'failed' : 'succeeded' });
  if (error?.message.includes('last_super_admin_required')) {
    return adminJsonResponse({ error: 'At least one other active super admin is required.', correlationId }, correlationId, 409);
  }
  return error || granted !== true
    ? adminJsonResponse({ error: 'Could not grant admin access.', correlationId }, correlationId, 503)
    : adminJsonResponse({ success: true, correlationId }, correlationId);
}

export async function PATCH(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const correlationId = createCorrelationId();
  const access = await authorizeAdmin({ roles, requireAal2: true });
  if (!access.authorized) return adminAuthorizationResponse(access, correlationId);
  const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJsonResponse({ error: 'Invalid admin revocation.', correlationId }, correlationId, 400);

  const admin = createAdminSupabaseClient();
  const { data: current } = await admin
    .from('admin_memberships')
    .select('role,expires_at,revoked_at')
    .eq('user_id', parsed.data.userId)
    .maybeSingle();
  if (!current || current.revoked_at) return adminJsonResponse({ error: 'Active admin access not found.', correlationId }, correlationId, 404);

  const audit = {
    actor: access,
    action: 'admin_access.revoke',
    targetType: 'admin_membership',
    targetId: parsed.data.userId,
    before: { role: current.role, expiresAt: current.expires_at },
    after: { role: current.role, expiresAt: current.expires_at, status: 'revoked' },
    reason: parsed.data.reason,
    correlationId,
  } as const;
  if (!await recordAdminAudit(admin, { ...audit, outcome: 'attempted' })) {
    return adminJsonResponse({ error: 'Could not record the admin action.', correlationId }, correlationId, 503);
  }
  const { data: revoked, error } = await admin.rpc('revoke_admin_membership', {
    target_user_id: parsed.data.userId,
    actor_id: access.user.id,
    reason: parsed.data.reason,
  });
  await recordAdminAudit(admin, { ...audit, outcome: error || revoked !== true ? 'failed' : 'succeeded' });
  if (error?.message.includes('last_super_admin_required')) {
    return adminJsonResponse({ error: 'At least one other active super admin is required.', correlationId }, correlationId, 409);
  }
  return error || revoked !== true
    ? adminJsonResponse({ error: 'Could not revoke admin access.', correlationId }, correlationId, 503)
    : adminJsonResponse({ success: true, correlationId }, correlationId);
}
