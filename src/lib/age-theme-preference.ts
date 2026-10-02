import { isAgeBandOverride } from '@/lib/age-band';
import type { AgeBandOverride } from '@/lib/age-band';

/** What one device remembers about how a child's screen is tuned to age. */
export type AgeThemePreference = {
  /** 'off' keeps the screen as it was; a band pins it; nothing follows the child's age. */
  readonly override: AgeBandOverride | null;
  /** From 13 the teenager picks: a lean screen, or one that keeps the companion. */
  readonly teenStyle: 'compact' | 'companion' | null;
  /** The one-time note about the tuned screen has been answered. */
  readonly noticeSeen: boolean;
};

export const EMPTY_AGE_THEME_PREFERENCE: AgeThemePreference = { override: null, teenStyle: null, noticeSeen: false };

export const ageThemeStorageKey = (childId: string): string => `kh-age-theme:${childId}`;

export function parseAgeThemePreference(raw: string | null): AgeThemePreference {
  if (!raw) return EMPTY_AGE_THEME_PREFERENCE;
  try {
    const value = JSON.parse(raw) as Record<string, unknown> | null;
    if (!value || typeof value !== 'object') return EMPTY_AGE_THEME_PREFERENCE;
    return {
      override: isAgeBandOverride(value.override) ? value.override : null,
      teenStyle: value.teenStyle === 'compact' || value.teenStyle === 'companion' ? value.teenStyle : null,
      noticeSeen: value.noticeSeen === true,
    };
  } catch {
    return EMPTY_AGE_THEME_PREFERENCE;
  }
}

export function readAgeThemePreference(childId: string): AgeThemePreference {
  try {
    return parseAgeThemePreference(window.localStorage.getItem(ageThemeStorageKey(childId)));
  } catch {
    return EMPTY_AGE_THEME_PREFERENCE;
  }
}

/** Storage can be blocked (private window, full disk); the choice then lasts for this visit only. */
export function writeAgeThemePreference(childId: string, preference: AgeThemePreference): void {
  try {
    window.localStorage.setItem(ageThemeStorageKey(childId), JSON.stringify(preference));
  } catch {
    // the in-memory state still applies
  }
}
