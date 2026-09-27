'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useAppStore } from '@/lib/store';
import { getMascotChangeAvailableAt } from '@/lib/mascot-selection';
import { AvatarPickerModal } from './AvatarPickerModal';

const selectionStateSchema = z.object({
  children: z.array(z.object({
    child_id: z.string().uuid(),
    mascot_selected_at: z.string().datetime({ offset: true }).nullable(),
  })),
});

type CheckStatus = 'loading' | 'ready' | 'error';

export function MascotPickerController({ onClose }: { readonly onClose: () => void }) {
  const { activeChild, currentUser, experience, isDemoSession, isFamilyConnected, updateActiveAvatar } = useAppStore();
  const isPairedChild = !isDemoSession && !currentUser && isFamilyConnected;
  const [cloudSelectedAt, setCloudSelectedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckStatus>(isDemoSession ? 'ready' : 'loading');

  useEffect(() => {
    if (isDemoSession || !activeChild) return;
    const controller = new AbortController();
    const childId = activeChild.id;

    async function loadSelection() {
      try {
        const response = await fetch(isPairedChild ? '/api/child/mascot' : '/api/domain/experience', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          setStatus('error');
          return;
        }
        if (isPairedChild) {
          const state = z.object({ mascot_selected_at: z.string().datetime({ offset: true }).nullable() }).parse(await response.json());
          setCloudSelectedAt(state.mascot_selected_at);
        } else {
          const state = selectionStateSchema.parse(await response.json());
          setCloudSelectedAt(state.children.find((child) => child.child_id === childId)?.mascot_selected_at ?? null);
        }
        setStatus('ready');
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof Error) {
          setStatus('error');
          return;
        }
        throw error;
      }
    }

    void loadSelection();
    return () => controller.abort();
  }, [activeChild, isDemoSession, isPairedChild]);

  if (!activeChild) return null;
  const selectedAt = isDemoSession
    ? experience.children.find((child) => child.child_id === activeChild.id)?.mascot_selected_at ?? null
    : cloudSelectedAt;

  return (
    <AvatarPickerModal
      isOpen
      onClose={onClose}
      currentAvatar={activeChild.avatar}
      currentColor={activeChild.themeColor}
      onSave={updateActiveAvatar}
      cooldownUntil={getMascotChangeAvailableAt(selectedAt)}
      cooldownStatus={status}
    />
  );
}
