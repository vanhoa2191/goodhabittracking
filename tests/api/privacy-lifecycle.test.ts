import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, rpc, upsert, from } = vi.hoisted(() => ({
  getParentContext: vi.fn(),
  rpc: vi.fn(),
  upsert: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc, from })),
}));

import { DELETE } from '@/app/api/family/route';
import { POST } from '@/app/api/privacy/consent/route';

function request(path: string, method: 'POST' | 'DELETE', body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('privacy lifecycle APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentContext.mockResolvedValue({ familyId: 'family-a', user: { id: 'user-a' }, role: 'owner' });
    rpc.mockResolvedValue({ error: null });
    upsert.mockResolvedValue({ error: null });
    from.mockReturnValue({ upsert });
  });

  it('requires exact confirmation and family ownership before deletion', async () => {
    const invalid = await DELETE(request('/api/family', 'DELETE', { confirmation: 'DELETE' }));
    expect(invalid.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();

    getParentContext.mockResolvedValue({ familyId: 'family-a', user: { id: 'user-a' }, role: 'member' });
    const member = await DELETE(request('/api/family', 'DELETE', { confirmation: 'DELETE FAMILY' }));
    expect(member.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('uses the owner-only database function for confirmed deletion', async () => {
    const response = await DELETE(request('/api/family', 'DELETE', { confirmation: 'DELETE FAMILY' }));
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('delete_owned_family', { confirmation: 'DELETE FAMILY' });
  });

  it('records both required consent scopes for the authenticated family', async () => {
    const response = await POST(request('/api/privacy/consent', 'POST', {
      policyVersion: '2026-09-19',
      childDataConsent: true,
    }));

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith('family_consents');
    expect(upsert).toHaveBeenCalledWith([
      expect.objectContaining({ family_id: 'family-a', user_id: 'user-a', consent_type: 'privacy' }),
      expect.objectContaining({ family_id: 'family-a', user_id: 'user-a', consent_type: 'child_data' }),
    ]);
  });

  it('rejects missing or extended consent payloads', async () => {
    const missing = await POST(request('/api/privacy/consent', 'POST', {
      policyVersion: '2026-09-19',
      childDataConsent: false,
    }));
    const extended = await POST(request('/api/privacy/consent', 'POST', {
      policyVersion: '2026-09-19',
      childDataConsent: true,
      marketingConsent: true,
    }));

    expect(missing.status).toBe(400);
    expect(extended.status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
});
