'use client';

import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getFamilyDataCopy } from '@/lib/i18n/family-data-copy';
import { localDayKey } from '@/lib/habit-fire';

type Message = { readonly kind: 'ok' | 'error'; readonly text: string } | null;

/** Lets a parent take a copy of the family's data and, when the data lives on this device, restore one. */
export function FamilyDataCard() {
  const { exportFamilyBackup, canImportFamilyBackup, importFamilyBackup } = useAppStore();
  const { language } = useTranslation();
  const copy = getFamilyDataCopy(language);
  const [message, setMessage] = useState<Message>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const download = () => {
    try {
      const url = URL.createObjectURL(new Blob([exportFamilyBackup()], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `kidhabit-family-${localDayKey(new Date())}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage({ kind: 'ok', text: copy.exportDone });
    } catch {
      setMessage({ kind: 'error', text: copy.exportFailed });
    }
  };

  const restore = async () => {
    const file = pendingFile;
    setPendingFile(null);
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    try {
      const ok = importFamilyBackup(await file.text());
      setMessage(ok ? { kind: 'ok', text: copy.importDone } : { kind: 'error', text: copy.importInvalid });
    } catch {
      setMessage({ kind: 'error', text: copy.importInvalid });
    }
  };

  return (
    <section data-testid="family-data" className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900" aria-labelledby="family-data-title">
      <h4 id="family-data-title" className="text-base font-extrabold text-sand-900 dark:text-slate-100">{copy.title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.intro}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.private}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" data-testid="family-data-export" onClick={download} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <Download aria-hidden="true" className="h-4 w-4" />{copy.exportButton}
        </button>
        {canImportFamilyBackup && (
          <>
            <input ref={fileInput} type="file" accept="application/json,.json" data-testid="family-data-file" className="sr-only" tabIndex={-1} aria-label={copy.importButton} onChange={(event) => setPendingFile(event.target.files?.[0] ?? null)} />
            <button type="button" data-testid="family-data-import" onClick={() => fileInput.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40">
              <Upload aria-hidden="true" className="h-4 w-4" />{copy.importButton}
            </button>
          </>
        )}
      </div>
      {pendingFile && (
        <div role="alertdialog" aria-labelledby="family-data-confirm" data-testid="family-data-confirm" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p id="family-data-confirm" className="text-sm font-semibold text-slate-800 dark:text-slate-100">{copy.importWarning}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" data-testid="family-data-confirm-yes" onClick={() => void restore()} className="min-h-11 rounded-xl bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">{copy.importConfirm}</button>
            <button type="button" onClick={() => { setPendingFile(null); if (fileInput.current) fileInput.current.value = ''; }} className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold dark:border-zinc-600">{copy.importCancel}</button>
          </div>
        </div>
      )}
      {!canImportFamilyBackup && <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">{copy.importCloudNote}</p>}
      {message && <p role={message.kind === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm font-semibold ${message.kind === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{message.text}</p>}
    </section>
  );
}
