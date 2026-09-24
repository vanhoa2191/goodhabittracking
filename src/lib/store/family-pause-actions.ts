import type { Dispatch, SetStateAction } from 'react';
import type { ExperienceState } from '@/lib/experience-state';

type Dependencies = {
  readonly currentUser: { readonly id: string } | null;
  readonly familyId: string | null;
  readonly setExperience: Dispatch<SetStateAction<ExperienceState>>;
  readonly storageMode: 'local' | 'cloud';
  readonly syncCloudFamily: () => Promise<boolean>;
  readonly requester?: typeof fetch;
};

export function createFamilyPauseAction({
  currentUser,
  familyId,
  setExperience,
  storageMode,
  syncCloudFamily,
  requester = fetch,
}: Dependencies): (paused: boolean) => Promise<boolean> {
  const applyLocally = (paused: boolean, targetFamilyId: string) => {
    const now = new Date().toISOString();
    setExperience((previous) => {
      const wasPausedAt = previous.settings?.paused_at ?? null;
      const periods = previous.settings?.pause_periods ?? [];
      const last = periods.at(-1);
      const pausePeriods = paused && !wasPausedAt
        ? [...periods, { startedAt: now, endedAt: null }]
        : !paused && wasPausedAt
          ? last?.endedAt === null
            ? [...periods.slice(0, -1), { ...last, endedAt: now }]
            : [...periods, { startedAt: wasPausedAt, endedAt: now }]
          : periods;
      return {
        ...previous,
        settings: {
          family_id: targetFamilyId,
          paused_at: paused ? (wasPausedAt ?? now) : null,
          pause_reason: previous.settings?.pause_reason ?? null,
          pause_periods: pausePeriods,
        },
      };
    });
  };

  return async (paused) => {
    if (!familyId) return false;
    if (storageMode === 'local') {
      applyLocally(paused, familyId);
      return true;
    }
    if (!currentUser) return false;

    let response: Response;
    try {
      response = await requester('/api/domain/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: paused ? 'pauseFamily' : 'resumeFamily' }),
      });
    } catch (error: unknown) {
      if (error instanceof TypeError) return false;
      throw error;
    }
    if (!response.ok) return false;
    let refreshed: boolean;
    try {
      refreshed = await syncCloudFamily();
    } catch (error: unknown) {
      if (!(error instanceof TypeError)) throw error;
      refreshed = false;
    }
    if (!refreshed) applyLocally(paused, familyId);
    return true;
  };
}
