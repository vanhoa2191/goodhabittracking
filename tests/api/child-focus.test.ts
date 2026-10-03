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

import { POST } from '@/app/api/child/focus/route';

const familyId = '22222222-2222-4222-8222-222222222222';
const childId = '33333333-3333-4333-8333-333333333333';
const activityId = '44444444-4444-4444-8444-444444444444';
const focus = {
  family_id: familyId, child_id: childId, week_start: '2026-09-28', activity_ids: [activityId], chosen_by: 'child',
  updated_at: '2026-09-28T07:00:00.000Z',
};

function request(body: unknown) {
  return new NextRequest('http://localhost/api/child/focus', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('paired child weekly focus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
  });

  it('saves the choice through the device session and returns the saved row', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', weeklyFocus: focus }, error: null });
    const response = await POST(request({ weekStart: '2026-09-28', activityIds: [activityId] }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, weeklyFocus: focus });
    expect(rpc).toHaveBeenCalledWith('set_child_weekly_focus', {
      session_token_hash: 'hashed-child-session', focus_week: '2026-09-28', focus_activity_ids: [activityId],
    });
  });

  it('refuses more than two habits, a malformed day and any extra field before touching the database', async () => {
    expect((await POST(request({ weekStart: '2026-09-28', activityIds: [activityId, activityId, activityId] }))).status).toBe(400);
    expect((await POST(request({ weekStart: 'monday', activityIds: [] }))).status).toBe(400);
    expect((await POST(request({ weekStart: '2026-09-28', activityIds: [], childId }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('needs a device session and clears an expired one', async () => {
    cookieGet.mockReturnValue(undefined);
    expect((await POST(request({ weekStart: '2026-09-28', activityIds: [] }))).status).toBe(401);
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    expect((await POST(request({ weekStart: '2026-09-28', activityIds: [] }))).status).toBe(401);
  });

  it('reports a refusal from the database as a conflict without exposing it', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'focus_activity_unavailable' } });
    const response = await POST(request({ weekStart: '2026-09-28', activityIds: [activityId] }));
    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).not.toContain('focus_activity_unavailable');
  });

  it('does not trust a saved row for another week', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', weeklyFocus: { ...focus, week_start: '2026-09-21' } }, error: null });
    expect((await POST(request({ weekStart: '2026-09-28', activityIds: [activityId] }))).status).toBe(503);
  });
});
