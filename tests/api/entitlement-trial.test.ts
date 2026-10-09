import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getParentContext, rpc } = vi.hoisted(() => ({ getParentContext: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/auth/parent-context', () => ({ getParentContext }));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: async () => ({ rpc }) }));
import { POST } from '@/app/api/entitlement/trial/route';
const request = () => new NextRequest('http://localhost/api/entitlement/trial', { method: 'POST' });
describe('trial manager permission', () => {
  beforeEach(() => {
    getParentContext.mockResolvedValue({ familyId: 'family-1', role: 'owner', user: { id: 'owner-1' } });
    rpc.mockReset();
  });
  it('refuses a caregiver before consuming the trial', async () => {
    getParentContext.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rechecks can_manage_family before activation', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    expect((await POST(request())).status).toBe(403);
    expect(rpc).toHaveBeenCalledExactlyOnceWith('can_manage_family', { target_family_id: 'family-1' });
  });
  it('allows the manager to activate once', async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null }).mockResolvedValueOnce({ data: [{ plan: 'trial' }], error: null });
    await expect((await POST(request())).json()).resolves.toMatchObject({ success: true, entitlement: { plan: 'trial' } });
  });
});
