'use client';

import { useState, useSyncExternalStore } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getPwaInstallCopy } from '@/lib/i18n/pwa-install-copy';
import { getInstallPrompt, setInstallPrompt, subscribeInstallPrompt } from '@/lib/pwa-install';
import { HelpTip } from '@/components/help/HelpTip';

export function PwaInstallPanel() {
  const { language } = useTranslation();
  const copy = getPwaInstallCopy(language);
  const prompt = useSyncExternalStore(subscribeInstallPrompt, getInstallPrompt, () => null);
  const [showGuide, setShowGuide] = useState(false);
  const [notice, setNotice] = useState('');

  const install = async () => {
    if (!prompt) {
      setShowGuide(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setInstallPrompt(null);
    setNotice(choice.outcome === 'accepted' ? copy.accepted : copy.dismissed);
  };

  const refreshApp = async () => {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith('kidhabit-public-')).map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration('/');
      await registration?.update();
    }
    window.location.reload();
  };

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-6 dark:border-emerald-900 dark:bg-zinc-900" aria-labelledby="pwa-install-title">
      <div className="flex items-center gap-1"><h4 id="pwa-install-title" className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white"><Download className="h-5 w-5 text-emerald-600" aria-hidden="true" />{copy.title}</h4><HelpTip topic="settings.pwa" /></div>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{copy.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => void install()} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">{prompt ? copy.install : copy.guide}</button>
        <button type="button" onClick={() => void refreshApp()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 dark:border-zinc-700 dark:text-slate-200"><RefreshCw className="h-4 w-4" aria-hidden="true" />{copy.refresh}</button>
      </div>
      {showGuide && <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-zinc-800 dark:text-slate-200"><p><strong>iPhone/iPad:</strong>{copy.iosGuide}</p><p className="mt-2"><strong>Android:</strong>{copy.androidGuide}</p></div>}
      {notice && <p role="status" className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{notice}</p>}
    </section>
  );
}
