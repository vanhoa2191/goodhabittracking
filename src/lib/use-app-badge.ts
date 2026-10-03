'use client';

import { useEffect } from 'react';

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/** Shows how many things wait for a parent on the installed app's icon, and clears it when none do or when the parent leaves. */
export function useAppBadge(count: number, enabled: boolean): void {
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const badge = navigator as BadgeNavigator;
    if (!enabled || !badge.setAppBadge) return;
    const clear = () => { void badge.clearAppBadge?.().catch(() => undefined); };
    if (count > 0) void badge.setAppBadge(count).catch(() => undefined);
    else clear();
    return clear;
  }, [count, enabled]);
}
