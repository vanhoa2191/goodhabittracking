'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { getActivityMutationError } from '@/lib/i18n/activity-mutation-copy';
import { useAppStore } from '@/lib/store';
import type { AgeStage } from '@/types';

type AgeHabitBundleMutation = {
  readonly applyAgeBundle: (childId: string, stage: AgeStage) => Promise<boolean>;
  readonly mutationError: string;
  readonly pendingChildId: string | null;
};

export function useAgeHabitBundleMutation(): AgeHabitBundleMutation {
  const { applyAgeHabitsBundle } = useAppStore();
  const { language } = useTranslation();
  const [mutationError, setMutationError] = useState('');
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);

  const applyAgeBundle = async (childId: string, stage: AgeStage): Promise<boolean> => {
    setMutationError('');
    setPendingChildId(childId);
    const saved = await applyAgeHabitsBundle(childId, stage);
    setPendingChildId(null);
    if (!saved) setMutationError(getActivityMutationError(language));
    return saved;
  };

  return { applyAgeBundle, mutationError, pendingChildId };
}
