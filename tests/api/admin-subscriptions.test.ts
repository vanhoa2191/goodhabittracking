import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const recordAdminAudit = vi.fn();
let currentRow: Record<string, unknown> | null = null;

const chain = (result: () => unknown) => {
  const node: Record<string, unknown> = {};
  for (const name of ['select', 'eq']) node[name] = () => node;
  node.maybeSingle = async () => ({ data: result(), error: null });
  return node;
};

vi.mock('@/lib/auth/admin-access', () => ({
  authorizeAdmin: async () => ({ authorized: true, user: { id: 'admin-1' }, role: 'finance' }),
  adminAuthorizationResponse: () => new Response('{}', { status: 403 }),
  adminJsonResponse: (body: unknown, _id: string, status = 200) => new Response(JSON.stringify(body), { status }),
}));
vi.mock('@/lib/auth/admin-audit-server', () => ({ recordAdminAudit: (...args: unknown[]) => recordAdminAudit(...args) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    rpc,
    from: (table: string) => (table === 'family_memberships'
      ? chain(() => ({ user_id: 'owner-1' }))
      : chain(() => currentRow)),
  }),
}));

import { PATCH } from '@/app/api/admin/subscriptions/route';

const familyId = '11111111-1111-4111-8111-111111111111';
function patch(body: Record<string, unknown>) {
  return PATCH(new NextRequest('http://localhost/api/admin/subscriptions', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ familyId, plan: 'monthly', status: 'active', endsAt: '2027-01-31T23:59:59.000Z', expectedUpdatedAt: null, reason: 'Cập nhật theo phiếu hỗ trợ', ...body }),
  }));
}

describe('PATCH /api/admin/subscriptions', () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: 'updated', error: null });
    recordAdminAudit.mockReset();
    recordAdminAudit.mockResolvedValue(true);
    currentRow = null;
  });

  it('saves when the subscription is unchanged since it was loaded', async () => {
    currentRow = { plan: 'free', status: 'inactive', subscription_ends_at: null, trial_ends_at: null, trial_consumed_at: null, updated_at: '2026-10-01 09:41:43.875+00' };
    const response = await patch({ expectedUpdatedAt: '2026-10-01 09:41:43.875+00' });
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('admin_update_family_subscription', expect.objectContaining({ next_plan: 'monthly', next_status: 'active', expected_updated_at: currentRow.updated_at }));
  });

  it('refuses a save made on a stale page, so a payment made meanwhile is not overwritten', async () => {
    currentRow = { plan: 'monthly', status: 'active', subscription_ends_at: '2027-03-01T00:00:00Z', trial_ends_at: null, trial_consumed_at: null, updated_at: '2026-10-01 10:00:00+00' };
    const response = await patch({ expectedUpdatedAt: '2026-10-01 09:41:43.875+00' });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: 'subscription_changed' });
    expect(rpc).not.toHaveBeenCalled();
    expect(recordAdminAudit).not.toHaveBeenCalled();
  });

  it('expects no row to exist when the page loaded none', async () => {
    currentRow = { plan: 'monthly', status: 'active', subscription_ends_at: null, trial_ends_at: null, trial_consumed_at: null, updated_at: '2026-10-01 10:00:00+00' };
    expect((await patch({ expectedUpdatedAt: null })).status).toBe(409);
    currentRow = null;
    expect((await patch({ expectedUpdatedAt: null })).status).toBe(200);
  });

  it('detects a payment committed between the initial read and the atomic write', async () => {
    currentRow = { plan: 'free', updated_at: '2026-10-01T00:00:00Z' };
    rpc.mockResolvedValue({ data: 'subscription_changed', error: null });
    const response = await patch({ expectedUpdatedAt: currentRow.updated_at });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: 'subscription_changed' });
    expect(recordAdminAudit).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ outcome: 'failed' }));
  });

  it('delegates trial consumption to the locked database row', async () => {
    await patch({ plan: 'trial', endsAt: '2026-10-08T23:59:59.000Z' });
    expect(rpc).toHaveBeenCalledWith('admin_update_family_subscription', expect.objectContaining({ next_plan: 'trial', expected_updated_at: null }));
    expect(rpc.mock.calls[0]![1]).not.toHaveProperty('trial_consumed_at');
  });
});
