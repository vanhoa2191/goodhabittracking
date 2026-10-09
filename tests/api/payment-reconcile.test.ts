import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { reconcileOrderOutcome, limit, closeOrder, saveState, readState, ordersBy, keysets, cursors, signals } = vi.hoisted(() => ({
  reconcileOrderOutcome: vi.fn(), limit: vi.fn(), closeOrder: vi.fn(), saveState: vi.fn(), readState: vi.fn(),
  ordersBy: vi.fn(), keysets: vi.fn(), cursors: [] as unknown[], signals: [] as AbortSignal[],
}));
vi.mock('@/lib/billing/payos-reconcile', () => ({ reconcileOrderOutcome }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: () => ({
    from: (table: string) => {
      const chain: Record<string, unknown> = {};
      let cursor: unknown = null;
      let code: unknown;
      let result: () => Promise<unknown> = () => readState();
      chain.select = () => chain;
      chain.eq = (column: string, value: unknown) => { if (column === 'order_code') code = value; return chain; };
      chain.lte = () => chain;
      chain.or = (filter: string) => { keysets(filter); cursor = Number(filter.match(/order_code\.lt\.(\d+)/)![1]); return chain; };
      chain.order = (...args: unknown[]) => { ordersBy(...args); return chain; };
      chain.limit = (count: number) => { cursors.push(cursor); result = () => limit(cursor, count); return chain; };
      chain.maybeSingle = () => chain;
      chain.abortSignal = (signal: AbortSignal) => { signals.push(signal); return chain; };
      chain.update = (patch: unknown) => { result = () => closeOrder(patch, code); return chain; };
      chain.upsert = (patch: unknown) => { result = () => saveState(patch); return chain; };
      chain.then = (resolve: (value: unknown) => void, reject: (reason: unknown) => void) => result().then(resolve, reject);
      if (table !== 'billing_reconcile_state') result = () => limit(cursor, 25);
      return chain;
    },
  }),
}));
import { POST } from '@/app/api/internal/billing/reconcile/route';

