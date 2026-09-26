'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Save, ShieldCheck } from 'lucide-react';
import { JOURNAL_TEXT_MAX_LENGTH, normalizeJournalText } from '@/lib/child-journal';
import type { JournalEntry } from '@/lib/child-journal';
import { localDayKey } from '@/lib/habit-fire';
import { useTranslation } from '@/lib/i18n/context';
import { journalCopy } from '@/lib/i18n/journal-copy';
import { useAppStore } from '@/lib/store';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function DailyJournalCard() {
  const { activeChild, experience, saveJournalEntry } = useAppStore();
  const date = localDayKey(new Date());
  const savedEntry = experience.journalEntries.find((entry) => (
    entry.child_id === activeChild?.id && entry.local_date === date
  ));
  if (!activeChild) return null;

  return <DailyJournalEditor key={`${activeChild.id}:${date}`} date={date} savedEntry={savedEntry} saveJournalEntry={saveJournalEntry} />;
}

function DailyJournalEditor({ date, savedEntry, saveJournalEntry }: {
  date: string;
  savedEntry: JournalEntry | undefined;
  saveJournalEntry: (date: string, text: string) => Promise<boolean>;
}) {
  const { language } = useTranslation();
  const copy = journalCopy[language];
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? savedEntry?.entry_text ?? '';
  const [saveState, setSaveState] = useState<SaveState>(savedEntry ? 'saved' : 'idle');
  const normalized = useMemo(() => normalizeJournalText(text), [text]);
  const characterCount = Array.from(text).length;

  const save = async () => {
    if (!normalized) return;
    setSaveState('saving');
    const saved = await saveJournalEntry(date, normalized);
    if (saved) setDraft(null);
    setSaveState(saved ? 'saved' : 'error');
  };

  return (
    <section aria-labelledby="daily-journal-title" className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-50 p-5 shadow-sm dark:border-amber-900/60 dark:from-zinc-900 dark:via-amber-950/20 dark:to-zinc-900">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-amber-100 p-2.5 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
          <BookOpen aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 id="daily-journal-title" className="text-base font-extrabold text-sand-900 dark:text-slate-100">{copy.childTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{copy.childDescription}</p>
        </div>
      </div>

      <label htmlFor="daily-journal-input" className="mt-4 block text-sm font-bold text-sand-900 dark:text-slate-100">{copy.inputLabel}</label>
      <textarea
        id="daily-journal-input"
        rows={2}
        value={text}
        onChange={(event) => {
          if (Array.from(event.target.value).length > JOURNAL_TEXT_MAX_LENGTH) return;
          setDraft(event.target.value);
          setSaveState('idle');
        }}
        placeholder={copy.placeholder}
        className="mt-2 min-h-20 w-full resize-y rounded-2xl border border-amber-200 bg-white px-4 py-3 text-base text-sand-900 outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{copy.count(characterCount, JOURNAL_TEXT_MAX_LENGTH)}</span>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!normalized || normalized === savedEntry?.entry_text || saveState === 'saving'}
          className="flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {saveState === 'saving' ? copy.saving : copy.save}
        </button>
      </div>
      <p className={`mt-3 text-sm font-semibold ${saveState === 'error' ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`} role={saveState === 'error' ? 'alert' : 'status'}>
        {saveState === 'saved' ? copy.saved : saveState === 'error' ? copy.error : ''}
      </p>
      <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-700 dark:text-slate-300">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>{copy.privacy}</span>
      </p>
    </section>
  );
}
