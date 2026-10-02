'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { getPublicErrorCopy } from '@/lib/i18n/public-error-copy';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { language } = useTranslation();
  const copy = getPublicErrorCopy(language);
  useEffect(() => {
    console.error('ui_boundary', { digest: error.digest ?? 'unavailable' });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-black">{copy.title}</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {copy.description}
      </p>
      <code className="rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-zinc-800">{error.digest ?? 'LOCAL-ERROR'}</code>
      <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700">
        {copy.retry}
      </button>
    </main>
  );
}
