import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc, cookieGet } = vi.hoisted(() => ({ rpc: vi.fn(), cookieGet: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: cookieGet })) }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));
vi.mock('@/lib/pairing/crypto', () => ({ CHILD_SESSION_COOKIE: 'child', sha256Hex: vi.fn(async () => 'digest') }));
import { GET, POST } from '@/app/api/child/session/route';

describe('child session read and explicit activity update', () => {
  beforeEach(() => {
    cookieGet.mockReturnValue({ value: 'token' });
    rpc.mockImplementation(async (name: string) => ({ data: name === 'touch_child_session' ? true
      : name === 'get_child_family_pause_state' ? { pausedAt: null, pausePeriods: [] } : { child: { id: 'child-a' } }, error: null }));
  });
  it('GET only invokes read RPCs', async () => {
    expect((await GET()).status).toBe(200);
    expect(rpc.mock.calls.map(([name]) => name)).toEqual(['get_child_session', 'get_child_family_pause_state']);
  });
  it('POST records activity with only the cookie digest', async () => {
    expect((await POST(new NextRequest('http://localhost/api/child/session', { method: 'POST' }))).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('touch_child_session', { session_token_hash: 'digest' });
  });
  it('cross-site POST stops before reading or writing', async () => {
    const response = await POST(new NextRequest('http://localhost/api/child/session', { method: 'POST', headers: { origin: 'https://evil.example' } }));
    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('does not report success after activity update fails', async () => {
    rpc.mockImplementation(async (name: string) => ({ data: name === 'touch_child_session' ? null : {}, error: name === 'touch_child_session' ? { code: 'down' } : null }));
    expect((await POST(new NextRequest('http://localhost/api/child/session', { method: 'POST' }))).status).toBe(503);
  });
});
