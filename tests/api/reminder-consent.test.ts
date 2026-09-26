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

import { GET, PUT } from '@/app/api/privacy/reminder-consent/route';

function request(enabled: unknown) {
  return new NextRequest('http://localhost/api/privacy/reminder-consent', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

describe('parent reminder consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId: 'family-a', user: { id: 'user-a' }, role: 'parent' });
    maybeSingle.mockResolvedValue({ data: null, error: null });
    upsert.mockResolvedValue({ error: null });
    from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
      upsert,
    });
  });

  it('defaults to disabled without an explicit consent record', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: false });
  });

  it('stores opt-in for the authenticated parent and family', async () => {
    const response = await PUT(request(true));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enabled: true });
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      family_id: 'family-a', user_id: 'user-a', consent_type: 'parent_reminders', revoked_at: null,
    }), { onConflict: 'family_id,user_id,consent_type,policy_version' });
  });

  it('records revocation and rejects invalid access', async () => {
    expect((await PUT(request(false))).status).toBe(200);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      consent_type: 'parent_reminders', revoked_at: expect.any(String),
    }), { onConflict: 'family_id,user_id,consent_type,policy_version' });

    getParentContext.mockResolvedValueOnce(null);
    expect((await PUT(request(true))).status).toBe(401);
    expect((await PUT(request('yes'))).status).toBe(400);
  });

  it('does not report success when consent storage fails', async () => {
    upsert.mockResolvedValue({ error: { message: 'unavailable' } });
    expect((await PUT(request(true))).status).toBe(503);
  });
});
