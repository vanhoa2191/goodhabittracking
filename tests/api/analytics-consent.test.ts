import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, from, maybeSingle, upsert } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  from: vi.fn(),
  maybeSingle: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ from })),
}));

import { GET, PUT } from '@/app/api/privacy/analytics-consent/route';

function request(enabled: unknown) {
  return new NextRequest('http://localhost/api/privacy/analytics-consent', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

describe('analytics consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId: 'family-a', user: { id: 'user-a' }, role: 'parent' });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    upsert.mockResolvedValue({ error: null });
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
      upsert,
    };
    from.mockReturnValue(query);
  });

  it('returns disabled when the parent has not opted in', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: false });
  });

  it('stores explicit opt-in for the authenticated parent and family', async () => {
    const response = await PUT(request(true));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: true });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      family_id: 'family-a', user_id: 'user-a', consent_type: 'analytics', revoked_at: null,
    }), { onConflict: 'family_id,user_id,consent_type,policy_version' });
  });

  it('records revocation instead of deleting the consent history', async () => {
    const response = await PUT(request(false));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: false });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      consent_type: 'analytics', revoked_at: expect.any(String),
    }), { onConflict: 'family_id,user_id,consent_type,policy_version' });
  });

  it('rejects unauthenticated access and non-boolean consent', async () => {
    getParentContext.mockResolvedValueOnce(null);
    expect((await PUT(request(true))).status).toBe(401);
    expect((await PUT(request('yes'))).status).toBe(400);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('does not report success when storage fails', async () => {
    upsert.mockResolvedValue({ error: { message: 'unavailable' } });
    expect((await PUT(request(true))).status).toBe(503);
  });
});
