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

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
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
    maybeSingle.mockResolvedValue({ data: { status: 'PENDING' }, error: null });
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
});
