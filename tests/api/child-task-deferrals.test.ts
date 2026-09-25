import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieGet, rpc } = vi.hoisted(() => ({ cookieGet: vi.fn(), rpc: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: cookieGet })) }));
vi.mock('@/lib/pairing/crypto', () => ({
  CHILD_SESSION_COOKIE: 'kidhabit_child_session',
  sha256Hex: vi.fn(async () => 'hashed-child-session'),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));

import { GET, POST } from '@/app/api/child/task-deferrals/route';

const activityId = '11111111-1111-4111-8111-111111111111';
const deferral = {
  family_id: '22222222-2222-4222-8222-222222222222',
  child_id: '33333333-3333-4333-8333-333333333333',
  activity_id: activityId,
  local_date: '2026-09-25',
  deferred_at: '2026-09-25T12:00:00.000Z',
};

function request(body: unknown) {
  return new NextRequest('http://localhost/api/child/task-deferrals', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('paired child task deferrals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
  });

  it('reads only the paired child deferrals through the session', async () => {
    rpc.mockResolvedValue({ data: { status: 'ready', deferredTasks: [deferral] }, error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deferredTasks: [deferral] });
    expect(rpc).toHaveBeenCalledWith('read_child_task_deferrals', {
      session_token_hash: 'hashed-child-session',
    });
  });

  it('saves an idempotent dated choice through the paired session', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', changed: false, deferredTask: deferral }, error: null });
    const response = await POST(request({ activityId, date: '2026-09-25', deferred: true }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ changed: false, deferredTask: deferral });
    expect(rpc).toHaveBeenCalledWith('set_child_task_deferral', {
      session_token_hash: 'hashed-child-session',
      target_activity_id: activityId,
      target_local_date: '2026-09-25',
      should_defer: true,
    });
  });

  it('rejects malformed input and a completed task', async () => {
    expect((await POST(request({ activityId: 'bad', date: '2026-09-25', deferred: true }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: { status: 'already_complete' }, error: null });
    expect((await POST(request({ activityId, date: '2026-09-25', deferred: true }))).status).toBe(409);
  });

  it('expires a revoked child session', async () => {
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    const response = await GET();
    expect(response.status).toBe(401);
    expect(response.headers.get('set-cookie')).toContain('kidhabit_child_session=;');
  });
});
