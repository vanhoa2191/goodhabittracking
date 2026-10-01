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
  node.maybeSingle = async () => ({ data: name === 'payment_orders' ? orderRow : caseRow, error: null });
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
    it('takes the referral commission back before the case is marked completed', async () => {
      const order: string[] = [];
      rpc.mockImplementation(async () => { order.push('reverse'); return { data: 'reversed', error: null }; });
      caseUpdate.mockImplementation(() => order.push('complete'));
      const response = await patch(confirmRefund);
      expect(response.status).toBe(200);
      expect(order).toEqual(['reverse', 'complete']);
      await expect(response.json()).resolves.toMatchObject({ referralCommission: 'reversed' });
    });

    it('leaves the case open when the reversal fails, so it can be retried', async () => {
      rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
      expect((await patch(confirmRefund)).status).toBe(503);
      expect(caseUpdate).not.toHaveBeenCalled();
    });

    it.each(['in_payout', 'already_paid'])('still completes the case but reports %s so the admin acts on it', async (result) => {
      rpc.mockResolvedValue({ data: result, error: null });
      const response = await patch(confirmRefund);
      expect(response.status).toBe(200);
      expect(caseUpdate).toHaveBeenCalledTimes(1);
      await expect(response.json()).resolves.toMatchObject({ referralCommission: result });
    });

    it('does not touch commissions for anything but a confirmed refund', async () => {
      expect((await patch({ ...confirmRefund, status: 'reviewing', resolutionCode: 'manual_refund_required' })).status).toBe(200);
      expect(rpc).not.toHaveBeenCalled();
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
      rpc.mockResolvedValue({ data: 'already_reversed', error: null });
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
      expect(caseUpdate).toHaveBeenCalled();
    });

    it('finishes a retry when the link was already cancelled, without asking PayOS again', async () => {
      orderRow = { status: 'CANCELLED' };
      expect((await patch(cancellation)).status).toBe(200);
      expect(cancelPayOSPayment).not.toHaveBeenCalled();
      expect(caseUpdate).toHaveBeenCalled();
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
