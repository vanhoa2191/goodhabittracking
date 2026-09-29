'use client';

import { useEffect } from 'react';
import { syncSessionHint } from '@/lib/session-hint';
import { useAppStore } from '@/lib/store';

// Tells the marketing site whether a parent is signed in, without sharing the session itself.
export function SessionHintSync() {
  const { currentUser, isEntryReady } = useAppStore();
  const signedIn = Boolean(currentUser);

  useEffect(() => {
    if (isEntryReady) syncSessionHint(signedIn);
  }, [isEntryReady, signedIn]);

  return null;
}
