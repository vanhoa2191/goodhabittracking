'use client';

import { useEffect, useState } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { getReadAloudCopy } from '@/lib/i18n/read-aloud-copy';
import { canSpeak, speak, stopSpeaking } from '@/lib/speech';
import type { Language } from '@/types';

export function ReadAloudButton({ text, language }: { readonly text: string; readonly language: Language }) {
  const [available, setAvailable] = useState(false);
  const [reading, setReading] = useState(false);
  const copy = getReadAloudCopy(language);

  useEffect(() => {
    setAvailable(canSpeak());
    return () => stopSpeaking();
  }, []);

  if (!available) return null;

  const label = reading ? copy.stop : copy.read;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={reading}
      title={label}
      onClick={() => {
        if (reading) {
          stopSpeaking();
          setReading(false);
          return;
        }
        setReading(speak(text, language, undefined, () => setReading(false)));
      }}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-600 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-indigo-300 dark:hover:bg-zinc-800"
    >
      {reading ? <Square className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
