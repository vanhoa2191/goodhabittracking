import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, from, upsert } = vi.hoisted(() => ({ getParentContext: vi.fn(), from: vi.fn(), upsert: vi.fn() }));
vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ from })) }));

import { GET, PUT } from '@/app/api/privacy/ai-consent/route';

const familyId = '22222222-2222-4222-8222-222222222222';

function put(body: unknown) {
  return PUT(new NextRequest('http://localhost/api/privacy/ai-consent', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
}

describe('AI consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId, user: { id: 'parent-1' } });
    upsert.mockResolvedValue({ error: null });
    from.mockImplementation(() => ({ upsert }));
  });

  it('needs a signed-in parent', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    expect((await put({ enabled: true })).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('records the agreement for this parent, this family and this version of the text', async () => {
    const response = await put({ enabled: true });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ enabled: true });
    expect(from).toHaveBeenCalledWith('family_consents');
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      family_id: familyId, user_id: 'parent-1', consent_type: 'parent_ai', policy_version: '2026-10-04', revoked_at: null,
    }), { onConflict: 'family_id,user_id,consent_type,policy_version' });
  });

  it('withdraws by stamping the revocation, never by deleting the record', async () => {
    await put({ enabled: false });
    const saved = upsert.mock.calls[0]?.[0] as { revoked_at: string | null };
    expect(typeof saved.revoked_at).toBe('string');
  });

  it('refuses a body with anything else in it, and reports a failed save', async () => {
    expect((await put({ enabled: true, familyId: 'other' })).status).toBe(400);
    expect((await put({ enabled: 'yes' })).status).toBe(400);
    upsert.mockResolvedValue({ error: { message: 'down' } });
    expect((await put({ enabled: true })).status).toBe(503);
  });

  it('reads an agreement as on only when it exists and was not withdrawn', async () => {
    const read = (row: { revoked_at: string | null } | null) => {
      const query: Record<string, unknown> = {};
      query.select = () => query;
      query.eq = () => query;
      query.maybeSingle = async () => ({ data: row, error: null });
      from.mockImplementation(() => query);
    };
    read({ revoked_at: null });
    await expect((await GET()).json()).resolves.toEqual({ enabled: true });
    read({ revoked_at: '2026-10-04T00:00:00.000Z' });
    await expect((await GET()).json()).resolves.toEqual({ enabled: false });
    read(null);
    await expect((await GET()).json()).resolves.toEqual({ enabled: false });
  });
});
