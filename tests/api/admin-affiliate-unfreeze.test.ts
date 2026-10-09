import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const recordAdminAudit = vi.fn();
const authorizeAdmin = vi.fn();
vi.mock('@/lib/auth/admin-access', () => ({
  authorizeAdmin: (options: unknown) => authorizeAdmin(options),
  adminAuthorizationResponse: () => new Response('{}', { status: 403 }),
  adminJsonResponse: (body: unknown, _id: string, status = 200) => new Response(JSON.stringify(body), { status }),
}));
vi.mock('@/lib/auth/admin-audit-server', () => ({ recordAdminAudit: (...args: unknown[]) => recordAdminAudit(...args) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc }) }));
import { POST } from '@/app/api/admin/affiliate/commissions/route';
function post(body: unknown, origin?: string) {
  return new NextRequest('http://localhost/api/admin/affiliate/commissions', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) }, body: JSON.stringify(body),
  });
}
const input = { orderCode: 123456, reason: 'Dispute resolved without refund' };
describe('admin commission unfreeze', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authorizeAdmin.mockResolvedValue({ authorized: true, user: { id: 'admin-1' }, role: 'finance' });
    recordAdminAudit.mockResolvedValue(true);
    rpc.mockResolvedValue({ data: 'unfrozen', error: null });
  });
  it('requires finance/super-admin MFA and passes the verified actor and audit context to SQL', async () => {
    expect((await POST(post(input))).status).toBe(200);
    expect(authorizeAdmin).toHaveBeenCalledWith({ roles: ['finance', 'super_admin'], requireAal2: true });
    expect(rpc).toHaveBeenCalledWith('admin_unfreeze_referral_commission', {
      target_order_code: 123456, admin_user: 'admin-1', reason: input.reason, audit_correlation_id: expect.any(String),
    });
    expect(recordAdminAudit.mock.calls[0]?.[1]).toMatchObject({ action: 'affiliate.commission.unfreeze', targetId: '123456', outcome: 'attempted' });
    expect(recordAdminAudit.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[0]!);
    // SQL writes the succeeded event atomically with releasing the freeze.
    expect(recordAdminAudit).toHaveBeenCalledTimes(1);
  });
  it('rejects cross-site and unauthorised requests without mutation', async () => {
    expect((await POST(post(input, 'https://evil.example'))).status).toBe(403);
    expect(authorizeAdmin).not.toHaveBeenCalled();
    authorizeAdmin.mockResolvedValue({ authorized: false });
    expect((await POST(post(input))).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([{ ...input, orderCode: -1 }, { ...input, orderCode: 1.5 }, { ...input, orderCode: Number.MAX_SAFE_INTEGER + 1 }, { ...input, reason: 'no' }, { ...input, amount: 1 }])('rejects invalid input %j', async body => {
    expect((await POST(post(body))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('fails closed when the attempted audit cannot be stored', async () => {
    recordAdminAudit.mockResolvedValue(false);
    expect((await POST(post(input))).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each(['billing_case_open', 'refund_confirmed', 'not_frozen', 'no_commission', 'not_authorized', 'invalid_status'])('reports a refused SQL transition: %s', async status => {
    rpc.mockResolvedValue({ data: status, error: null });
    const response = await POST(post(input));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ status });
    expect(recordAdminAudit.mock.calls.at(-1)?.[1]).toMatchObject({ outcome: 'failed' });
  });
  it('reports database/audit failures as unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '23514' } });
    expect((await POST(post(input))).status).toBe(503);
  });
});
