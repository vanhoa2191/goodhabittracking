import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieGet, cookieDelete, rpc } = vi.hoisted(() => ({
  cookieGet: vi.fn(),
  cookieDelete: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ get: cookieGet, delete: cookieDelete })),
}));
vi.mock('@/lib/pairing/crypto', () => ({
  CHILD_SESSION_COOKIE: 'child-session',
  sha256Hex: vi.fn(async () => 'hashed-token'),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));

import { GET, PUT } from '@/app/api/child/journal/route';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const entry = {
  family_id: familyId,
  child_id: childId,
  local_date: '2026-09-26',
  entry_text: 'Con đã giúp mẹ.',
  created_at: '2026-09-26T12:00:00.000Z',
  updated_at: '2026-09-26T12:00:00.000Z',
};

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/child/journal', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/child/journal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'session-token' });
    rpc.mockResolvedValue({ data: { status: 'ready', entries: [entry] }, error: null });
  });

  it('loads only the paired child journal', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ entries: [entry] });
    expect(rpc).toHaveBeenCalledWith('read_child_journal', { session_token_hash: 'hashed-token' });
  });

  it('normalizes and saves the child reflection', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', entry }, error: null });
    const response = await PUT(request({ date: '2026-09-26', text: '  Con đã giúp\nmẹ. ' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ entry });
    expect(rpc).toHaveBeenCalledWith('save_child_journal', {
      session_token_hash: 'hashed-token',
      target_local_date: '2026-09-26',
      target_entry_text: 'Con đã giúp mẹ.',
    });
  });

  it('rejects invalid text before calling the database', async () => {
    const response = await PUT(request({ date: '2026-09-26', text: 'a'.repeat(281) }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('clears an invalid paired session', async () => {
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    expect((await GET()).status).toBe(401);
    expect(cookieDelete).toHaveBeenCalledWith('child-session');
  });
});
