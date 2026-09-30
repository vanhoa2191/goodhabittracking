import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.fn();

vi.mock('@/lib/auth/parent-context', () => ({
  getParentContext: vi.fn(async () => ({ familyId: 'family-a', role: 'owner', user: { id: 'user-a' } })),
}));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));

import { DELETE, POST } from '@/app/api/parent-pin/route';
import { PARENT_UNLOCK_COOKIE } from '@/lib/security/parent-unlock';

function request(method: string, body?: unknown) {
  return new NextRequest('http://localhost/api/parent-pin', {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('parent PIN unlock cookie', () => {
  beforeEach(() => {
    rpc.mockReset();
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', 'x'.repeat(40));
  });

  it('is issued only when the PIN was verified', async () => {
    rpc.mockResolvedValue({ data: { status: 'verified' }, error: null });
    const verified = await POST(request('POST', { pin: '1234' }));
    expect(verified.status).toBe(200);
    expect(verified.cookies.get(PARENT_UNLOCK_COOKIE)?.value).toMatch(/^\d+\./);

    rpc.mockResolvedValue({ data: { status: 'invalid', attemptsRemaining: 4 }, error: null });
    const refused = await POST(request('POST', { pin: '0000' }));
    expect(refused.status).toBe(409);
    expect(refused.cookies.get(PARENT_UNLOCK_COOKIE)).toBeUndefined();
  });

  it('is cleared when the parent locks again', async () => {
    const response = await DELETE(request('DELETE'));
    expect(response.cookies.get(PARENT_UNLOCK_COOKIE)?.maxAge).toBe(0);
  });
});
