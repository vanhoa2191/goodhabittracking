import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, rpc } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));

import { PUT } from '@/app/api/domain/journal/route';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const entry = {
  family_id: familyId,
  child_id: childId,
  local_date: '2026-09-26',
  entry_text: 'Con đã giữ lời hứa.',
  created_at: '2026-09-26T12:00:00.000Z',
  updated_at: '2026-09-26T12:00:00.000Z',
};

function request(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/domain/journal', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/domain/journal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId, user: { id: 'parent' } });
    rpc.mockResolvedValue({ data: { status: 'saved', entry }, error: null });
  });

  it('saves a journal entry only through the authenticated family boundary', async () => {
    const response = await PUT(request({ childId, date: '2026-09-26', text: 'Con đã giữ lời hứa.' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ entry });
    expect(rpc).toHaveBeenCalledWith('save_parent_child_journal', {
      target_family_id: familyId,
      target_child_id: childId,
      target_local_date: '2026-09-26',
      target_entry_text: 'Con đã giữ lời hứa.',
    });
  });

  it('rejects an unauthenticated write', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await PUT(request({ childId, date: '2026-09-26', text: 'Nội dung.' }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('does not report a foreign or unavailable child as saved', async () => {
    rpc.mockResolvedValue({ data: { status: 'child_unavailable' }, error: null });
    expect((await PUT(request({ childId, date: '2026-09-26', text: 'Nội dung.' }))).status).toBe(409);
  });
});
