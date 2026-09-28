import 'server-only';

import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import {
  evaluateAdminAccess,
  type AdminAccessDecision,
  type AdminRole,
  type AuthenticatorAssuranceLevel,
} from '@/lib/auth/admin-policy';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type AuthorizedAdmin = {
  readonly authorized: true;
  readonly user: User;
  readonly role: AdminRole;
  readonly source: 'membership' | 'emergency_bootstrap';
};

export type AdminAuthorization = AuthorizedAdmin | Extract<AdminAccessDecision, { authorized: false }>;

export async function authorizeAdmin(options: {
  readonly roles: readonly AdminRole[];
  readonly requireAal2?: boolean;
  readonly allowEmergencyBootstrap?: boolean;
}): Promise<AdminAuthorization> {
  if (process.env.NODE_ENV !== 'production' && process.env.KIDHABIT_E2E_ADMIN_BYPASS === 'true') {
    return {
      authorized: true,
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'e2e-admin@example.com',
        app_metadata: {},
        user_metadata: {},
        identities: [],
        created_at: '2026-01-01T00:00:00.000Z',
      },
      role: 'super_admin',
      source: 'membership',
    };
  }
  const server = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await server.auth.getUser();
  if (userError || !user) {
    return { authorized: false, code: 'authentication_required', status: 401 };
  }

  const admin = createAdminSupabaseClient();
  const { data: membership, error: membershipError } = await admin
    .from('admin_memberships')
    .select('role,expires_at,revoked_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (membershipError) {
    return { authorized: false, code: 'membership_required', status: 403 };
  }

  let currentAal: AuthenticatorAssuranceLevel = null;
  const requireAal2 = options.requireAal2 ?? true;
  if (requireAal2) {
    const { data: assurance, error: assuranceError } = await server.auth.mfa
      .getAuthenticatorAssuranceLevel();
    if (!assuranceError) {
      currentAal = assurance.currentLevel === 'aal2'
        ? 'aal2'
        : assurance.currentLevel === 'aal1'
          ? 'aal1'
          : null;
    }
  }

  const decision = evaluateAdminAccess({
    user,
    membership: membership
      ? {
        role: membership.role as AdminRole,
        expiresAt: membership.expires_at,
        revokedAt: membership.revoked_at,
      }
      : null,
    requiredRoles: options.roles,
    currentAal,
    requireAal2,
    bootstrapEmails: process.env.ADMIN_EMAILS,
    bootstrapExpiresAt: process.env.ADMIN_BOOTSTRAP_EXPIRES_AT,
    allowEmergencyBootstrap: options.allowEmergencyBootstrap ?? false,
  });

  return decision.authorized
    ? { ...decision, user }
    : decision;
}

export function adminAuthorizationResponse(
  access: Exclude<AdminAuthorization, AuthorizedAdmin>,
  correlationId: string,
): NextResponse {
  const message = access.code === 'authentication_required'
    ? 'Authentication required.'
    : access.code === 'mfa_required'
      ? 'Multi-factor authentication required.'
      : 'Forbidden.';

  return NextResponse.json(
    { error: message, code: access.code, correlationId },
    { status: access.status, headers: { 'x-correlation-id': correlationId } },
  );
}

export function adminJsonResponse(
  body: Record<string, unknown>,
  correlationId: string,
  status = 200,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { 'x-correlation-id': correlationId },
  });
}
