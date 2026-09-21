import { useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ChildProfile, HabitActivity, Reward } from '@/types';
import {
  connectChildDevice,
  createPairingChallenge,
  disconnectChildDevice,
  loadChildSession,
  type ChildSession,
} from './pairing-client';
import { LOCAL_STORAGE_PREFIX } from './local-family-persistence';

type FamilySetters = {
  readonly setActivities: Dispatch<SetStateAction<HabitActivity[]>>;
  readonly setActiveChildId: Dispatch<SetStateAction<string | null>>;
  readonly setChildCodes: Dispatch<SetStateAction<Record<string, string>>>;
  readonly setIsFamilyConnected: Dispatch<SetStateAction<boolean>>;
  readonly setMode: Dispatch<SetStateAction<'kid' | 'parent'>>;
  readonly setProfiles: Dispatch<SetStateAction<ChildProfile[]>>;
  readonly setRewards: Dispatch<SetStateAction<Reward[]>>;
};

type Dependencies = {
  readonly currentUser: User | null;
  readonly isLoaded: boolean;
  readonly mode: 'kid' | 'parent';
  readonly profiles: readonly ChildProfile[];
  readonly resetFamilyScope: () => void;
  readonly setters: FamilySetters;
};

type PairingResult = {
  readonly success: boolean;
  readonly message?: string;
  readonly childName?: string;
  readonly childAvatar?: string;
  readonly familyName?: string;
};

export function usePairingLifecycle(dependencies: Dependencies) {
  const { currentUser, isLoaded, mode, profiles, resetFamilyScope } = dependencies;
  const {
    setActivities,
    setActiveChildId,
    setChildCodes,
    setIsFamilyConnected,
    setMode,
    setProfiles,
    setRewards,
  } = dependencies.setters;

  const hydrateChildSession = useCallback((session: ChildSession) => {
    resetFamilyScope();
    setIsFamilyConnected(true);
    setProfiles([session.child]);
    setActiveChildId(session.child.id);
    setActivities(session.activities);
    setRewards(session.rewards);
    setMode('kid');
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}child_paired`, 'true');
  }, [
    resetFamilyScope,
    setActivities,
    setActiveChildId,
    setIsFamilyConnected,
    setMode,
    setProfiles,
    setRewards,
  ]);

  const generateChildCodes = useCallback(async (): Promise<Record<string, string>> => {
    if (!currentUser) return {};
    try {
      const entries = await Promise.all(profiles.map(async (profile) => (
        [profile.id, await createPairingChallenge(profile.id)] as const
      )));
      const codes = Object.fromEntries(
        entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])),
      );
      if (Object.keys(codes).length > 0) {
        setChildCodes(codes);
        return codes;
      }
    } catch (error: unknown) {
      console.warn('Could not generate per-child pairing codes:', error);
    }
    return {};
  }, [currentUser, profiles, setChildCodes]);

  const regenerateChildCode = async (childId: string): Promise<string | null> => {
    try {
      const code = await createPairingChallenge(childId);
      if (!code) return null;
      setChildCodes((previous) => ({ ...previous, [childId]: code }));
      return code;
    } catch (error: unknown) {
      console.warn('Could not regenerate child code:', error);
      return null;
    }
  };

  useEffect(() => {
    if (isLoaded && mode === 'parent') {
      queueMicrotask(() => void generateChildCodes());
    }
  }, [generateChildCodes, isLoaded, mode]);

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    if (localStorage.getItem(`${LOCAL_STORAGE_PREFIX}child_paired`) !== 'true') return;
    void loadChildSession()
      .then((result) => {
        if (result.success) hydrateChildSession(result.session);
        else resetFamilyScope();
      })
      .catch(resetFamilyScope);
  }, [hydrateChildSession, isLoaded, resetFamilyScope]);

  const connectWithFamilyCode = async (code: string): Promise<PairingResult> => {
    const result = await connectChildDevice(code);
    if (!result.success) return result;
    hydrateChildSession(result.session);
    return {
      success: true,
      childName: result.session.child.name,
      childAvatar: result.session.child.avatar,
    };
  };

  const disconnectFamilyCode = (): void => {
    void disconnectChildDevice().catch(() => undefined);
    resetFamilyScope();
  };

  return {
    connectWithFamilyCode,
    disconnectFamilyCode,
    generateChildCodes,
    regenerateChildCode,
  };
}
