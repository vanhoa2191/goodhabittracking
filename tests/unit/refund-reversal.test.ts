import { describe, expect, it, vi } from 'vitest';
import { reverseCommissionForConfirmedRefund } from '@/lib/referral/refund-reversal';

const confirmed = { caseId: 'case-1', caseType: 'refund', status: 'completed', resolutionCode: 'manual_refund_confirmed', orderCode: 1234567 };

function admin(result: { data?: unknown; error?: unknown }) {
  return { rpc: vi.fn(async () => ({ data: result.data ?? null, error: result.error ?? null })) } as never as Parameters<typeof reverseCommissionForConfirmedRefund>[0] & { rpc: ReturnType<typeof vi.fn> };
}

describe('referral commission reversal on a confirmed refund', () => {
  it('reverses the order\'s commission and reports the answer', async () => {
    const client = admin({ data: 'reversed' });
    await expect(reverseCommissionForConfirmedRefund(client, confirmed)).resolves.toEqual({ applies: true, result: 'reversed', failed: false });
    expect(client.rpc).toHaveBeenCalledWith('admin_reverse_referral_commission', {
      target_order_code: 1234567,
      reason: 'Refund confirmed (case case-1)',
    });
  });

  it.each([
    ['a support case', { caseType: 'support' }],
    ['a cancellation', { caseType: 'cancellation' }],
    ['a refund still under review', { status: 'reviewing' }],
    ['a refund that was approved but not yet paid back', { status: 'approved', resolutionCode: 'manual_refund_required' }],
    ['a refund without the confirmation code', { resolutionCode: 'not_eligible' }],
    ['a case with no order', { orderCode: null }],
  ])('leaves commissions alone for %s', async (_label, change) => {
    const client = admin({ data: 'reversed' });
    await expect(reverseCommissionForConfirmedRefund(client, { ...confirmed, ...change })).resolves.toEqual({ applies: false });
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it.each(['in_payout', 'already_paid', 'no_commission', 'already_reversed'])('passes on %s so the admin can settle it by hand', async (answer) => {
    await expect(reverseCommissionForConfirmedRefund(admin({ data: answer }), confirmed)).resolves.toEqual({ applies: true, result: answer, failed: false });
  });

  it('flags a database error as a failure without throwing', async () => {
    await expect(reverseCommissionForConfirmedRefund(admin({ error: { message: 'down' } }), confirmed)).resolves.toEqual({ applies: true, result: 'error', failed: true });
  });
});
