import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const baseCase = { id: '22222222-2222-4222-8222-222222222222', family_id: 'family-1', order_code: 4242, case_type: 'refund', status: 'approved', resolution_code: 'manual_refund_required' };
let caseRow: Record<string, unknown> = baseCase;
let orderRow: Record<string, unknown> | null = { status: 'PAID' };
let otherConfirmed: Array<{ id: string }> = [];
const rpc = vi.fn();
const caseUpdate = vi.fn();
const orderUpdate = vi.fn();
const cancelPayOSPayment = vi.fn();
const recordAdminAudit = vi.fn();

function table(name: string) {
  const node: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'neq', 'in', 'order']) node[method] = () => node;
  node.limit = async () => ({ data: name === 'billing_support_cases' ? otherConfirmed : [], error: null });
  node.maybeSingle = async () => ({ data: name === 'payment_orders' ? (orderRow && { order_code: 4242, amount: 590000, description: 'KIDHABIT 4242', ...orderRow }) : caseRow, error: null });
  node.update = (values: unknown) => {
    (name === 'payment_orders' ? orderUpdate : caseUpdate)(values);
    const done: Record<string, unknown> = { error: null };
    const inner: Record<string, unknown> = {};
    for (const method of ['eq']) inner[method] = () => inner;
    inner.select = () => ({ maybeSingle: async () => ({ data: { order_code: 4242 }, error: null }) });
    inner.then = (resolve: (value: unknown) => void) => resolve(done);
    return inner;
  };
  return node;
}

vi.mock('@/lib/auth/admin-access', () => ({
  authorizeAdmin: async () => ({ authorized: true, user: { id: 'admin-1' }, role: 'finance' }),
  adminAuthorizationResponse: () => new Response('{}', { status: 403 }),
  adminJsonResponse: (body: unknown, _id: string, status = 200) => new Response(JSON.stringify(body), { status }),
}));
vi.mock('@/lib/auth/admin-audit-server', () => ({ recordAdminAudit: (...args: unknown[]) => recordAdminAudit(...args) }));
vi.mock('@/lib/billing/payos-server', () => ({ cancelPayOSPayment: (...args: unknown[]) => cancelPayOSPayment(...args) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc, from: (name: string) => table(name) }) }));

import { PayOSOrderNotFoundError } from '@/lib/billing/payos-errors';
import { PATCH } from '@/app/api/admin/billing-cases/route';

function patch(body: unknown) {
  return PATCH(new NextRequest('http://localhost/api/admin/billing-cases', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }));
}
const confirmRefund = { caseId: baseCase.id, status: 'completed', resolutionCode: 'manual_refund_confirmed', reason: 'Đã hoàn tiền thủ công' };

