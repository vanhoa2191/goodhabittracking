'use client';

import { useEffect } from 'react';
import { setInstallPrompt } from '@/lib/pwa-install';
import type { InstallPrompt } from '@/lib/pwa-install';

export function PwaRuntime() {
  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    const pwaEnabled = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_PWA_DEV === 'true';
    if (pwaEnabled && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    return () => window.removeEventListener('beforeinstallprompt', capturePrompt);
  }, []);
  return null;
}
