import { describe, expect, it } from 'vitest';
import {
  loadChildDevices,
  revokeChildDevice,
  type DeviceManagementRequester,
} from '@/lib/devices/device-management-client';

const deviceId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';

describe('device management client', () => {
  it('loads validated devices into the client model', async () => {
    const requester: DeviceManagementRequester = async () => new Response(JSON.stringify({
      devices: [{
        id: deviceId,
        child_id: childId,
        device_label: 'iPad của bé',
        expires_at: '2026-10-20T00:00:00.000Z',
        revoked_at: null,
        last_seen_at: '2026-09-20T00:00:00.000Z',
        created_at: '2026-09-19T00:00:00.000Z',
        is_active: true,
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(loadChildDevices(requester)).resolves.toEqual({
      success: true,
      devices: [{
        id: deviceId,
        childId,
        deviceLabel: 'iPad của bé',
        expiresAt: '2026-10-20T00:00:00.000Z',
        revokedAt: null,
        lastSeenAt: '2026-09-20T00:00:00.000Z',
        createdAt: '2026-09-19T00:00:00.000Z',
        isActive: true,
      }],
    });
  });

  it('rejects malformed device rows before rendering them', async () => {
    const requester: DeviceManagementRequester = async () => new Response(JSON.stringify({
      devices: [{ id: 'not-a-uuid', child_id: childId }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(loadChildDevices(requester)).resolves.toEqual({
      success: false,
      error: 'Không thể tải danh sách thiết bị.',
    });
  });

  it('preserves a server-declared load error', async () => {
    const requester: DeviceManagementRequester = async () => new Response(JSON.stringify({
      error: 'Vui lòng đăng nhập tài khoản phụ huynh.',
    }), { status: 401, headers: { 'content-type': 'application/json' } });

    await expect(loadChildDevices(requester)).resolves.toEqual({
      success: false,
      error: 'Vui lòng đăng nhập tài khoản phụ huynh.',
    });
  });

  it('revokes only after a validated success response', async () => {
    const requester: DeviceManagementRequester = async () => new Response(JSON.stringify({
      success: true,
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    await expect(revokeChildDevice(deviceId, requester)).resolves.toEqual({ success: true });
  });

  it('rejects a malformed revoke response', async () => {
    const requester: DeviceManagementRequester = async () => new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

    await expect(revokeChildDevice(deviceId, requester)).resolves.toEqual({
      success: false,
      error: 'Không thể thu hồi thiết bị.',
    });
  });
});
