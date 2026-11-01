'use client';

import { Route } from 'lucide-react';
import {
  MOOD_VISUAL, NOTE_KIND_COPY, buildMoodTimeline, type SpaceSnapshot,
} from '@/lib/child-space';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

/** Read-only: thirty days of the child's own feelings, and the notes they wrote before today. */
export function MoodTimeline({ snapshot, localDay }: { snapshot: SpaceSnapshot; localDay: string }) {
  const { leading, cells } = buildMoodTimeline(snapshot.moods, localDay, 30);
  const pastNotes = snapshot.notes.filter((note) => note.local_date < localDay).slice(0, 12);
  return (
    <section aria-labelledby="journey-title" className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900" data-testid="mood-timeline">
      <h3 id="journey-title" className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-slate-100"><Route aria-hidden="true" className="h-4 w-4" /> Hành trình của bé</h3>
      <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">30 ngày gần đây</p>
      <ol className="mt-3 grid grid-cols-7 gap-1" aria-label="Cảm xúc 30 ngày gần đây" data-testid="mood-timeline-grid">
        {WEEKDAYS.map((name) => <li key={name} aria-hidden="true" className="text-center text-[11px] font-black text-slate-600 dark:text-slate-400">{name}</li>)}
        {Array.from({ length: leading }, (_, index) => <li key={`pad-${index}`} aria-hidden="true" />)}
        {cells.map(({ day, mood }) => (
          <li key={day} data-testid={`timeline-${day}`} className={`flex h-11 flex-col items-center justify-center rounded-lg text-[10px] font-semibold leading-tight ${mood ? MOOD_VISUAL[mood].tone : 'bg-slate-50 text-slate-500 dark:bg-zinc-800 dark:text-slate-400'} ${day === localDay ? 'ring-2 ring-indigo-500' : ''}`}>
            <span aria-hidden="true" className="text-base leading-none">{mood ? MOOD_VISUAL[mood].emoji : '·'}</span>
            <span className="sr-only">{day}: {mood ? MOOD_VISUAL[mood].label : 'chưa chọn'}</span>
            <span aria-hidden="true">{day.slice(8)}</span>
          </li>
        ))}
      </ol>
      {pastNotes.length > 0 && (
        <details className="mt-3" data-testid="past-notes">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-black text-slate-900 dark:text-slate-100">Những điều con đã ghi ({pastNotes.length})</summary>
          <ul className="space-y-2">
            {pastNotes.map((note) => (
              <li key={`${note.local_date}:${note.kind}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:bg-zinc-800 dark:text-slate-100">
                <span className="block text-xs font-bold text-slate-600 dark:text-slate-400">{note.local_date.slice(8)}/{note.local_date.slice(5, 7)} · {NOTE_KIND_COPY[note.kind].label}</span>
                {note.note_text}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
