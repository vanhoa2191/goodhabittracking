import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const caseRow = { id: '22222222-2222-4222-8222-222222222222', family_id: 'family-1', order_code: 4242, case_type: 'refund', status: 'approved', resolution_code: 'manual_refund_required' };
const rpc = vi.fn();
const caseUpdate = vi.fn();
const recordAdminAudit = vi.fn();

const table = {
  select: () => table,
  eq: () => table,
  maybeSingle: async () => ({ data: caseRow, error: null }),
  update: (values: unknown) => { caseUpdate(values); return { eq: async () => ({ error: null }) }; },
};

vi.mock('@/lib/auth/admin-access', () => ({
  authorizeAdmin: async () => ({ authorized: true, user: { id: 'admin-1' }, role: 'finance' }),
  adminAuthorizationResponse: () => new Response('{}', { status: 403 }),
  adminJsonResponse: (body: unknown, _id: string, status = 200) => new Response(JSON.stringify(body), { status }),
}));
vi.mock('@/lib/auth/admin-audit-server', () => ({ recordAdminAudit: (...args: unknown[]) => recordAdminAudit(...args) }));
vi.mock('@/lib/billing/payos-server', () => ({ cancelPayOSPayment: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc, from: () => table }) }));

import { PATCH } from '@/app/api/admin/billing-cases/route';

function patch(body: unknown) {
  return new NextRequest('http://localhost/api/admin/billing-cases', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
const confirmRefund = { caseId: caseRow.id, status: 'completed', resolutionCode: 'manual_refund_confirmed', reason: 'Đã hoàn tiền thủ công' };

describe('PATCH /api/admin/billing-cases (confirmed refund)', () => {
  beforeEach(() => {
    rpc.mockReset();
    caseUpdate.mockReset();
    recordAdminAudit.mockReset();
    recordAdminAudit.mockResolvedValue(true);
  });

  it('takes the referral commission back before the case is marked completed', async () => {
    const order: string[] = [];
    rpc.mockImplementation(async () => { order.push('reverse'); return { data: 'reversed', error: null }; });
    caseUpdate.mockImplementation(() => order.push('complete'));
    const response = await PATCH(patch(confirmRefund));
    expect(response.status).toBe(200);
    expect(order).toEqual(['reverse', 'complete']);
    await expect(response.json()).resolves.toMatchObject({ referralCommission: 'reversed' });
  });

  it('leaves the case open when the reversal fails, so it can be retried', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
    const response = await PATCH(patch(confirmRefund));
    expect(response.status).toBe(503);
    expect(caseUpdate).not.toHaveBeenCalled();
  });

  it.each(['in_payout', 'already_paid'])('still completes the case but reports %s so the admin acts on it', async (result) => {
    rpc.mockResolvedValue({ data: result, error: null });
    const response = await PATCH(patch(confirmRefund));
    expect(response.status).toBe(200);
    expect(caseUpdate).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toMatchObject({ referralCommission: result });
  });

  it('does not touch commissions for anything but a confirmed refund', async () => {
    const response = await PATCH(patch({ ...confirmRefund, status: 'reviewing', resolutionCode: 'manual_refund_required' }));
    expect(response.status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });
});
