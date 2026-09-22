import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUser, single, select, upsert } = vi.hoisted(() => ({
  getUser: vi.fn(),
  single: vi.fn(),
  select: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser },
    from: vi.fn(() => ({ upsert })),
  })),
}));

import { PATCH } from '@/app/api/account/profile/route';

const savedProfile = {
  display_name: 'Nguyễn Văn An',
  email: 'an@example.com',
  phone: '0912345678',
  marketing_consent: true,
} as const;

function request(): NextRequest {
  return new NextRequest('http://localhost/api/account/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      displayName: savedProfile.display_name,
      phone: savedProfile.phone,
      marketingConsent: savedProfile.marketing_consent,
    }),
  });
}

describe('PATCH /api/account/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({
      data: { user: { id: '11111111-1111-4111-8111-111111111111', email: savedProfile.email } },
    });
    upsert.mockReturnValue({ select });
    select.mockReturnValue({ single });
    single.mockResolvedValue({ data: savedProfile, error: null });
  });

  it('returns the profile read back from storage after saving', async () => {
    const response = await PATCH(request());

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ phone: savedProfile.phone }),
      { onConflict: 'user_id' },
    );
    expect(select).toHaveBeenCalledWith('display_name,email,phone,marketing_consent');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, profile: savedProfile });
  });

  it('does not report success when the stored profile cannot be read back', async () => {
    single.mockResolvedValue({ data: null, error: { message: 'write failed' } });

    const response = await PATCH(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'Could not save profile.' });
  });
});
