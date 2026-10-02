'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Tone = 'success' | 'error';

/** A message that stays on the page where it belongs (instead of a native alert) and clears itself. */
export function useNotice(clearAfterMs = 6000): {
  readonly notice: { readonly message: string; readonly tone: Tone } | null;
  readonly notify: (message: string, tone?: Tone) => void;
  readonly clear: () => void;
} {
  const [notice, setNotice] = useState<{ readonly message: string; readonly tone: Tone } | null>(null);
  const timer = useRef<number | null>(null);
  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    setNotice(null);
  }, []);
  const notify = useCallback((message: string, tone: Tone = 'success') => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setNotice({ message, tone });
    timer.current = window.setTimeout(() => setNotice(null), clearAfterMs);
  }, [clearAfterMs]);
  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);
  return { notice, notify, clear };
}

export function InlineNotice({ notice }: { readonly notice: { readonly message: string; readonly tone: Tone } | null }) {
  if (!notice) return null;
  const error = notice.tone === 'error';
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${
        error
          ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
          : 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200'
      }`}
    >
      {notice.message}
    </p>
  );
}
