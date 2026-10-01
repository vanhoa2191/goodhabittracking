import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { maybeSingle, eqFamily, eqOrder, from, getParentContext } = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eqFamily = vi.fn(() => ({ maybeSingle }));
  const eqOrder = vi.fn(() => ({ eq: eqFamily }));
  const select = vi.fn(() => ({ eq: eqOrder }));
  const from = vi.fn(() => ({ select }));
  return { maybeSingle, eqFamily, eqOrder, from, getParentContext: vi.fn() };
});

const { reconcilePendingOrder } = vi.hoisted(() => ({ reconcilePendingOrder: vi.fn() }));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/billing/payos-reconcile', () => ({ reconcilePendingOrder }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc: vi.fn() }) }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from })),
}));

import { POST } from '@/app/api/payment/status/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/payment/status', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/payment/status', () => {
  beforeEach(() => {
    getParentContext.mockResolvedValue({ familyId: 'family-a', user: { id: 'user-a' }, role: 'owner' });
    reconcilePendingOrder.mockReset();
    reconcilePendingOrder.mockResolvedValue(false);
    maybeSingle.mockResolvedValue({ data: { status: 'PENDING', amount: 49000, description: 'KIDHABIT 123456' }, error: null });
  });

  it('rejects the removed payment simulation contract', async () => {
    const response = await POST(request({ orderCode: 123456, simulateSuccess: true }));
    expect(response.status).toBe(400);
  });

  it('requires an authenticated parent', async () => {
    getParentContext.mockResolvedValue(null);
    const response = await POST(request({ orderCode: 123456 }));
    expect(response.status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('scopes status reads to the authenticated family', async () => {
    const response = await POST(request({ orderCode: 123456 }));
    expect(response.status).toBe(200);
    expect(eqOrder).toHaveBeenCalledWith('order_code', 123456);
    expect(eqFamily).toHaveBeenCalledWith('family_id', 'family-a');
  });

  it('asks PayOS about a pending order and reports it paid once PayOS says so', async () => {
    reconcilePendingOrder.mockResolvedValue(true);
    const response = await POST(request({ orderCode: 123456 }));
    await expect(response.json()).resolves.toEqual({ success: true, paid: true, status: 'PAID' });
    expect(reconcilePendingOrder).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ order_code: 123456, amount: 49000, description: 'KIDHABIT 123456', status: 'PENDING' }));
  });

  it('keeps answering pending when PayOS has no payment yet or cannot be reached', async () => {
    await expect((await POST(request({ orderCode: 123456 }))).json()).resolves.toMatchObject({ success: true, paid: false, status: 'PENDING' });
    reconcilePendingOrder.mockRejectedValue(new Error('network'));
    const response = await POST(request({ orderCode: 123456 }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ paid: false, status: 'PENDING' });
  });

  it('does not ask PayOS about an order that is already settled', async () => {
    maybeSingle.mockResolvedValue({ data: { status: 'PAID', amount: 49000, description: 'KIDHABIT 123456' }, error: null });
    await expect((await POST(request({ orderCode: 123456 }))).json()).resolves.toMatchObject({ paid: true });
    expect(reconcilePendingOrder).not.toHaveBeenCalled();
  });
});
