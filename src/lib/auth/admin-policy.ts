import type { User } from '@supabase/supabase-js';

export const ADMIN_ROLES = ['support', 'finance', 'super_admin'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AuthenticatorAssuranceLevel = 'aal1' | 'aal2' | null;

export type AdminMembership = {
  readonly role: AdminRole;
  readonly expiresAt: string | null;
  readonly revokedAt: string | null;
};

type AdminAccessRequest = {
  readonly user: Pick<User, 'id' | 'email' | 'email_confirmed_at'> | null;
  readonly membership: AdminMembership | null;
  readonly requiredRoles: readonly AdminRole[];
  readonly currentAal: AuthenticatorAssuranceLevel;
  readonly requireAal2: boolean;
  readonly bootstrapEmails?: string;
  readonly bootstrapExpiresAt?: string;
  readonly allowEmergencyBootstrap?: boolean;
  readonly now?: Date;
};

export type AdminAccessDecision =
  | {
    readonly authorized: true;
    readonly userId: string;
    readonly role: AdminRole;
    readonly source: 'membership' | 'emergency_bootstrap';
  }
  | {
    readonly authorized: false;
    readonly code:
      | 'authentication_required'
      | 'membership_required'
      | 'membership_revoked'
      | 'membership_expired'
      | 'insufficient_role'
      | 'mfa_required';
    readonly status: 401 | 403 | 428;
  };

const MAX_BOOTSTRAP_DURATION_MS = 24 * 60 * 60 * 1000;

function isEmergencyBootstrapActive(
  email: string | null | undefined,
  emailConfirmedAt: string | null | undefined,
  configuredEmails: string,
  expiresAt: string,
  now: Date,
): boolean {
  const normalizedEmail = email?.trim().toLowerCase();
  const expiry = Date.parse(expiresAt);
  if (!normalizedEmail || !emailConfirmedAt || !Number.isFinite(expiry)) return false;
  if (expiry <= now.getTime() || expiry > now.getTime() + MAX_BOOTSTRAP_DURATION_MS) return false;

  return configuredEmails
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalizedEmail);
}

export function evaluateAdminAccess(request: AdminAccessRequest): AdminAccessDecision {
  const now = request.now ?? new Date();
  if (!request.user) {
    return { authorized: false, code: 'authentication_required', status: 401 };
  }

  let role: AdminRole | null = null;
  let source: 'membership' | 'emergency_bootstrap' = 'membership';
  if (request.membership) {
    if (request.membership.revokedAt) {
      return { authorized: false, code: 'membership_revoked', status: 403 };
    }
    const membershipExpiry = request.membership.expiresAt
      ? Date.parse(request.membership.expiresAt)
      : null;
    if (membershipExpiry !== null && (!Number.isFinite(membershipExpiry) || membershipExpiry <= now.getTime())) {
      return { authorized: false, code: 'membership_expired', status: 403 };
    }
    role = request.membership.role;
  } else if (request.allowEmergencyBootstrap && isEmergencyBootstrapActive(
    request.user.email,
    request.user.email_confirmed_at,
    request.bootstrapEmails ?? '',
    request.bootstrapExpiresAt ?? '',
    now,
  )) {
    role = 'super_admin';
    source = 'emergency_bootstrap';
  }

  if (!role) return { authorized: false, code: 'membership_required', status: 403 };
  if (!request.requiredRoles.includes(role)) {
    return { authorized: false, code: 'insufficient_role', status: 403 };
  }
  if (request.requireAal2 && request.currentAal !== 'aal2') {
    return { authorized: false, code: 'mfa_required', status: 428 };
  }

  return { authorized: true, userId: request.user.id, role, source };
}
