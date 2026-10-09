import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc: vi.fn() })) }));

vi.mock('@/lib/security/parent-unlock', () => ({
  requireParentUnlock: vi.fn(async () => null),
}));

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
  function post(planId: string) {
    return POST(new NextRequest('http://localhost/api/payment/create', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ planId }),
    }));
  }
  beforeEach(() => {
    rpc.mockReset(); update.mockReset(); eq.mockReset();
    createPayOSPayment.mockReset(); cancelPayOSPayment.mockReset();
    discount = 1000;
    rpc.mockImplementation(async (_name, args) => {
      const yearly = ['yearly', 'solo_yearly'].includes(args.selected_plan);
      const price = { monthly: 59000, yearly: 590000, solo_monthly: 39000, solo_yearly: 399000 }[args.selected_plan as 'monthly'];
      return { data: [{ amount: price * (1 - (yearly ? discount : 0) / 10000), discount_bps: yearly ? discount : 0 }], error: null };
    });
    const chain: Record<string, unknown> = {};
    chain.eq = (...args: unknown[]) => { eq(...args); return chain; };
    chain.then = (resolve: (value: unknown) => void) => resolve({ error: null });
    update.mockReturnValue(chain);
    createAdminSupabaseClient.mockReturnValue({ rpc, from: () => ({ update }) });
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
    rpc.mockResolvedValue({ data: null, error: { message: 'yearly_checkout_pending' } });
    const response = await post('yearly');
    expect(response.status).toBe(409);
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
    expect(update).not.toHaveBeenCalled();
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
