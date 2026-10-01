import type { SupabaseClient } from '@supabase/supabase-js';

type RefundCase = {
  readonly caseId: string;
  readonly caseType: string;
  readonly status: string;
  readonly resolutionCode: string | null;
  readonly orderCode: number | string | null;
};

export type RefundReversal = { readonly applies: false } | { readonly applies: true; readonly result: string; readonly failed: boolean };

/**
 * A refund that support has confirmed paid back takes the referral commission of that order back while
 * it is still held. Anything else leaves referral commissions untouched.
 */
export async function reverseCommissionForConfirmedRefund(
  admin: Pick<SupabaseClient, 'rpc'>,
  refund: RefundCase,
): Promise<RefundReversal> {
  if (refund.caseType !== 'refund' || refund.status !== 'completed' || refund.resolutionCode !== 'manual_refund_confirmed' || !refund.orderCode) {
    return { applies: false };
  }
  const { data, error } = await admin.rpc('admin_reverse_referral_commission', {
    target_order_code: refund.orderCode,
    reason: `Refund confirmed (case ${refund.caseId})`,
  });
  return error ? { applies: true, result: 'error', failed: true } : { applies: true, result: String(data), failed: false };
}
