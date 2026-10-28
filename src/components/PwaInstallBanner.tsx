'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getPwaInstallCopy } from '@/lib/i18n/pwa-install-copy';
import { getInstallPrompt, setInstallPrompt, subscribeInstallPrompt } from '@/lib/pwa-install';

const DISMISS_KEY = 'kidhabit-pwa-banner-dismissed-at';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isSnoozed() {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

type Environment = 'ios' | 'other' | 'unavailable';

const subscribeNothing = () => () => {};
// A primitive snapshot keeps the store stable; it is read on the client only.
function readEnvironment(): Environment {
  if (isStandalone() || isSnoozed()) return 'unavailable';
  return isIos() ? 'ios' : 'other';
}

/** Visible install nudge: native prompt when the browser offers one, otherwise iOS Add to Home Screen steps. */
export function PwaInstallBanner() {
  const { language } = useTranslation();
  const copy = getPwaInstallCopy(language);
  const prompt = useSyncExternalStore(subscribeInstallPrompt, getInstallPrompt, () => null);
  const environment = useSyncExternalStore<Environment>(subscribeNothing, readEnvironment, () => 'unavailable');
  const [hidden, setHidden] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => {
    const installed = () => setHidden(true);
    window.addEventListener('appinstalled', installed);
    return () => window.removeEventListener('appinstalled', installed);
  }, []);

  if (environment === 'unavailable' || hidden || (!prompt && environment !== 'ios')) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* storage may be blocked */ }
    setHidden(true);
  };
  const install = async () => {
    if (!prompt) {
      setShowIosSteps(true);
      return;
    }
    await prompt.prompt();
    await prompt.userChoice;
    setInstallPrompt(null);
    setHidden(true);
  };

  return (
    <aside
      aria-label={copy.title}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg dark:border-emerald-800 dark:bg-zinc-900"
    >
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900 dark:text-white">{copy.title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{showIosSteps ? copy.iosHint : copy.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!showIosSteps && (
              <button type="button" onClick={() => void install()} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">
                {prompt ? copy.install : copy.guide}
              </button>
            )}
            <button type="button" onClick={dismiss} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 dark:border-zinc-700 dark:text-slate-200">
              {copy.later}
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label={copy.later} className="-m-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
