import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { reconcilePendingOrder, limit } = vi.hoisted(() => ({ reconcilePendingOrder: vi.fn(), limit: vi.fn() }));

vi.mock('@/lib/billing/payos-reconcile', () => ({ reconcilePendingOrder }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ gte: () => ({ order: () => ({ limit }) }) }) }) }),
  }),
}));

import { POST } from '@/app/api/internal/billing/reconcile/route';

const secret = 's'.repeat(40);
function call(token?: string, headers: Record<string, string> = {}) {
  return POST(new NextRequest('http://localhost/api/internal/billing/reconcile', {
    method: 'POST',
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
  }));
}

describe('POST /api/internal/billing/reconcile', () => {
  beforeEach(() => {
    reconcilePendingOrder.mockReset();
    limit.mockReset();
    vi.stubEnv('CRON_SECRET', secret);
    limit.mockResolvedValue({ data: [{ order_code: 1, amount: 49000, description: 'KIDHABIT 1', status: 'PENDING' }, { order_code: 2, amount: 29000, description: 'KIDHABIT 2', status: 'PENDING' }], error: null });
  });

  it.each([undefined, 'wrong', 'x'.repeat(40)])('refuses a caller without the scheduler secret (%s)', async (token) => {
    expect((await call(token)).status).toBe(403);
    expect(limit).not.toHaveBeenCalled();
  });

  it('refuses everything when no secret is configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await call('')).status).toBe(403);
  });

  it('checks each pending order and counts what it activated', async () => {
    reconcilePendingOrder.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const response = await call(secret);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ checked: 2, activated: 1, failed: 0 });
    expect(reconcilePendingOrder).toHaveBeenCalledTimes(2);
  });

  it('keeps going when PayOS fails for one order', async () => {
    reconcilePendingOrder.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(true);
    await expect((await call(secret)).json()).resolves.toMatchObject({ checked: 2, activated: 1, failed: 1 });
  });

  it('reports a database failure as temporary', async () => {
    limit.mockResolvedValue({ data: null, error: { message: 'down' } });
    expect((await call(secret)).status).toBe(503);
  });

  it('refuses a cross-site request even with the secret', async () => {
    expect((await call(secret, { origin: 'https://evil.example' })).status).toBe(403);
    expect(limit).not.toHaveBeenCalled();
  });
});
