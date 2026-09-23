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

import { GET, POST } from '@/app/api/child/mascot/route';

function request(body: unknown) {
  return new NextRequest('http://localhost/api/child/mascot', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('paired child mascot API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
    rpc.mockResolvedValue({ data: { status: 'saved' }, error: null });
  });

  it('reads only the paired child selection timestamp', async () => {
    rpc.mockResolvedValue({ data: { status: 'ready', mascot_selected_at: null }, error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ mascot_selected_at: null });
    expect(rpc).toHaveBeenCalledWith('read_child_mascot_selection', {
      session_token_hash: 'hashed-child-session',
    });
  });

  it('sends only an allowed mascot and color scoped by the session', async () => {
    const response = await POST(request({ avatar: 'mascot:fox', themeColor: '#F97316' }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('update_child_mascot_command', {
      session_token_hash: 'hashed-child-session',
      target_avatar: 'mascot:fox',
      target_theme_color: '#F97316',
    });
  });

  it('rejects invalid choices and clears expired sessions', async () => {
    const invalid = await POST(request({ avatar: 'mascot:dragon', themeColor: '#F97316' }));
    expect(invalid.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();

    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    const expired = await POST(request({ avatar: 'mascot:bee', themeColor: '#F97316' }));
    expect(expired.status).toBe(401);
    expect(expired.headers.get('set-cookie')).toContain('kidhabit_child_session=;');
  });

  it('does not expose a status without a child session', async () => {
    cookieGet.mockReturnValue(undefined);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
});
