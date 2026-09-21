'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { getSocialMutationCopy } from '@/lib/i18n/social-mutation-copy';
import { useModalFocus } from '@/lib/use-modal-focus';

type Props = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onJoin: (inviteCode: string) => Promise<boolean>;
};

export function JoinGroupModal({ isOpen, onClose, onJoin }: Props) {
  const { t, language } = useTranslation();
  const copy = getSocialMutationCopy(language);
  const [inviteCode, setInviteCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const close = useCallback(() => {
    if (!isSaving) onClose();
  }, [isSaving, onClose]);
  useModalFocus(isOpen, close);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!inviteCode.trim()) return;
    setIsSaving(true);
    setError('');
    const saved = await onJoin(inviteCode.trim());
    setIsSaving(false);
    if (!saved) {
      setError(copy.joinError);
      return;
    }
    setInviteCode('');
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs sm:backdrop-blur-sm p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-label={t.joinGroup} className="relative w-full max-w-sm max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 dark:border-zinc-800 my-auto overflow-hidden">
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2"><span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400"><Users className="w-4 h-4" /></span>{t.joinGroup}</h3>
          <button type="button" onClick={close} disabled={isSaving} className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:cursor-wait disabled:opacity-50" aria-label={t.close}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(event) => void submit(event)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300"><label htmlFor="group-invite-code">{copy.inviteCodeLabel}</label><input id="group-invite-code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} maxLength={32} placeholder={copy.inviteCodePlaceholder} className="mt-1.5 w-full py-3 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-center font-mono font-black tracking-widest text-lg text-indigo-600 uppercase" /></div>
          </div>
          <div className="shrink-0 p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/70 space-y-3 pb-safe">
            {error && <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            <div className="flex items-center justify-end gap-2.5"><button type="button" onClick={close} disabled={isSaving} className="min-h-11 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:cursor-wait disabled:opacity-50">{t.cancel}</button><button type="submit" disabled={isSaving} aria-busy={isSaving} className="min-h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:cursor-wait disabled:opacity-60">{isSaving ? copy.joining : t.confirm}</button></div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
