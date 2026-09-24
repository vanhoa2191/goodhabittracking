import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieGet, getUser, rpc } = vi.hoisted(() => ({ cookieGet: vi.fn(), getUser: vi.fn(), rpc: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: cookieGet })) }));
vi.mock('@/lib/pairing/crypto', () => ({
  CHILD_SESSION_COOKIE: 'kidhabit_child_session',
  sha256Hex: vi.fn(async () => 'hashed-child-session'),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getUser }, rpc })),
}));

import { GET, POST } from '@/app/api/mascot/letter/route';

const childId = '00000000-0000-4000-8000-000000000011';

function getRequest() {
  return new NextRequest(`http://localhost/api/mascot/letter?childId=${childId}&date=2026-09-23`);
}

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/mascot/letter', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('daily mascot letter API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-23T09:00:00.000Z'));
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    rpc.mockResolvedValue({ data: { status: 'ready', template_key: 'leo_1', read_at: null }, error: null });
  });

  afterEach(() => vi.useRealTimers());

  it('opens a letter only for the child named by the paired session', async () => {
    rpc.mockResolvedValue({ data: { status: 'ready', template_key: 'leo_1', read_at: null, newly_read: false }, error: null });
    const response = await GET(getRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ templateKey: 'leo_1', readAt: null, newlyRead: false });
    expect(rpc).toHaveBeenCalledWith('open_daily_mascot_letter', {
      target_child_id: childId,
      target_local_date: '2026-09-23',
      mark_read: false,
      session_token_hash: 'hashed-child-session',
    });
  });

  it('marks a signed-in parent letter read without a child token', async () => {
    cookieGet.mockReturnValue(undefined);
    getUser.mockResolvedValue({ data: { user: { id: 'parent-id' } }, error: null });
    const response = await POST(postRequest({ childId, date: '2026-09-23' }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('open_daily_mascot_letter', {
      target_child_id: childId,
      target_local_date: '2026-09-23',
      mark_read: true,
      session_token_hash: null,
    });
  });

  it('uses the paired child session when parent and child cookies coexist', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'other-parent-id' } }, error: null });
    const response = await POST(postRequest({ childId, date: '2026-09-23' }));
    expect(response.status).toBe(200);
    expect(getUser).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith('open_daily_mascot_letter', {
      target_child_id: childId,
      target_local_date: '2026-09-23',
      mark_read: true,
      session_token_hash: 'hashed-child-session',
    });
  });

  it.each([true, false])('passes through newlyRead=%s from a successful POST without exposing IDs', async (newlyRead) => {
    rpc.mockResolvedValue({
      data: {
        status: 'ready', template_key: 'leo_1', read_at: '2026-09-23T09:00:00Z',
        newly_read: newlyRead, child_id: childId, family_id: '00000000-0000-4000-8000-000000000099',
      },
      error: null,
    });

    const response = await POST(postRequest({ childId, date: '2026-09-23' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      templateKey: 'leo_1', readAt: '2026-09-23T09:00:00Z', newlyRead,
    });
  });

  it('defaults newlyRead to false when an older RPC omits newly_read', async () => {
    const response = await POST(postRequest({ childId, date: '2026-09-23' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ templateKey: 'leo_1', readAt: null, newlyRead: false });
  });

  it('rejects a missing session, bad child ID, and dates outside the local-day window', async () => {
    cookieGet.mockReturnValue(undefined);
    expect((await GET(getRequest())).status).toBe(401);
    expect((await POST(postRequest({ childId: 'invalid', date: '2026-09-23' }))).status).toBe(400);
    expect((await POST(postRequest({ childId, date: '2026-08-01' }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects a revoked child session without exposing another child letter', async () => {
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    const response = await GET(getRequest());
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('kidhabit_child_session=;');
  });
});
