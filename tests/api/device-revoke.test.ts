import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { userRpc, adminRpc, unlock } = vi.hoisted(() => ({ userRpc: vi.fn(), adminRpc: vi.fn(), unlock: vi.fn() }));

vi.mock('@/lib/auth/parent-context', () => ({
  getParentContext: vi.fn(async () => ({ familyId: 'family-a', role: 'owner', user: { id: 'parent-user-1' } })),
}));
vi.mock('@/lib/supabase/server', () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc: userRpc })) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminSupabaseClient: vi.fn(() => ({ rpc: adminRpc })) }));
vi.mock('@/lib/security/parent-unlock', () => ({ requireParentUnlock: unlock }));

import { DELETE } from '@/app/api/devices/[id]/route';

const deviceId = '11111111-1111-4111-8111-111111111111';

function revoke() {
  return DELETE(new NextRequest(`http://localhost/api/devices/${deviceId}`, { method: 'DELETE' }), { params: Promise.resolve({ id: deviceId }) });
}

describe('DELETE /api/devices/[id]', () => {
  beforeEach(() => {
    userRpc.mockReset();
    adminRpc.mockReset();
    unlock.mockReset();
    unlock.mockResolvedValue(null);
  });

  it('revokes through the server-only function for the verified parent', async () => {
    adminRpc.mockResolvedValue({ data: true, error: null });
    expect((await revoke()).status).toBe(200);
    expect(adminRpc).toHaveBeenCalledWith('revoke_device_session_as', { actor_user_id: 'parent-user-1', target_device_session_id: deviceId });
    expect(userRpc).not.toHaveBeenCalledWith('revoke_device_session', expect.anything());
  });

  it('says not found when the device is not in the family', async () => {
    adminRpc.mockResolvedValue({ data: false, error: null });
    expect((await revoke()).status).toBe(404);
  });

  it('does not touch the database while the PIN is locked', async () => {
    unlock.mockResolvedValue(new Response(JSON.stringify({ code: 'parent_pin_required' }), { status: 403 }));
    expect((await revoke()).status).toBe(403);
    expect(adminRpc).not.toHaveBeenCalled();
  });

  it('reports a database failure without retrying as the browser user', async () => {
    adminRpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    expect((await revoke()).status).toBe(503);
    expect(userRpc).not.toHaveBeenCalled();
  });
});