const secret = 's'.repeat(40);
const pending = (code: number) => ({ order_code: code, amount: 59000, description: `KIDHABIT ${code}`, status: 'PENDING', created_at: '2026-10-09T00:00:00Z', expires_at: '2026-10-09T00:15:00Z' });
function call(token?: string, headers: Record<string, string> = {}) {
  return POST(new NextRequest('http://localhost/api/internal/billing/reconcile', { method: 'POST', headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } }));
}
describe('POST /api/internal/billing/reconcile', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', secret);
    reconcileOrderOutcome.mockReset(); limit.mockReset(); closeOrder.mockReset(); saveState.mockReset(); readState.mockReset(); ordersBy.mockReset(); keysets.mockReset();
    cursors.length = 0; signals.length = 0;
    readState.mockResolvedValue({ data: { cursor_order_code: null, cursor_created_at: null }, error: null });
    saveState.mockResolvedValue({ error: null }); closeOrder.mockResolvedValue({ error: null });
    limit.mockImplementation(async (_cursor, count) => ({ data: count === 10 ? [pending(2), pending(1)] : [], error: null }));
  });
  afterEach(() => vi.useRealTimers());
  it.each([undefined, 'wrong', 'x'.repeat(40)])('refuses a caller without the scheduler secret (%s)', async (token) => {
    expect((await call(token)).status).toBe(403); expect(readState).not.toHaveBeenCalled();
  });
  it('refuses everything when no secret is configured', async () => {
    vi.stubEnv('CRON_SECRET', ''); expect((await call('')).status).toBe(403);
  });
  it('prioritizes recent payments and saves sweep completion', async () => {
    reconcileOrderOutcome.mockResolvedValueOnce('paid').mockResolvedValueOnce('open');
    await expect((await call(secret)).json()).resolves.toMatchObject({ checked: 2, activated: 1, closed: 0, failed: 0, complete: true, cursor: null });
    expect(ordersBy).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(ordersBy).toHaveBeenCalledWith('order_code', { ascending: false });
    expect(saveState).toHaveBeenCalledWith(expect.objectContaining({ cursor_order_code: null, cursor_created_at: null }));
    expect(reconcileOrderOutcome.mock.calls[0][1].order_code).toBe(2);
    expect(signals.every((signal) => signal instanceof AbortSignal)).toBe(true);
  });
  it('keeps going when PayOS fails for one order', async () => {
    reconcileOrderOutcome.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce('paid');
    await expect((await call(secret)).json()).resolves.toMatchObject({ checked: 2, activated: 1, failed: 1 });
  });
  it('walks the backlog newest first without rechecking the recent batch', async () => {
    const orders = Array.from({ length: 60 }, (_, i) => pending(60 - i));
    limit.mockImplementation(async (cursor, count) => ({ data: orders.filter((order) => cursor === null || order.order_code < cursor).slice(0, count), error: null }));
    reconcileOrderOutcome.mockResolvedValue('open');
    await expect((await call(secret)).json()).resolves.toMatchObject({ checked: 60, complete: true });
    expect(cursors).toEqual([null, null, 36, 11]);
    expect(reconcileOrderOutcome.mock.calls.map(([, order]) => order.order_code)).toEqual(orders.map((order) => order.order_code));
  });
  it('stops at the deadline, saves the last processed order, and resumes older ones next run', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-09T01:00:00Z'));
    const orders = Array.from({ length: 40 }, (_, i) => pending(40 - i));
    limit.mockImplementation(async (cursor, count) => ({ data: orders.filter((order) => cursor === null || order.order_code < cursor).slice(0, count), error: null }));
    let storedCursor: number | null = null;
    saveState.mockImplementation(async (patch) => { storedCursor = patch.cursor_order_code; return { error: null }; });
    readState.mockImplementation(async () => ({ data: { cursor_order_code: storedCursor, cursor_created_at: storedCursor === null ? null : '2026-10-09T00:00:00Z' }, error: null }));
    reconcileOrderOutcome.mockImplementation(async () => { vi.setSystemTime(Date.now() + 4000); return 'open'; });
    const body = await (await call(secret)).json();
    expect(body).toMatchObject({ checked: 5, complete: false, cursor: 36 });
    expect(Date.now()).toBe(Date.parse('2026-10-09T01:00:20Z'));
    reconcileOrderOutcome.mockClear(); reconcileOrderOutcome.mockResolvedValue('open'); cursors.length = 0;
    await expect((await call(secret)).json()).resolves.toMatchObject({ complete: true, cursor: null });
    expect(cursors[1]).toBe(36);
    expect(reconcileOrderOutcome.mock.calls[0][1].order_code).toBe(40); // Still checks newest before resuming.
    expect(reconcileOrderOutcome.mock.calls[10][1].order_code).toBe(30);
    expect(reconcileOrderOutcome.mock.calls.at(-1)![1].order_code).toBe(1);
  });
  it('preserves timestamp microseconds when resuming a saved cursor', async () => {
    readState.mockResolvedValue({ data: { cursor_order_code: 36, cursor_created_at: '2026-10-09T00:00:00.123456+00:00' }, error: null });
    reconcileOrderOutcome.mockResolvedValue('open');
    await call(secret);
    expect(keysets).toHaveBeenCalledWith('created_at.lt.2026-10-09T00:00:00.123456+00:00,and(created_at.eq.2026-10-09T00:00:00.123456+00:00,order_code.lt.36)');
  });
  it('closes orders proven unknown/cancelled/expired without overwriting PAID', async () => {
    reconcileOrderOutcome.mockResolvedValueOnce('closed').mockResolvedValueOnce('open');
    await expect((await call(secret)).json()).resolves.toMatchObject({ checked: 2, closed: 1 });
    expect(closeOrder).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }), 2);
  });
  it('counts failed local closes', async () => {
    reconcileOrderOutcome.mockResolvedValue('closed'); closeOrder.mockResolvedValue({ error: {} });
    await expect((await call(secret)).json()).resolves.toMatchObject({ closed: 0, failed: 2 });
  });
  it.each(['orders', 'cursor read', 'cursor save'])('reports a %s database failure as temporary', async (failure) => {
    if (failure === 'orders') limit.mockResolvedValue({ data: null, error: {} });
    if (failure === 'cursor read') readState.mockResolvedValue({ data: null, error: {} });
    if (failure === 'cursor save') saveState.mockResolvedValue({ error: {} });
    expect((await call(secret)).status).toBe(503);
  });
  it('refuses cross-site requests even with the secret', async () => {
    expect((await call(secret, { origin: 'https://evil.example' })).status).toBe(403); expect(readState).not.toHaveBeenCalled();
  });
});
