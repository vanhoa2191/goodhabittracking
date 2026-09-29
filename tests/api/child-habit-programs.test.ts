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

import { GET, POST } from '@/app/api/child/habit-programs/route';

const logId = '11111111-1111-4111-8111-111111111111';
const familyId = '22222222-2222-4222-8222-222222222222';
const childId = '33333333-3333-4333-8333-333333333333';
const activityId = '44444444-4444-4444-8444-444444444444';
const observation = {
  log_id: logId,
  family_id: familyId,
  child_id: childId,
  activity_id: activityId,
  support_level: 'alone',
  recorded_by: 'child',
  recorded_at: '2026-09-30T09:00:00.000Z',
};
const cuePlan = {
  family_id: familyId,
  child_id: childId,
  activity_id: activityId,
  cue_kind: 'event',
  cue_text: 'Sau khi đánh răng, con đọc một trang sách',
  cue_time: null,
  place_text: null,
  weekend_variant_text: null,
  updated_at: '2026-09-30T09:00:00.000Z',
};

function request(body: unknown) {
  return new NextRequest('http://localhost/api/child/habit-programs', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('paired child habit programs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
  });

  it('reads only the paired child observations and cue plans through the session', async () => {
    rpc.mockResolvedValue({ data: { status: 'ready', supportObservations: [observation], cuePlans: [cuePlan] }, error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ supportObservations: [observation], cuePlans: [cuePlan] });
    expect(rpc).toHaveBeenCalledWith('read_child_habit_programs', { session_token_hash: 'hashed-child-session' });
  });

  it('records how the child did a habit through the paired session, idempotently', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', changed: false, observation }, error: null });
    const response = await POST(request({ logId, level: 'alone' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ changed: false, observation });
    expect(rpc).toHaveBeenCalledWith('set_child_habit_support', {
      session_token_hash: 'hashed-child-session',
      target_log_id: logId,
      target_level: 'alone',
    });
  });

  it('rejects malformed input, extra fields and a log that is not the child\'s', async () => {
    expect((await POST(request({ logId: 'bad', level: 'alone' }))).status).toBe(400);
    expect((await POST(request({ logId, level: 'perfect' }))).status).toBe(400);
    expect((await POST(request({ logId, level: 'alone', childId }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: { status: 'log_unavailable' }, error: null });
    expect((await POST(request({ logId, level: 'alone' }))).status).toBe(409);
  });

  it('does not claim success when the saved row differs from the request', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', changed: true, observation: { ...observation, support_level: 'prompted' } }, error: null });
    expect((await POST(request({ logId, level: 'alone' }))).status).toBe(503);
  });

  it('expires a revoked child session on read and on write', async () => {
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    const read = await GET();
    expect(read.status).toBe(401);
    expect(read.headers.get('set-cookie')).toContain('kidhabit_child_session=;');
    expect((await POST(request({ logId, level: 'alone' }))).status).toBe(401);
  });

  it('asks for a session when the cookie is missing', async () => {
    cookieGet.mockReturnValue(undefined);
    expect((await GET()).status).toBe(401);
    expect((await POST(request({ logId, level: 'alone' }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
});
