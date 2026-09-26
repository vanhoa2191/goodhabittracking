'use client';

import { useMemo } from 'react';
import { BookOpen, Download, ShieldCheck } from 'lucide-react';
import { createJournalCsv } from '@/lib/child-journal';
import { useTranslation } from '@/lib/i18n/context';
import { journalCopy } from '@/lib/i18n/journal-copy';
import { useAppStore } from '@/lib/store';

export function ParentJournalPanel() {
  const { experience, profiles } = useAppStore();
  const { language } = useTranslation();
  const copy = journalCopy[language];
  const childNames = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile.name])), [profiles]);
  const entries = useMemo(() => [...experience.journalEntries].sort((left, right) => (
    right.local_date.localeCompare(left.local_date) || right.updated_at.localeCompare(left.updated_at)
  )), [experience.journalEntries]);

  const exportJournal = () => {
    const csv = createJournalCsv(entries, childNames, copy.csv);
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kidhabit-child-journal.csv';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="parent-journal-title" className="rounded-3xl border border-sand-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
            <BookOpen aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h4 id="parent-journal-title" className="text-base font-extrabold text-sand-900 dark:text-slate-100">{copy.parentTitle}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.parentDescription}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={exportJournal}
          disabled={entries.length === 0}
          className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          {copy.export}
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-sand-50 px-4 py-5 text-sm font-semibold text-slate-700 dark:bg-zinc-800 dark:text-slate-300">{copy.empty}</p>
      ) : (
        <ol className="mt-5 space-y-3">
          {entries.map((entry) => (
            <li key={`${entry.child_id}:${entry.local_date}`} className="rounded-2xl border border-sand-100 bg-sand-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>{childNames.get(entry.child_id) ?? ''}</span>
                <time dateTime={entry.local_date}>{new Intl.DateTimeFormat(language, { dateStyle: 'medium' }).format(new Date(`${entry.local_date}T12:00:00`))}</time>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-sand-900 dark:text-slate-100">{entry.entry_text}</p>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-700 dark:text-slate-300">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>{copy.privacy}</span>
      </p>
    </section>
  );
}
