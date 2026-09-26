'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { z } from 'zod';
import { AppStoreProvider } from '@/lib/store';
import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase/browser';

const consentResponse = z.strictObject({ enabled: z.boolean() });

type AnalyticsConsentState = {
  readonly displayedEnabled: boolean;
  readonly committedEnabled: boolean;
};

type AnalyticsConsentAction =
  | { readonly type: 'loaded' | 'save-succeeded'; readonly enabled: boolean }
  | { readonly type: 'save-started'; readonly enabled: boolean }
  | { readonly type: 'save-failed'; readonly previous: AnalyticsConsentState };

export function reduceAnalyticsConsent(state: AnalyticsConsentState, action: AnalyticsConsentAction): AnalyticsConsentState {
  switch (action.type) {
    case 'loaded':
    case 'save-succeeded':
      return { displayedEnabled: action.enabled, committedEnabled: action.enabled };
    case 'save-started':
      return {
        displayedEnabled: action.enabled,
        committedEnabled: action.enabled ? state.committedEnabled : false,
      };
    case 'save-failed':
      return action.previous;
  }
}

type AnalyticsConsentContextValue = {
  readonly enabled: boolean;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly hasError: boolean;
  readonly save: (enabled: boolean) => Promise<void>;
};

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue | null>(null);

export function AnalyticsConsentProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const canPersistConsent = isSupabaseConfigured();
  const [consent, dispatch] = useReducer(reduceAnalyticsConsent, { displayedEnabled: false, committedEnabled: false });
  const [isLoading, setIsLoading] = useState(canPersistConsent);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!canPersistConsent) return;

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    const controller = new AbortController();
    void supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!session || controller.signal.aborted) return null;
        return fetch('/api/privacy/analytics-consent', { signal: controller.signal });
      })
      .then(async (response) => {
        if (!response) return { enabled: false };
        if (!response.ok) return null;
        const parsed = consentResponse.safeParse(await response.json());
        return parsed.success ? parsed.data : null;
      })
      .then((result) => {
        if (!result) setHasError(true);
        else dispatch({ type: 'loaded', enabled: result.enabled });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        if (!(error instanceof Error)) throw error;
        setHasError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [canPersistConsent]);

  const save = useCallback(async (nextEnabled: boolean) => {
    if (!canPersistConsent) return;

    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setHasError(true);
      return;
    }

    const previous = consent;
    dispatch({ type: 'save-started', enabled: nextEnabled });
    setIsSaving(true);
    setHasError(false);
    try {
      const response = await fetch('/api/privacy/analytics-consent', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const parsed = consentResponse.safeParse(await response.json());
      if (!response.ok || !parsed.success) {
        dispatch({ type: 'save-failed', previous });
        setHasError(true);
        return;
      }
      dispatch({ type: 'save-succeeded', enabled: parsed.data.enabled });
    } catch (error: unknown) {
      if (!(error instanceof Error)) throw error;
      dispatch({ type: 'save-failed', previous });
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  }, [canPersistConsent, consent]);

  const value = useMemo(() => ({ enabled: consent.displayedEnabled, isLoading, isSaving, hasError, save }), [consent.displayedEnabled, hasError, isLoading, isSaving, save]);
  return (
    <AnalyticsConsentContext.Provider value={value}>
      <AppStoreProvider analyticsOptIn={consent.committedEnabled}>{children}</AppStoreProvider>
    </AnalyticsConsentContext.Provider>
  );
}

export function useAnalyticsConsent(): AnalyticsConsentContextValue {
  const context = useContext(AnalyticsConsentContext);
  if (!context) throw new Error('useAnalyticsConsent must be used within AnalyticsConsentProvider.');
  return context;
}
