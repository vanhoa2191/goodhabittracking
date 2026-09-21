import { z } from 'zod';

const childDeviceRowSchema = z.object({
  id: z.string().uuid(),
  child_id: z.string().uuid(),
  device_label: z.string().nullable(),
  expires_at: z.string().min(1),
  revoked_at: z.string().nullable(),
  last_seen_at: z.string().nullable(),
  created_at: z.string().min(1),
  is_active: z.boolean(),
});

const devicesResponseSchema = z.object({ devices: z.array(childDeviceRowSchema) });
const errorResponseSchema = z.object({ error: z.string().min(1) });
const revokeResponseSchema = z.object({ success: z.literal(true) });
const deviceIdSchema = z.string().uuid();

export interface ChildDevice {
  readonly id: string;
  readonly childId: string;
  readonly deviceLabel: string | null;
  readonly expiresAt: string;
  readonly revokedAt: string | null;
  readonly lastSeenAt: string | null;
  readonly createdAt: string;
  readonly isActive: boolean;
}

export type DeviceManagementRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type LoadChildDevicesResult =
  | { readonly success: true; readonly devices: readonly ChildDevice[] }
  | { readonly success: false; readonly error: string };

export type RevokeChildDeviceResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string };

export async function loadChildDevices(
  requester: DeviceManagementRequester = globalThis.fetch,
  signal?: AbortSignal,
): Promise<LoadChildDevicesResult> {
  try {
    const response = await requester('/api/devices', { cache: 'no-store', signal });
    const input: unknown = await response.json();
    const devices = devicesResponseSchema.safeParse(input);
    if (response.ok && devices.success) {
      return {
        success: true,
        devices: devices.data.devices.map((device) => ({
          id: device.id,
          childId: device.child_id,
          deviceLabel: device.device_label,
          expiresAt: device.expires_at,
          revokedAt: device.revoked_at,
          lastSeenAt: device.last_seen_at,
          createdAt: device.created_at,
          isActive: device.is_active,
        })),
      };
    }
    const failure = errorResponseSchema.safeParse(input);
    return {
      success: false,
      error: failure.success ? failure.data.error : 'Không thể tải danh sách thiết bị.',
    };
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return { success: false, error: 'Không thể tải danh sách thiết bị.' };
    }
    throw error;
  }
}

export async function revokeChildDevice(
  deviceId: string,
  requester: DeviceManagementRequester = globalThis.fetch,
): Promise<RevokeChildDeviceResult> {
  const parsedId = deviceIdSchema.safeParse(deviceId);
  if (!parsedId.success) return { success: false, error: 'Thiết bị không hợp lệ.' };

  try {
    const response = await requester(`/api/devices/${parsedId.data}`, { method: 'DELETE' });
    const input: unknown = await response.json();
    const success = revokeResponseSchema.safeParse(input);
    if (response.ok && success.success) return success.data;
    const failure = errorResponseSchema.safeParse(input);
    return {
      success: false,
      error: failure.success ? failure.data.error : 'Không thể thu hồi thiết bị.',
    };
  } catch (error: unknown) {
    if (error instanceof TypeError || error instanceof SyntaxError) {
      return { success: false, error: 'Không thể thu hồi thiết bị.' };
    }
    throw error;
  }
}
