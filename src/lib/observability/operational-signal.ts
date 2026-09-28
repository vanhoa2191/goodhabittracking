import 'server-only';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logOperationalEvent } from '@/lib/observability/logger';

export type OperationalSignalType =
  | 'payment_webhook_failure'
  | 'profile_mutation_failure'
  | 'pairing_failure';

const SAFE_REASON_CODES = new Set([
  'attempts_exhausted',
  'child_limit_reached',
  'consumed',
  'expired',
  'family_membership_required',
  'invalid',
  'invalid_code',
  'invalid_profile_mutation',
  'order_mismatch',
  'order_not_found',
  'processing_failed',
  'profile_conflict',
  'profile_mutation_failed',
  'profile_not_found',
  'profile_service_unavailable',
  'rate_limited',
  'revoked',
  'service_unavailable',
  'unknown_failure',
]);

export async function recordOperationalSignal(input: {
  readonly signalType: OperationalSignalType;
  readonly reasonCode: string;
  readonly correlationId: string;
  readonly status: number;
}): Promise<void> {
  const reasonCode = SAFE_REASON_CODES.has(input.reasonCode)
    ? input.reasonCode
    : 'unknown_failure';
  const correlationId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.correlationId)
    ? input.correlationId
    : crypto.randomUUID();
  try {
    const { error } = await createAdminSupabaseClient().from('operational_events').insert({
      signal_type: input.signalType,
      reason_code: reasonCode,
      correlation_id: correlationId,
      status: input.status,
    });
    if (error) throw error;
  } catch {
    logOperationalEvent('warn', {
      operation: 'operational_signal',
      reasonCode: 'persistence_failed',
      correlationId,
      status: 503,
    });
  }
}
