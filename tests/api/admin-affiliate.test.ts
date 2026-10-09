import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const recordAdminAudit = vi.fn();
const authorizeAdmin = vi.fn();

vi.mock('@/lib/auth/admin-access', () => ({
  authorizeAdmin: (options: unknown) => authorizeAdmin(options),
  adminAuthorizationResponse: () => new Response(JSON.stringify({ error: 'no' }), { status: 403 }),
  adminJsonResponse: (body: unknown, _id: string, status = 200) => new Response(JSON.stringify(body), { status }),
}));
vi.mock('@/lib/auth/admin-audit-server', () => ({ recordAdminAudit: (...args: unknown[]) => recordAdminAudit(...args) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc }) }));

import { POST } from '@/app/api/admin/affiliate/route';

const payoutId = '11111111-1111-4111-8111-111111111111';

function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/admin/affiliate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/affiliate', () => {
  beforeEach(() => {
    rpc.mockReset();
    recordAdminAudit.mockReset();
    authorizeAdmin.mockReset();
    authorizeAdmin.mockResolvedValue({ authorized: true, user: { id: 'admin-1' }, role: 'finance' });
    recordAdminAudit.mockResolvedValue(true);
  });

  it('is limited to finance and super admins with a second factor', async () => {
    rpc.mockResolvedValue({ data: 'paid', error: null });
    await POST(post({ payoutId, resolution: 'paid', reference: 'FT123', reason: 'Chuyển khoản xong' }));
    expect(authorizeAdmin).toHaveBeenCalledWith({ roles: ['finance', 'super_admin'], requireAal2: true });
  });

  it('refuses callers that are not authorised before touching anything', async () => {
    authorizeAdmin.mockResolvedValue({ authorized: false, code: 'forbidden' });
    expect((await POST(post({ payoutId, resolution: 'paid', reference: 'FT123', reason: 'Chuyển khoản xong' }))).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
    expect(recordAdminAudit).not.toHaveBeenCalled();
  });

  it('will not mark a payout paid without a bank reference', async () => {
    const response = await POST(post({ payoutId, resolution: 'paid', reference: '', reason: 'Chuyển khoản xong' }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    { payoutId: 'nope', resolution: 'paid', reference: 'x', reason: 'Chuyển khoản xong' },
    { payoutId, resolution: 'refunded', reference: 'x', reason: 'Chuyển khoản xong' },
    { payoutId, resolution: 'paid', reference: 'x', reason: 'ngắn' },
    { payoutId, resolution: 'paid', reference: 'x', reason: 'Chuyển khoản xong', amount: 1 },
  ])('rejects %j', async (body) => {
    expect((await POST(post(body))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('records the attempt before the change and the outcome after it', async () => {
    rpc.mockResolvedValue({ data: 'paid', error: null });
    const response = await POST(post({ payoutId, resolution: 'paid', reference: 'FT123', reason: 'Chuyển khoản xong' }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('admin_resolve_affiliate_payout', {
      target_payout_id: payoutId,
      resolution: 'paid',
      admin_user: 'admin-1',
      payout_reference: 'FT123',
      payout_note: '',
    });
    expect(recordAdminAudit.mock.calls.map(([, entry]) => entry.outcome)).toEqual(['attempted', 'succeeded']);
    expect(recordAdminAudit.mock.calls[0]![1]).toMatchObject({ action: 'affiliate.payout.resolve', targetId: payoutId });
  });

  it('stops when the audit trail cannot be written', async () => {
    recordAdminAudit.mockResolvedValue(false);
    expect((await POST(post({ payoutId, resolution: 'rejected', reason: 'Sai thông tin' }))).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('reports an already resolved payout instead of success', async () => {
    rpc.mockResolvedValue({ data: 'already_resolved', error: null });
    const response = await POST(post({ payoutId, resolution: 'rejected', reason: 'Sai thông tin' }));
    expect(response.status).toBe(409);
    expect(recordAdminAudit.mock.calls.at(-1)![1].outcome).toBe('failed');
  });

  it('lets an admin claim a payout before transferring and audits it', async () => {
    rpc.mockResolvedValue({ data: 'claimed', error: null });
    const response = await POST(post({ payoutId, resolution: 'claim', reason: 'Nhận xử lý chuyển khoản' }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('admin_claim_affiliate_payout', { target_payout_id: payoutId, admin_user: 'admin-1' });
    expect(recordAdminAudit.mock.calls.map(([, entry]) => entry.outcome)).toEqual(['attempted', 'succeeded']);
    expect(recordAdminAudit.mock.calls.at(-1)![1]).toMatchObject({ action: 'affiliate.payout.claim' });
  });

  it('tells a second admin that someone else already has the payout', async () => {
    rpc.mockResolvedValue({ data: 'taken', error: null });
    const response = await POST(post({ payoutId, resolution: 'claim', reason: 'Nhận xử lý chuyển khoản' }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ status: 'taken' });
    expect(recordAdminAudit.mock.calls.at(-1)![1].outcome).toBe('failed');
  });

  it.each(['claimed_by_other', 'claim_required', 'amount_mismatch'])('answers a resolution the database refused with %s', async (data) => {
    rpc.mockResolvedValue({ data, error: null });
    const response = await POST(post({ payoutId, resolution: 'paid', reference: 'FT1', reason: 'Chuyển khoản xong' }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ status: data });
  });

  it.each(['billing_case_open', 'refund_confirmed'])('exposes a durable payment block for %s without reporting success', async (status) => {
    rpc.mockResolvedValue({ data: status, error: null });
    const response = await POST(post({ payoutId, resolution: 'paid', reference: 'FT1', reason: 'Chuyển khoản xong' }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ status, blocked: true });
    expect(recordAdminAudit.mock.calls.at(-1)![1].outcome).toBe('failed');
  });

  it('refuses a cross-site request', async () => {
    const response = await POST(post({ payoutId, resolution: 'paid', reference: 'x', reason: 'Chuyển khoản xong' }, { origin: 'https://evil.example' }));
    expect(response.status).toBe(403);
    expect(authorizeAdmin).not.toHaveBeenCalled();
  });
});
