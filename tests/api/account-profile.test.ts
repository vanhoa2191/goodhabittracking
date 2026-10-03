import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getUser,
  insert,
  insertSelect,
  maybeSingle,
  single,
  update,
  updateEq,
  updateSelect,
  select,
  selectEq,
  readProfile,
} = vi.hoisted(() => ({
  getUser: vi.fn(),
  insert: vi.fn(),
  insertSelect: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  updateSelect: vi.fn(),
  select: vi.fn(),
  selectEq: vi.fn(),
  readProfile: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    auth: { getUser },
    from: vi.fn(() => ({ insert, update, select })),
  })),
}));

import { GET, PATCH } from '@/app/api/account/profile/route';

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
    update.mockReturnValue({ eq: updateEq });
    updateEq.mockReturnValue({ select: updateSelect });
    updateSelect.mockReturnValue({ maybeSingle });
    maybeSingle.mockResolvedValue({ data: savedProfile, error: null });
    insert.mockReturnValue({ select: insertSelect });
    insertSelect.mockReturnValue({ single });
    single.mockResolvedValue({ data: savedProfile, error: null });
    select.mockReturnValue({ eq: selectEq });
    selectEq.mockReturnValue({ maybeSingle: readProfile });
  });

  it('updates an existing profile without upserting its immutable user id', async () => {
    const response = await PATCH(request());

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ phone: savedProfile.phone }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ user_id: expect.anything() }),
    );
    expect(updateEq).toHaveBeenCalledWith('user_id', '11111111-1111-4111-8111-111111111111');
    expect(insert).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true, profile: savedProfile });
  });

  it('reads a signed-in account before customer details have been entered', async () => {
    readProfile.mockResolvedValue({ data: null, error: null });
    const result = await GET();
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ profile: { display_name: '', email: savedProfile.email, phone: '', marketing_consent: false } });
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('returns an incomplete stored profile without forcing completion at login', async () => {
    const incomplete = { ...savedProfile, display_name: '', phone: null, marketing_consent: false };
    readProfile.mockResolvedValue({ data: incomplete, error: null });
    const result = await GET();
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual({ profile: incomplete });
  });

  it.each([undefined, '', '   ', '12345', 'không có số', 'a@b.co'])('refuses to save a profile whose phone is %s', async (phone) => {
    const response = await PATCH(new NextRequest('http://localhost/api/account/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: savedProfile.display_name, marketingConsent: false, ...(phone === undefined ? {} : { phone }) }),
    }));

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it('stores the phone in a compact form', async () => {
    await PATCH(new NextRequest('http://localhost/api/account/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: savedProfile.display_name, phone: ' +84 912-345 678 ', marketingConsent: false }),
    }));

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ phone: '+84912345678' }));
  });

  it('inserts a profile only when the signup row is missing', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await PATCH(request());

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: '11111111-1111-4111-8111-111111111111',
      phone: savedProfile.phone,
    }));
    expect(response.status).toBe(200);
  });

  it('does not report success when the stored profile cannot be read back', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { code: '42501', message: 'write failed' } });

    const response = await PATCH(request());

    expect(insert).not.toHaveBeenCalled();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Could not save profile.',
      correlationId: expect.any(String),
    });
  });
});
