import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const insert = vi.fn();
const update = vi.fn();
const recordAdminAudit = vi.fn();
let existing: Record<string, unknown> | null = null;

vi.mock('@/lib/auth/admin-access', () => ({
  authorizeAdmin: async () => ({ authorized: true, user: { id: 'admin-1' }, role: 'finance' }),
  adminAuthorizationResponse: () => new Response('{}', { status: 403 }),
  adminJsonResponse: (body: unknown, _id: string, status = 200) => new Response(JSON.stringify(body), { status }),
}));
vi.mock('@/lib/auth/admin-audit-server', () => ({ recordAdminAudit: (...args: unknown[]) => recordAdminAudit(...args) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existing, error: null }) }) }),
      insert: async (row: unknown) => { insert(row); return { error: null }; },
      update: (row: unknown) => ({ eq: async () => { update(row); return { error: null }; } }),
    }),
  }),
}));

import { POST } from '@/app/api/admin/coupons/route';

function post(extra: Record<string, unknown> = {}) {
  return POST(new NextRequest('http://localhost/api/admin/coupons', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: 'tang30ngay', description: '', discountPercent: null, bonusDays: 30, maxRedemptions: 100, expiresAt: null, active: true, reason: 'Tặng ưu đãi theo phiếu hỗ trợ', ...extra }),
  }));
}

describe('POST /api/admin/coupons', () => {
  beforeEach(() => {
    insert.mockReset();
    update.mockReset();
    recordAdminAudit.mockReset();
    recordAdminAudit.mockResolvedValue(true);
    existing = null;
  });

  it('creates a new coupon with an upper-cased code', async () => {
    expect((await post()).status).toBe(200);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ code: 'TANG30NGAY', bonus_days: 30 }));
  });

  it('refuses to overwrite an existing coupon when asked to create', async () => {
    existing = { id: 'c1', active: false, discount_percent: null, bonus_days: 7, max_redemptions: 5, expires_at: null };
    const response = await post();
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ code: 'coupon_exists' });
    expect(insert).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(recordAdminAudit).not.toHaveBeenCalled();
  });

  it('changes an existing coupon only when the request says it is an update', async () => {
    existing = { id: 'c1', active: false, discount_percent: null, bonus_days: 7, max_redemptions: 5, expires_at: null };
    expect((await post({ update: true })).status).toBe(200);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ bonus_days: 30, active: true }));
    expect(recordAdminAudit.mock.calls[0]![1]).toMatchObject({ action: 'coupon.update' });
  });

  it('will not update a coupon that does not exist', async () => {
    expect((await post({ update: true })).status).toBe(404);
    expect(insert).not.toHaveBeenCalled();
  });
});
