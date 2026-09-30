'use client';

import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { dismissSuggestion } from './suggestion-display';
import type { DismissalState } from './suggestion-display';

const STORAGE_KEY = 'kidhabit_suggestion_dismissals_v1';
const stored = z.record(z.string(), z.string());

function readDismissals(): DismissalState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? stored.parse(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

/** "Later" choices for suggestions, remembered on this device only. */
export function useSuggestionDismissals(): { dismissed: DismissalState; dismiss: (key: string) => void } {
  const [dismissed, setDismissed] = useState<DismissalState>({});

  useEffect(() => {
    queueMicrotask(() => setDismissed(readDismissals()));
  }, []);

  const dismiss = useCallback((key: string) => {
    setDismissed((current) => {
      const next = dismissSuggestion(current, key, new Date());
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Private mode only means the suggestion may come back sooner.
      }
      return next;
    });
  }, []);

  return { dismissed, dismiss };
}
