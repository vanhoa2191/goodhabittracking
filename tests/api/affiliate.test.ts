import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();
const adminRpc = vi.fn();
const getParentContext = vi.fn();

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext: () => getParentContext() }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: () => ({ rpc: adminRpc }) }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));

import { GET, POST } from '@/app/api/affiliate/route';
import { issueParentUnlock, PARENT_UNLOCK_COOKIE } from '@/lib/security/parent-unlock';
import { NextResponse } from 'next/server';

const parent = { familyId: 'family-a', role: 'owner', user: { id: 'user-a' } };

function post(body: unknown, cookie?: string) {
  return new NextRequest('http://localhost/api/affiliate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie ? { cookie: `${PARENT_UNLOCK_COOKIE}=${cookie}` } : {}) },
    body: JSON.stringify(body),
  });
}

async function unlockCookie(): Promise<string> {
  const response = NextResponse.json({});
  await issueParentUnlock(response, parent);
  return response.cookies.get(PARENT_UNLOCK_COOKIE)!.value;
}

const payout = { action: 'savePayout', bank: 'Vietcombank', accountNumber: '0123456789', accountName: 'Nguyen Van A' };

describe('/api/affiliate', () => {
  beforeEach(() => {
    rpc.mockReset();
    adminRpc.mockReset();
    getParentContext.mockReset();
    getParentContext.mockResolvedValue(parent);
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', 'x'.repeat(40));
  });

  it('requires a signed-in parent to read or change anything', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await POST(post({ action: 'enroll', acceptTerms: true }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('returns the overview without caching it', async () => {
    rpc.mockResolvedValue({ data: { enrolled: false, enabled: true }, error: null });
    const response = await GET();
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ enrolled: false });
  });

  it('enrols only when the terms were accepted', async () => {
    expect((await POST(post({ action: 'enroll', acceptTerms: false }))).status).toBe(400);
    expect((await POST(post({ action: 'enroll' }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: 'ABCD2345', error: null });
    const response = await POST(post({ action: 'enroll', acceptTerms: true }));
    expect(rpc).toHaveBeenCalledWith('affiliate_enroll', { accept_terms: true });
    await expect(response.json()).resolves.toEqual({ status: 'enrolled', code: 'ABCD2345' });
  });

  it.each([
    ['saving payout details', payout],
    ['requesting a payout', { action: 'requestPayout' }],
  ])('needs the parent PIN for %s when the family has one', async (_label, body) => {
    rpc.mockImplementation(async (name: string) => (name === 'get_parent_pin_status' ? { data: { configured: true }, error: null } : { data: { status: 'saved' }, error: null }));
    const response = await POST(post(body));
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ code: 'parent_pin_required' });
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(['get_parent_pin_status']);
    expect(adminRpc).not.toHaveBeenCalled();
  });

  it('saves payout details once the PIN was entered, validating them first', async () => {
    const cookie = await unlockCookie();
    rpc.mockImplementation(async (name: string) => (name === 'get_parent_pin_status' ? { data: { configured: true }, error: null } : { data: { status: 'saved' }, error: null }));
    adminRpc.mockResolvedValue({ data: { status: 'saved' }, error: null });
    expect((await POST(post({ ...payout, accountNumber: '12' }, cookie))).status).toBe(400);
    expect((await POST(post({ ...payout, extra: true }, cookie))).status).toBe(400);
    const response = await POST(post(payout, cookie));
    expect(response.status).toBe(200);
    expect(adminRpc).toHaveBeenCalledWith('affiliate_save_payout_details', { target_user: 'user-a', bank: 'Vietcombank', account_number: '0123456789', account_name: 'Nguyen Van A' });
    expect(rpc.mock.calls.map(([name]) => name)).not.toContain('affiliate_save_payout_details');
  });

  it.each([
    ['requested', 200],
    ['below_minimum', 409],
    ['missing_details', 409],
    ['suspended', 409],
    ['details_recent', 409],
  ])('answers a payout request that the programme reports as %s with %i', async (status, expected) => {
    const cookie = await unlockCookie();
    rpc.mockImplementation(async () => ({ data: { configured: false }, error: null }));
    adminRpc.mockResolvedValue({ data: { status, amount: 239400 }, error: null });
    const response = await POST(post({ action: 'requestPayout' }, cookie));
    expect(adminRpc).toHaveBeenCalledWith('request_affiliate_payout', { target_user: 'user-a' });
    expect(response.status).toBe(expected);
    await expect(response.json()).resolves.toMatchObject({ status });
  });

  it('refuses a cross-site request', async () => {
    const request = new NextRequest('http://localhost/api/affiliate', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ action: 'requestPayout' }),
    });
    expect((await POST(request)).status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
});
