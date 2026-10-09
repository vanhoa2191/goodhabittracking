import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { reconcileOrderOutcome, limit, closeOrder, order } = vi.hoisted(() => ({ reconcileOrderOutcome: vi.fn(), limit: vi.fn(), closeOrder: vi.fn(), order: vi.fn() }));

vi.mock('@/lib/billing/payos-reconcile', () => ({ reconcileOrderOutcome }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ lte: () => ({ gt: (_column: string, cursor: number) => { cursorRead(cursor); return { order: (...args: unknown[]) => { order(...args); return { limit }; } }; } }) }) }),
      update: (patch: unknown) => ({ eq: (_column: string, code: unknown) => ({ eq: async () => closeOrder(patch, code) }) }),
    }),
  }),
}));

import { POST } from '@/app/api/internal/billing/reconcile/route';

const cursorRead = vi.fn();

const secret = 's'.repeat(40);
function call(token?: string, headers: Record<string, string> = {}) {
  return POST(new NextRequest('http://localhost/api/internal/billing/reconcile', {
    method: 'POST',
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
  }));
}

describe('POST /api/internal/billing/reconcile', () => {
  beforeEach(() => {
    reconcileOrderOutcome.mockReset();
    limit.mockReset();
    closeOrder.mockReset();
    order.mockReset();
    cursorRead.mockReset();
    closeOrder.mockResolvedValue({ error: null });
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
    reconcileOrderOutcome.mockResolvedValueOnce('paid').mockResolvedValueOnce('open');
    const response = await call(secret);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ checked: 2, activated: 1, closed: 0, failed: 0 });
    expect(reconcileOrderOutcome).toHaveBeenCalledTimes(2);
    expect(closeOrder).not.toHaveBeenCalled();
  });

  it('keeps going when PayOS fails for one order', async () => {
    reconcileOrderOutcome.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce('paid');
    await expect((await call(secret)).json()).resolves.toMatchObject({ checked: 2, activated: 1, failed: 1 });
  });

  it('walks pending orders oldest first with a stable cursor', async () => {
    reconcileOrderOutcome.mockResolvedValue('open');
    await call(secret);
    expect(order).toHaveBeenCalledWith('order_code', { ascending: true });
  });

  it('walks all pages even when 25 pending links remain open', async () => {
    const pending = Array.from({ length: 60 }, (_, index) => ({ order_code: index + 1, amount: 59000, description: `KIDHABIT ${index + 1}`, status: 'PENDING' }));
    limit.mockResolvedValueOnce({ data: pending.slice(0, 25), error: null })
      .mockResolvedValueOnce({ data: pending.slice(25, 50), error: null })
      .mockResolvedValueOnce({ data: pending.slice(50), error: null });
    reconcileOrderOutcome.mockResolvedValue('open');
    await expect((await call(secret)).json()).resolves.toMatchObject({ checked: 60 });
    expect(cursorRead.mock.calls.map(([cursor]) => cursor)).toEqual([0, 25, 50]);
    expect(reconcileOrderOutcome).toHaveBeenLastCalledWith(expect.anything(), pending[59]);
  });

  it('closes an order PayOS reports as cancelled or expired, so it stops being checked', async () => {
    reconcileOrderOutcome.mockResolvedValueOnce('closed').mockResolvedValueOnce('open');
    await expect((await call(secret)).json()).resolves.toMatchObject({ checked: 2, activated: 0, closed: 1, failed: 0 });
    expect(closeOrder).toHaveBeenCalledTimes(1);
    expect(closeOrder).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }), 1);
  });

  it('counts a failed close as a failure rather than hiding it', async () => {
    reconcileOrderOutcome.mockResolvedValue('closed');
    closeOrder.mockResolvedValue({ error: { message: 'down' } });
    await expect((await call(secret)).json()).resolves.toMatchObject({ closed: 0, failed: 2 });
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
