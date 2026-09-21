import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieGet, rpc, sha256Hex } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  rpc: vi.fn(),
  sha256Hex: vi.fn(async () => 'hashed-child-session'),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));
vi.mock('@/lib/pairing/crypto', () => ({
  CHILD_SESSION_COOKIE: 'kidhabit_child_session',
  sha256Hex,
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));

import { POST } from '@/app/api/child/commands/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/child/commands', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('child device command API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
    rpc.mockResolvedValue({
      data: {
        status: 'pending_approval',
        logId: '33333333-3333-4333-8333-333333333333',
        pointsAwarded: 0,
      },
      error: null,
    });
  });

  it('requires a child session cookie', async () => {
    cookieGet.mockReturnValue(undefined);
    const response = await POST(request({
      type: 'undoHabit',
      logId: '33333333-3333-4333-8333-333333333333',
    }));

    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('derives child scope from the opaque session instead of request data', async () => {
    const response = await POST(request({
      type: 'completeHabit',
      activityId: '11111111-1111-4111-8111-111111111111',
      date: '2026-09-21',
      commandId: '33333333-3333-4333-8333-333333333333',
    }));

    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('complete_child_habit_command', {
      session_token_hash: 'hashed-child-session',
      target_activity_id: '11111111-1111-4111-8111-111111111111',
      target_log_date: '2026-09-21',
      command_id: '33333333-3333-4333-8333-333333333333',
    });
  });

  it('rejects a caller-supplied child id and clears an invalid session', async () => {
    const extended = await POST(request({
      type: 'completeHabit',
      activityId: '11111111-1111-4111-8111-111111111111',
      childId: '22222222-2222-4222-8222-222222222222',
      date: '2026-09-21',
      commandId: '33333333-3333-4333-8333-333333333333',
    }));
    expect(extended.status).toBe(400);

    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    const invalid = await POST(request({
      type: 'undoHabit',
      logId: '33333333-3333-4333-8333-333333333333',
    }));
    expect(invalid.status).toBe(401);
    expect(invalid.headers.get('set-cookie')).toContain('kidhabit_child_session=;');
  });
});
