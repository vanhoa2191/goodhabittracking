import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { verifyPayOSWebhook, rpc } = vi.hoisted(() => ({
  verifyPayOSWebhook: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/billing/payos-server', () => ({ verifyPayOSWebhook }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminSupabaseClient: vi.fn(() => ({ rpc })),
}));

import { POST } from '@/app/api/payment/webhook/route';

const payload = {
  code: '00',
  desc: 'success',
  success: true,
  signature: 'deadbeef',
  data: {
    orderCode: 123,
    amount: 49000,
    description: 'KIDHABIT 123',
    reference: 'provider-ref-1',
    code: '00',
    desc: 'success',
  },
};

function request() {
  return new NextRequest('http://localhost/api/payment/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function verificationRequest() {
  const verificationPayload = {
    code: payload.code,
    desc: payload.desc,
    signature: payload.signature,
    data: payload.data,
  };
  return new NextRequest('http://localhost/api/payment/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(verificationPayload),
  });
}

describe('POST /api/payment/webhook', () => {
  beforeEach(() => {
    verifyPayOSWebhook.mockReturnValue(true);
    rpc.mockResolvedValue({ data: 'activated', error: null });
  });

  it('rejects an invalid signature before database access', async () => {
    verifyPayOSWebhook.mockReturnValue(false);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('acknowledges a signed PayOS verification probe without database access', async () => {
    const response = await POST(verificationRequest());
    expect(response.status).toBe(200);
    expect(verifyPayOSWebhook).toHaveBeenCalledOnce();
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each(['activated', 'duplicate'])('acknowledges the idempotent %s result', async (result) => {
    rpc.mockResolvedValue({ data: result, error: null });
    const response = await POST(request());
    expect(response.status).toBe(200);
  });

  it('rejects amount or description mismatches returned by the atomic RPC', async () => {
    rpc.mockResolvedValue({ data: 'amount_mismatch', error: null });
    const response = await POST(request());
    expect(response.status).toBe(409);
  });
});
