'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { resolveParentReminderDelivery } from '@/lib/parent-reminders';
import type { ParentReminderDelivery, ParentReminderPermission } from '@/lib/parent-reminders';
import { useAppStore } from '@/lib/store';

const consentResponse = z.strictObject({ enabled: z.boolean() });

type ParentReminderContextValue = {
  readonly enabled: boolean;
  readonly delivery: ParentReminderDelivery;
  readonly permission: ParentReminderPermission;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly hasError: boolean;
  readonly load: () => void;
  readonly save: (enabled: boolean) => Promise<void>;
  readonly requestDevicePermission: () => Promise<void>;
};

const ParentReminderContext = createContext<ParentReminderContextValue | null>(null);

export function ParentReminderProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { currentUser, familyId } = useAppStore();
  const identityKey = currentUser && familyId ? `${currentUser.id}:${familyId}` : null;
  const [consent, setConsent] = useState<{ readonly identityKey: string | null; readonly enabled: boolean }>({ identityKey: null, enabled: false });
  const [permission, setPermission] = useState<ParentReminderPermission>(() => (
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported'
  ));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const loadedIdentity = useRef<string | null>(null);
  const enabled = consent.identityKey === identityKey && consent.enabled;

  const load = useCallback(() => {
    if (!identityKey || loadedIdentity.current === identityKey) return;
    loadedIdentity.current = identityKey;
    setConsent({ identityKey, enabled: false });
    setIsLoading(true);
    setIsSaving(false);
    setHasError(false);
    void fetch('/api/privacy/reminder-consent')
      .then(async (response) => {
        if (response.status === 401) return { enabled: false };
        if (!response.ok) return null;
        const parsed = consentResponse.safeParse(await response.json());
        return parsed.success ? parsed.data : null;
      })
      .then((result) => {
        if (loadedIdentity.current !== identityKey) return;
        if (!result) setHasError(true);
        else setConsent({ identityKey, enabled: result.enabled });
      })
      .catch((error: unknown) => {
        if (!(error instanceof Error)) throw error;
        if (loadedIdentity.current === identityKey) setHasError(true);
      })
      .finally(() => {
        if (loadedIdentity.current === identityKey) setIsLoading(false);
      });
  }, [identityKey]);

  const save = useCallback(async (nextEnabled: boolean) => {
    if (!identityKey) return;
    const previous = enabled;
    setConsent({ identityKey, enabled: nextEnabled });
    setIsSaving(true);
    setHasError(false);
    try {
      const response = await fetch('/api/privacy/reminder-consent', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const parsed = consentResponse.safeParse(await response.json());
      if (loadedIdentity.current !== identityKey) return;
      if (!response.ok || !parsed.success) {
        setConsent({ identityKey, enabled: previous });
        setHasError(true);
        return;
      }
      setConsent({ identityKey, enabled: parsed.data.enabled });
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      if (loadedIdentity.current === identityKey) {
        setConsent({ identityKey, enabled: previous });
        setHasError(true);
      }
    } finally {
      if (loadedIdentity.current === identityKey) setIsSaving(false);
    }
  }, [enabled, identityKey]);

  const requestDevicePermission = useCallback(async () => {
    if (!enabled || !('Notification' in window)) return;
    setPermission(await window.Notification.requestPermission());
  }, [enabled]);

  const delivery = resolveParentReminderDelivery({ consented: enabled, permission });
  const value = useMemo(() => ({ enabled, delivery, permission, isLoading, isSaving, hasError, load, save, requestDevicePermission }), [delivery, enabled, hasError, isLoading, isSaving, load, permission, requestDevicePermission, save]);
  return <ParentReminderContext.Provider value={value}>{children}</ParentReminderContext.Provider>;
}

export function useParentReminderConsent(): ParentReminderContextValue {
  const context = useContext(ParentReminderContext);
  if (!context) throw new Error('useParentReminderConsent must be used within ParentReminderProvider.');
  return context;
}
