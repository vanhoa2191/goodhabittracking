import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, createPayOSPayment, createAdminSupabaseClient } = vi.hoisted(() => ({
  getParentContext: vi.fn(async () => ({
    familyId: 'family-a',
    role: 'owner',
    user: { id: 'user-a' },
  })),
  createPayOSPayment: vi.fn(),
  createAdminSupabaseClient: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/billing/payos-server', () => ({ createPayOSPayment }));
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

describe('POST /api/payment/create referral discount', () => {
  const insert = vi.fn();
  const rpc = vi.fn();

  function post(planId: string) {
    return POST(new NextRequest('http://localhost/api/payment/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ planId }),
    }));
  }

  beforeEach(() => {
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
    rpc.mockReset();
    createPayOSPayment.mockReset();
    createPayOSPayment.mockImplementation(async (input: { planId: string; orderCode: number; amount?: number }) => ({
      orderCode: input.orderCode, amount: input.amount, description: `KIDHABIT ${input.orderCode}`, accountNumber: '1', accountName: 'A', bankBin: '970', bankName: 'B',
      qrCode: 'qr', vietQrUrl: 'data:', checkoutUrl: 'https://pay.example/x', planId: input.planId, paymentLinkId: 'link',
    }));
    createAdminSupabaseClient.mockReturnValue({
      rpc,
      from: () => ({ insert, update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }) }),
    });
  });

  it('charges 10 percent less for the first yearly plan of a referred family and says so', async () => {
    rpc.mockResolvedValue({ data: 1000, error: null });
    const response = await post('yearly');
    const body = await response.json();
    expect(rpc).toHaveBeenCalledWith('referral_discount_bps', { target_family: 'family-a' });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ plan_id: 'yearly', amount: 359100 }));
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ planId: 'yearly', amount: 359100 }));
    expect(body.payment).toMatchObject({ amount: 359100, listPrice: 399000, discountPercent: 10 });
  });

  it('charges the list price when the family was not referred or has paid before', async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    const body = await (await post('yearly')).json();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ amount: 399000 }));
    expect(body.payment.listPrice).toBeUndefined();
    expect(body.payment.discountPercent).toBeUndefined();
  });

  it.each(['monthly', 'solo_monthly'])('never discounts the %s plan and does not even ask', async (planId) => {
    rpc.mockResolvedValue({ data: 1000, error: null });
    await post(planId);
    expect(rpc).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ plan_id: planId }));
    expect(insert.mock.calls[0]![0].amount).toBeGreaterThan(0);
  });

  it('refuses to create an order at the list price when the discount cannot be read', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
    const response = await post('yearly');
    expect(response.status).toBe(503);
    expect(insert).not.toHaveBeenCalled();
    expect(createPayOSPayment).not.toHaveBeenCalled();
  });

  it('draws a new order code when two checkouts collide, and gives up after three tries', async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    insert
      .mockResolvedValueOnce({ error: { code: '23505' } })
      .mockResolvedValueOnce({ error: null });
    // Two draws in the same millisecond can land on the same two random digits (one time in a hundred), which
    // would make this assertion flaky; a clock that moves on every read keeps the two codes apart.
    let tick = 1_790_000_000_000;
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => tick++);
    const response = await post('monthly');
    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledTimes(2);
    const codes = insert.mock.calls.map(([row]) => row.order_code);
    expect(new Set(codes).size).toBe(2);
    expect(createPayOSPayment).toHaveBeenCalledWith(expect.objectContaining({ orderCode: codes[1] }));

    insert.mockReset();
    insert.mockResolvedValue({ error: { code: '23505' } });
    expect((await post('monthly')).status).toBe(503);
    expect(insert).toHaveBeenCalledTimes(3);
    clock.mockRestore();
  });

  it('does not retry an insert that failed for any other reason', async () => {
    rpc.mockResolvedValue({ data: 0, error: null });
    insert.mockResolvedValue({ error: { code: '42501' } });
    expect((await post('monthly')).status).toBe(503);
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
