'use client';

import { useCallback, useState } from 'react';
import type { ChildProfile } from '@/types';
import { ageBandTraits, resolveAgeBand } from '@/lib/age-band';
import type { AgeBand, AgeBandTraits } from '@/lib/age-band';
import {
  EMPTY_AGE_THEME_PREFERENCE,
  readAgeThemePreference,
  writeAgeThemePreference,
} from '@/lib/age-theme-preference';
import type { AgeThemePreference } from '@/lib/age-theme-preference';
import { defaultExperienceFlags } from '@/lib/experience-flags';

export type AgeTheme = {
  readonly band: AgeBand | null;
  readonly traits: AgeBandTraits | null;
  /** Teenagers choose; until they do the lean screen applies. */
  readonly leanTeen: boolean;
  readonly showNotice: boolean;
  readonly keepOldLook: () => void;
  readonly useNewLook: () => void;
  readonly pickTeenStyle: (style: 'compact' | 'companion') => void;
  readonly toggleTeenStyle: () => void;
};

const initialFor = (childId: string | null): AgeThemePreference =>
  childId ? readAgeThemePreference(childId) : EMPTY_AGE_THEME_PREFERENCE;

/** The age band of the child on screen, what the device remembers about it, and the choices that change it. */
export function useAgeTheme(child: ChildProfile | null | undefined): AgeTheme {
  const childId = child?.id ?? null;
  const [stored, setStored] = useState(() => ({ childId, preference: initialFor(childId) }));
  const preference = stored.childId === childId ? stored.preference : initialFor(childId);

  const save = useCallback((patch: Partial<AgeThemePreference>) => {
    if (!childId) return;
    const next = { ...preference, ...patch };
    writeAgeThemePreference(childId, next);
    setStored({ childId, preference: next });
  }, [childId, preference]);

  const band = defaultExperienceFlags.ageTheme && child
    ? resolveAgeBand(child, new Date(), preference.override)
    : null;

  return {
    band,
    traits: band ? ageBandTraits(band) : null,
    leanTeen: band === 'teen' && preference.teenStyle !== 'companion',
    showNotice: band !== null && !preference.noticeSeen,
    keepOldLook: () => save({ override: 'off', noticeSeen: true }),
    useNewLook: () => save({ override: null, noticeSeen: true }),
    pickTeenStyle: (style) => save({ teenStyle: style, noticeSeen: true }),
    toggleTeenStyle: () => save({ teenStyle: preference.teenStyle === 'companion' ? 'compact' : 'companion', noticeSeen: true }),
  };
}
