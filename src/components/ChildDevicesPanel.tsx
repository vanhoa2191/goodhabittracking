'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getParentSettingsCopy } from '@/lib/i18n/parent-settings-copy';
import {
  loadChildDevices,
  revokeChildDevice,
  type ChildDevice,
} from '@/lib/devices/device-management-client';

export function ChildDevicesPanel() {
  const { profiles, currentUser } = useAppStore();
  const { language } = useTranslation();
  const copy = getParentSettingsCopy(language);
  const [devices, setDevices] = useState<readonly ChildDevice[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const controller = new AbortController();
    void loadChildDevices(globalThis.fetch, controller.signal)
      .then((result) => {
        if (result.success) {
          setDevices(result.devices);
          setErrorMessage(null);
          return;
        }
        setErrorMessage(result.error);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (error instanceof Error) {
          setErrorMessage(copy.devicesLoadError);
          return;
        }
        throw error;
      });
    return () => controller.abort();
  }, [copy.devicesLoadError, currentUser]);

  const handleRevoke = async (deviceId: string) => {
    setRevokingDeviceId(deviceId);
    try {
      const result = await revokeChildDevice(deviceId);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      setDevices((previous) => previous.map((device) => (
        device.id === deviceId
          ? { ...device, revokedAt: new Date().toISOString(), isActive: false }
          : device
      )));
      setErrorMessage(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(copy.deviceRevokeError);
        return;
      }
      throw error;
    } finally {
      setRevokingDeviceId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 space-y-4">
      <div>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-indigo-600" />
          {copy.childDevices}
        </h4>
        <p className="text-xs text-slate-400 mt-1">{copy.childDevicesDescription}</p>
      </div>
      {errorMessage && <p role="alert" className="text-xs font-semibold text-rose-600">{errorMessage}</p>}
      {!currentUser ? (
        <p className="text-xs text-slate-500">{copy.devicesLogin}</p>
      ) : devices.length === 0 ? (
        <p className="text-xs text-slate-500">{copy.devicesNone}</p>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => {
            const child = profiles.find((profile) => profile.id === device.childId);
            return (
              <div key={device.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {device.deviceLabel || copy.childDevice} · {child?.name || copy.childProfile}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {device.isActive ? copy.active : copy.deviceExpired}
                    {device.lastSeenAt ? ` · ${copy.deviceLastSeen} ${new Intl.DateTimeFormat(language, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(device.lastSeenAt))}` : ''}
                  </div>
                </div>
                {device.isActive && (
                  <button
                    type="button"
                    disabled={revokingDeviceId === device.id}
                    onClick={() => void handleRevoke(device.id)}
                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors disabled:cursor-wait disabled:opacity-60"
                  >
                    {copy.deviceRevoke}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
