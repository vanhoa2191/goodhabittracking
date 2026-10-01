import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { minimizeAdminAuditSnapshot } from '@/lib/auth/admin-audit';
import type { AuthorizedAdmin } from '@/lib/auth/admin-access';
import { logOperationalEvent } from '@/lib/observability/logger';

export type AdminAuditInput = {
  readonly actor: AuthorizedAdmin;
  readonly action: string;
  readonly targetType: string;
  readonly targetId: string;
  readonly outcome: 'attempted' | 'succeeded' | 'failed';
  readonly before?: Record<string, unknown> | null;
  readonly after?: Record<string, unknown> | null;
  readonly reason: string;
  readonly correlationId: string;
};

export async function recordAdminAudit(
  admin: SupabaseClient,
  input: AdminAuditInput,
): Promise<boolean> {
  const { error } = await admin.from('admin_audit_events').insert({
    actor_user_id: input.actor.user.id,
    actor_role: input.actor.role,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId.slice(0, 160),
    outcome: input.outcome,
    before_data: minimizeAdminAuditSnapshot(input.before),
    after_data: minimizeAdminAuditSnapshot(input.after),
    reason: input.reason.trim().slice(0, 500),
    correlation_id: input.correlationId,
  });
  if (error) {
    // The admin action may already have happened (outcome succeeded/failed is written after it), so a
    // lost audit row must at least leave an operational trace to reconcile by correlation id.
    logOperationalEvent('error', {
      operation: 'admin_audit_write',
      reasonCode: `${input.outcome}:${error.code ?? 'unknown'}`,
      correlationId: input.correlationId,
    });
  }
  return !error;
}
