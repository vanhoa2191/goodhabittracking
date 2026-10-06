import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const recordAdminAudit = vi.fn();
let claims: unknown[] = [];
let claim: { revoked_at: string | null } | null = { revoked_at: null };

vi.mock('@/lib/auth/admin-access', () => ({
  authorizeAdmin: async () => ({ authorized: true, user: { id: 'admin-1' }, role: 'finance' }),
  adminAuthorizationResponse: () => new Response('{}', { status: 403 }),
  adminJsonResponse: (body: unknown, _id: string, status = 200) => new Response(JSON.stringify(body), { status }),
}));
vi.mock('@/lib/auth/admin-audit-server', () => ({ recordAdminAudit: (...args: unknown[]) => recordAdminAudit(...args) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    rpc,
    from: () => ({
      select: () => ({
        eq: () => ({
          order: async () => ({ data: claims, error: null }),
          eq: () => ({ maybeSingle: async () => ({ data: claim, error: null }) }),
        }),
      }),
    }),
  }),
}));

import { GET, POST } from '@/app/api/admin/launch-offer/route';

const post = (body: unknown) => POST(new NextRequest('http://localhost/api/admin/launch-offer', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
}));

describe('/api/admin/launch-offer', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
    recordAdminAudit.mockReset();
    recordAdminAudit.mockResolvedValue(true);
    claims = [];
    claim = { revoked_at: null };
  });

  it('lists claims with a shortened family id and nothing else about the family', async () => {
    claims = [{ order_code: 123, family_id: '22222222-2222-4222-8222-222222222222', claimed_at: '2026-10-08T00:00:00Z', revoked_at: null }];
    const body = await (await GET()).json();
    expect(body.claims).toEqual([{ orderCode: 123, familyShort: '22222222', claimedAt: '2026-10-08T00:00:00Z', revoked: false }]);
  });

  it('revokes a claim through the database function and writes the audit trail', async () => {
    const response = await post({ orderCode: 123, reason: 'Hoàn tiền đơn này' });
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('admin_revoke_launch_offer_claim', { target_order_code: 123, reason: 'Hoàn tiền đơn này' });
    expect(recordAdminAudit.mock.calls.map(([, input]) => input.outcome)).toEqual(['attempted', 'succeeded']);
    expect(recordAdminAudit.mock.calls[0]![1]).toMatchObject({ action: 'launch_offer.revoke', targetId: '123' });
  });

  it('answers 404 and changes nothing when the order has no claim', async () => {
    claim = null;
    expect((await post({ orderCode: 9, reason: 'ok' })).status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
    expect(recordAdminAudit).not.toHaveBeenCalled();
  });

  it('answers 409 and changes nothing when the claim is already revoked', async () => {
    claim = { revoked_at: '2026-10-08T00:00:00Z' };
    const response = await post({ orderCode: 9, reason: 'ok' });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: 'already_revoked' });
    expect(rpc).not.toHaveBeenCalled();
    expect(recordAdminAudit).not.toHaveBeenCalled();
  });

  it.each([{ orderCode: 'x', reason: 'a' }, { orderCode: 1, reason: '' }, { orderCode: 1, reason: 'a'.repeat(201) }, { orderCode: 1, reason: 'ok', extra: 1 }])('rejects %o', async (body) => {
    expect((await post(body)).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not revoke when the attempt cannot be audited', async () => {
    recordAdminAudit.mockResolvedValue(false);
    expect((await post({ orderCode: 1, reason: 'ok' })).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('records a failure when the database function fails', async () => {
    rpc.mockResolvedValue({ error: { message: 'x' } });
    expect((await post({ orderCode: 1, reason: 'ok' })).status).toBe(503);
    expect(recordAdminAudit.mock.calls.at(-1)![1].outcome).toBe('failed');
  });
});