describe('PATCH /api/admin/billing-cases', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: { code: 'updated', referralCommission: 'reversed', launchOfferClaim: 'revoked' }, error: null });
    caseUpdate.mockReset();
    orderUpdate.mockReset();
    cancelPayOSPayment.mockReset();
    recordAdminAudit.mockReset();
    recordAdminAudit.mockResolvedValue(true);
    caseRow = baseCase;
    orderRow = { status: 'PAID' };
    otherConfirmed = [];
  });

  describe('confirmed refund', () => {
    it('atomically resolves the case with commission reversal and launch-seat revocation', async () => {
      const response = await patch(confirmRefund);
      expect(response.status).toBe(200);
      expect(rpc).toHaveBeenCalledWith('admin_resolve_billing_case', expect.objectContaining({ target_case: baseCase.id, next_status: 'completed', next_resolution: 'manual_refund_confirmed' }));
      expect(caseUpdate).not.toHaveBeenCalled();
      await expect(response.json()).resolves.toMatchObject({ referralCommission: 'reversed', launchOfferClaim: 'revoked' });
      expect(recordAdminAudit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: 'launch_offer.revoke', outcome: 'succeeded' }));
    });

    it('leaves the case open when the reversal fails, so it can be retried', async () => {
      rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
      expect((await patch(confirmRefund)).status).toBe(503);
      expect(caseUpdate).not.toHaveBeenCalled();
    });

    it.each(['in_payout', 'already_paid'])('still completes the case but reports %s so the admin acts on it', async (result) => {
      rpc.mockResolvedValue({ data: { code: 'updated', referralCommission: result, launchOfferClaim: 'revoked' }, error: null });
      const response = await patch(confirmRefund);
      expect(response.status).toBe(200);
      expect(caseUpdate).not.toHaveBeenCalled();
      await expect(response.json()).resolves.toMatchObject({ referralCommission: result });
    });

    it('does not touch commissions for anything but a confirmed refund', async () => {
      expect((await patch({ ...confirmRefund, status: 'reviewing', resolutionCode: 'manual_refund_required' })).status).toBe(200);
      expect(rpc).toHaveBeenCalledWith('admin_resolve_billing_case', expect.objectContaining({ next_status: 'reviewing' }));
    });

    it('refuses to confirm a refund for an order that is not paid', async () => {
      orderRow = { status: 'PENDING' };
      const response = await patch(confirmRefund);
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({ code: 'refund_order_not_paid' });
      expect(rpc).not.toHaveBeenCalled();
      expect(caseUpdate).not.toHaveBeenCalled();
    });

    it('refuses to confirm a refund that names no order', async () => {
      caseRow = { ...baseCase, order_code: null };
      const response = await patch(confirmRefund);
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({ code: 'refund_needs_order' });
    });

    it('allows only one confirmed refund per order', async () => {
      otherConfirmed = [{ id: 'another-case' }];
      const response = await patch(confirmRefund);
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({ code: 'refund_already_confirmed' });
      expect(caseUpdate).not.toHaveBeenCalled();
    });
  });

  it.each(['case_closed', 'refund_already_confirmed'])('reports a concurrent %s conflict from the atomic RPC', async (code) => {
    rpc.mockResolvedValue({ data: { code }, error: null });
    const response = await patch(confirmRefund);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code });
    expect(caseUpdate).not.toHaveBeenCalled();
  });

  describe('closed cases', () => {
    it('cannot be reopened by an old page', async () => {
      caseRow = { ...baseCase, status: 'completed', resolution_code: 'manual_refund_confirmed' };
      const response = await patch({ ...confirmRefund, status: 'reviewing', resolutionCode: 'manual_refund_required' });
      expect(response.status).toBe(409);
      await expect(response.json()).resolves.toMatchObject({ code: 'case_closed' });
      expect(caseUpdate).not.toHaveBeenCalled();
    });

    it('accepts saving the same closing result again, as a retry', async () => {
      caseRow = { ...baseCase, status: 'completed', resolution_code: 'manual_refund_confirmed' };
      rpc.mockResolvedValue({ data: { code: 'updated', referralCommission: 'already_reversed' }, error: null });
      expect((await patch(confirmRefund)).status).toBe(200);
    });
  });

  describe('cancelling a payment link', () => {
    const cancellation = { caseId: baseCase.id, status: 'completed', resolutionCode: 'payment_link_cancelled', reason: 'Khách đổi ý' };
    beforeEach(() => { caseRow = { ...baseCase, case_type: 'cancellation', status: 'requested', resolution_code: null }; });

    it('cancels the link at PayOS, then stores the order and the case', async () => {
      orderRow = { status: 'PENDING' };
      expect((await patch(cancellation)).status).toBe(200);
      expect(cancelPayOSPayment).toHaveBeenCalledTimes(1);
      expect(orderUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
      expect(rpc).toHaveBeenCalledWith('admin_resolve_billing_case', expect.anything());
    });

    it('closes an old provider-unknown order, including legacy orders with no expiry', async () => {
      orderRow = { status: 'PENDING', created_at: new Date(Date.now() - 16 * 60000).toISOString(), expires_at: null };
      cancelPayOSPayment.mockRejectedValue(new PayOSOrderNotFoundError());
      expect((await patch(cancellation)).status).toBe(200);
      expect(orderUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    });
    it.each([new PayOSOrderNotFoundError(), new Error('timeout')])('keeps an unverified fresh order open (%s)', async (error) => {
      orderRow = { status: 'PENDING', created_at: new Date().toISOString() };
      cancelPayOSPayment.mockRejectedValue(error);
      expect((await patch(cancellation)).status).toBe(503);
      expect(orderUpdate).not.toHaveBeenCalled();
    });
    it('finishes a retry when the link was already cancelled, without asking PayOS again', async () => {
      orderRow = { status: 'CANCELLED' };
      expect((await patch(cancellation)).status).toBe(200);
      expect(cancelPayOSPayment).not.toHaveBeenCalled();
      expect(rpc).toHaveBeenCalledWith('admin_resolve_billing_case', expect.anything());
    });

    it('refuses a link that was paid', async () => {
      orderRow = { status: 'PAID' };
      expect((await patch(cancellation)).status).toBe(409);
      expect(cancelPayOSPayment).not.toHaveBeenCalled();
    });

    it('accepts the status a new case starts with, so selecting a result and saving works', async () => {
      orderRow = { status: 'PENDING' };
      expect((await patch({ ...cancellation, status: 'requested' })).status).toBe(200);
    });
  });
});
