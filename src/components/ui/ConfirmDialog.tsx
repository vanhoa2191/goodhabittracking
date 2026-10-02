'use client';

import { useCallback, useId, useRef, useState, type ReactNode } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { useTranslation } from '@/lib/i18n/context';
import { getDialogCopy } from '@/lib/i18n/dialog-copy';

export type ConfirmRequest = {
  readonly message: string;
  /** Names the action ("Delete") so the button never says just "OK". */
  readonly confirmLabel: string;
  readonly destructive?: boolean;
  /** When set, the confirm button stays off until the person types this phrase exactly. */
  readonly requireText?: string;
};

type Pending = ConfirmRequest & { readonly resolve: (confirmed: boolean) => void };

/**
 * An in-app replacement for window.confirm: it follows the theme, the language and the text size, the safe
 * choice (Cancel) comes first and holds the initial focus, and the question is a promise so a call site reads
 * `if (!await confirm({...})) return;`.
 */
export function useConfirm(): { readonly confirm: (request: ConfirmRequest) => Promise<boolean>; readonly dialog: ReactNode } {
  const { language } = useTranslation();
  const copy = getDialogCopy(language);
  const [pending, setPending] = useState<Pending | null>(null);
  const [typed, setTyped] = useState('');
  const pendingRef = useRef<Pending | null>(null);
  const titleId = useId();

  const settle = useCallback((confirmed: boolean) => {
    pendingRef.current?.resolve(confirmed);
    pendingRef.current = null;
    setPending(null);
    setTyped('');
  }, []);

  const confirm = useCallback((request: ConfirmRequest) => new Promise<boolean>((resolve) => {
    pendingRef.current?.resolve(false);
    const next = { ...request, resolve };
    pendingRef.current = next;
    setTyped('');
    setPending(next);
  }), []);

  const canConfirm = !pending?.requireText || typed === pending.requireText;

  const dialog = pending ? (
    <ModalShell isOpen label={copy.confirmTitle} titleId={titleId} onClose={() => settle(false)} maxWidth="sm" mobileSheet={false}>
      <div className="space-y-4 overflow-y-auto p-6">
        <h2 id={titleId} className="text-lg font-black text-slate-900 dark:text-white">{copy.confirmTitle}</h2>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{pending.message}</p>
        {pending.requireText && (
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {copy.typeToConfirm(pending.requireText)}
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </label>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => settle(false)}
            className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-600 dark:text-slate-100 dark:hover:bg-zinc-800"
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => settle(true)}
            className={`min-h-11 rounded-xl px-5 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              pending.destructive ? 'bg-rose-700 hover:bg-rose-800 focus-visible:ring-rose-500' : 'bg-indigo-700 hover:bg-indigo-800 focus-visible:ring-indigo-500'
            }`}
          >
            {pending.confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  ) : null;

  return { confirm, dialog };
}
