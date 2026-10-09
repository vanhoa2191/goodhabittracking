import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, createPayOSPayment, cancelPayOSPayment, createAdminSupabaseClient } = vi.hoisted(() => ({
  getParentContext: vi.fn(async () => ({
    familyId: 'family-a',
    role: 'owner',
    user: { id: 'user-a' },
  })),
  createPayOSPayment: vi.fn(),
  cancelPayOSPayment: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/billing/payos-server', () => ({ createPayOSPayment, cancelPayOSPayment }));
vi.mock('@/lib/billing/payos-config', () => ({ requireSafePayOSConfig: () => ({ PAYOS_CLIENT_ID: 'client', PAYOS_API_KEY: 'key', PAYOS_CHECKSUM_KEY: 'checksum' }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc: vi.fn() })) }));

vi.mock('@/lib/security/parent-unlock', () => ({
  requireParentUnlock: vi.fn(async () => null),
}));

import { PayOSOrderNotFoundError } from '@/lib/billing/payos-errors';

import { POST } from '@/app/api/payment/create/route';

describe('POST /api/payment/create', () => {
  it.each([
    { planId: 'monthly', amount: 1 },
    { planId: 'monthly', userId: 'attacker' },
    { planId: 'monthly', returnUrl: 'https://attacker.example' },
  ])('rejects caller-controlled payment fields: %o', async (body) => {
    const response = await POST(
      new NextRequest('http://localhost/api/payment/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
    );

    expect(response.status).toBe(400);
    expect(createPayOSPayment).not.toHaveBeenCalled();
    expect(createAdminSupabaseClient).not.toHaveBeenCalled();
  });
});

describe('POST /api/payment/create atomic order reservation', () => {
  const rpc = vi.fn();
  const update = vi.fn();
  const eq = vi.fn();
  let discount = 1000;
  let pending: Record<string, unknown> | null = null;
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  function post(planId: string) {
    return POST(new NextRequest('http://localhost/api/payment/create', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planId }),
    }));
  }
  beforeEach(() => {
    rpc.mockReset(); update.mockReset(); eq.mockReset();
    createPayOSPayment.mockReset(); cancelPayOSPayment.mockReset();
    discount = 1000; pending = null;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: '00', data: { orderCode: 987, amount: 399000, amountPaid: 0, status: 'PENDING' } }))));
    rpc.mockImplementation(async (_name, args) => {
      const yearly = ['yearly', 'solo_yearly'].includes(args.selected_plan);
      const price = { monthly: 59000, yearly: 590000, solo_monthly: 39000, solo_yearly: 399000 }[args.selected_plan as 'monthly'];
      return { data: [{ amount: price * (1 - (yearly ? discount : 0) / 10000), discount_bps: yearly ? discount : 0 }], error: null };
    });
    const chain: Record<string, unknown> = {};
    chain.eq = (...args: unknown[]) => { eq(...args); return chain; };
    chain.select = () => chain;
    chain.maybeSingle = async () => ({ data: pending, error: null });
    chain.then = (resolve: (value: unknown) => void) => resolve({ error: null });
    update.mockReturnValue(chain);
    createAdminSupabaseClient.mockReturnValue({ rpc, from: () => ({ update, select: () => chain }) });
    createPayOSPayment.mockImplementation(async (input) => ({ ...input, checkoutUrl: 'https://pay.example/x', paymentLinkId: 'link' }));
    cancelPayOSPayment.mockResolvedValue(undefined);
  });
  it.each([['yearly', 531000, 590000], ['solo_yearly', 359100, 399000]])('uses the atomic DB price for %s', async (planId, amount, listPrice) => {
    const response = await post(String(planId));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('create_family_payment_order', expect.objectContaining({ target_family: 'family-a', actor_id: 'user-a', selected_plan: planId }));
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ amount, expiresAt: expect.any(String) }));
    await expect(response.json()).resolves.toMatchObject({ payment: { amount, listPrice, discountPercent: 10 } });
  });
  it.each([['monthly', 59000], ['solo_monthly', 39000], ['yearly', 590000], ['solo_yearly', 399000]])('uses list price when not eligible for %s', async (planId, amount) => {
    discount = 0;
    const body = await (await post(String(planId))).json();
    expect(body.payment.amount).toBe(amount);
    expect(body.payment.listPrice).toBeUndefined();
  });
  it('refuses a concurrent yearly checkout before opening another provider link', async () => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 590000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() + 60000).toISOString() };
    rpc.mockResolvedValue({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    const response = await post('yearly');
    expect(response.status).toBe(409);
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('reuses a valid link for the same plan without opening another provider link', async () => {
    const payment = { orderCode: 987, planId: 'yearly', amount: 531000, listPrice: 590000, discountPercent: 10, checkoutUrl: 'https://pay.example/existing' };
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 531000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() + 60000).toISOString(), checkout_payment: payment };
    rpc.mockResolvedValue({ data: [{ amount: 531000, discount_bps: 0, existing_order_code: 987 }], error: null });
    await expect((await post('yearly')).json()).resolves.toMatchObject({ success: true, payment });
    expect(createPayOSPayment).not.toHaveBeenCalled();
    expect(cancelPayOSPayment).not.toHaveBeenCalled();
  });
  it.each([['solo_yearly', 'yearly'], ['yearly', 'solo_yearly']])('switches %s to %s immediately after cancelling the valid link', async (previous, next) => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: previous, amount: 399000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() + 60000).toISOString(), checkout_payment: { planId: previous } };
    rpc.mockResolvedValueOnce({ data: [{ amount: 399000, discount_bps: 0, existing_order_code: 987 }], error: null });
    expect((await post(next)).status).toBe(200);
    expect(cancelPayOSPayment).toHaveBeenCalledWith(987, 'Customer selected a new checkout');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ planId: next }));
    expect(rpc).toHaveBeenCalledTimes(2);
  });
  it('recovers from create failure plus unknown-order cancel failure on the next checkout after grace', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-09T00:00:00Z'));
    const normalReservation = rpc.getMockImplementation()!;
    rpc.mockImplementation(async (name, args) => {
      if (pending?.status === 'PENDING') return { data: [{ amount: pending.amount, discount_bps: 0, existing_order_code: pending.order_code }], error: null };
      const result = await normalReservation(name, args);
      pending = { order_code: args.new_order_code, family_id: args.target_family, plan_id: args.selected_plan, amount: result.data[0].amount, description: `KIDHABIT ${args.new_order_code}`, status: 'PENDING', created_at: new Date().toISOString(), expires_at: args.expires_at };
      return result;
    });
    createPayOSPayment.mockRejectedValueOnce(new Error('create timed out'));
    cancelPayOSPayment.mockRejectedValue(new PayOSOrderNotFoundError());
    expect((await post('yearly')).status).toBe(503);
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    vi.setSystemTime(new Date('2026-10-09T00:16:00Z'));
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: '231', desc: 'Payment link not found' }))));
    update.mockImplementation((patch) => {
      if (patch.status === 'CANCELLED' && pending) pending.status = 'CANCELLED';
      const chain: Record<string, unknown> = {};
      chain.eq = () => chain;
      chain.then = (resolve: (value: unknown) => void) => resolve({ error: null });
      return chain;
    });
    expect((await post('yearly')).status).toBe(200);
    expect(createPayOSPayment).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
  });
  it('keeps an expired but unverified link reserved during a transient provider outage', async () => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 590000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() - 60000).toISOString() };
    rpc.mockResolvedValue({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unavailable', { status: 503 })));
    cancelPayOSPayment.mockRejectedValue(new Error('network'));
    expect((await post('solo_yearly')).status).toBe(503);
    expect(update).not.toHaveBeenCalled();
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('retries provider cancellation immediately after a failed create attempt has finished', async () => {
    pending = { order_code: 987, family_id: 'family-a', plan_id: 'yearly', amount: 590000, description: 'KIDHABIT 987', status: 'PENDING', expires_at: new Date(Date.now() + 60000).toISOString(), checkout_creation_finished_at: new Date().toISOString() };
    rpc.mockResolvedValueOnce({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    expect((await post('solo_yearly')).status).toBe(200);
    expect(cancelPayOSPayment).toHaveBeenCalledWith(987, 'Customer selected a new checkout');
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ planId: 'solo_yearly' }));
  });
  it('does not cancel another family reservation based only on shared owner attribution', async () => {
    pending = { order_code: 987, family_id: 'other-family', user_id: 'another-payer', plan_id: 'yearly', amount: 590000, status: 'PENDING' };
    rpc.mockResolvedValue({ data: [{ amount: 590000, discount_bps: 0, existing_order_code: 987 }], error: null });
    const normalAdmin = createAdminSupabaseClient.getMockImplementation()!();
    createAdminSupabaseClient.mockReturnValue({ ...normalAdmin, from: (table: string) => table === 'family_memberships'
      ? { select: () => ({ eq: () => ({ eq: () => ({ in: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) }) }
      : normalAdmin.from(table) });
    expect((await post('yearly')).status).toBe(409);
    expect(cancelPayOSPayment).not.toHaveBeenCalled();
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
  it('retries unique order-code collisions but no other database errors', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: '23505' } });
    expect((await post('monthly')).status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(2);
    rpc.mockReset(); rpc.mockResolvedValue({ data: null, error: { code: '23505' } });
    expect((await post('monthly')).status).toBe(503);
    expect(rpc).toHaveBeenCalledTimes(3);
    rpc.mockClear(); rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    expect((await post('monthly')).status).toBe(503);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('keeps an uncertain provider link pending for reconciliation', async () => {
    createPayOSPayment.mockRejectedValue(new Error('network'));
    cancelPayOSPayment.mockRejectedValue(new Error('not confirmed'));
    expect((await post('monthly')).status).toBe(503);
    expect(update).not.toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ checkout_creation_finished_at: expect.any(String) }));
  });
  it('cancels only PENDING after provider confirmation, never overwriting PAID', async () => {
    createPayOSPayment.mockRejectedValue(new Error('QR failed after link creation'));
    expect((await post('monthly')).status).toBe(503);
    expect(cancelPayOSPayment).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'CANCELLED' }));
    expect(eq).toHaveBeenCalledWith('status', 'PENDING');
  });
  it('does not sell Pro Plus', async () => {
    expect((await post('family_plus_yearly')).status).toBe(400);
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });
});
