import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const getParentContext = vi.fn();

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext: () => getParentContext() }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));

import { POST } from '@/app/api/referral/claim/route';

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/referral/claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/referral/claim', () => {
  beforeEach(() => {
    rpc.mockReset();
    getParentContext.mockReset();
    getParentContext.mockResolvedValue({ familyId: 'family-a', role: 'owner', user: { id: 'user-a' } });
  });

  it.each([{}, { code: 'nope' }, { code: 'ABCD234O' }, { code: 'ABCD2345', extra: 1 }])('rejects %j without asking the database', async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('requires a signed-in parent', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await POST(request({ code: 'ABCD2345' }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('passes the normalised code and returns the programme\'s answer unchanged', async () => {
    rpc.mockResolvedValue({ data: 'claimed', error: null });
    const response = await POST(request({ code: ' abcd2345 ' }));
    expect(rpc).toHaveBeenCalledWith('claim_referral', { referral_code: 'ABCD2345' });
    await expect(response.json()).resolves.toEqual({ status: 'claimed' });
  });

  it.each(['self', 'invalid', 'expired', 'already_referred', 'disabled'])('relays %s', async (status) => {
    rpc.mockResolvedValue({ data: status, error: null });
    await expect((await POST(request({ code: 'ABCD2345' }))).json()).resolves.toEqual({ status });
  });

  it('reports a database failure as temporary so the code is kept for another try', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'down' } });
    expect((await POST(request({ code: 'ABCD2345' }))).status).toBe(503);
  });

  it('refuses a cross-site request', async () => {
    expect((await POST(request({ code: 'ABCD2345' }, { origin: 'https://evil.example' }))).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
});
