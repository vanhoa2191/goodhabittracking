'use client';

import { useMemo, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getIndependenceCopy } from '@/lib/i18n/independence-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { localDayKey } from '@/lib/habit-fire';
import { addDays } from '@/lib/habit-programs/opportunities';
import { summarizeChildHabits } from '@/lib/habit-programs/summary';
import type { HabitActivity } from '@/types';

const SEEN_KEY = 'kidhabit_independence_seen_v1';
const MAX_PRACTISING = 2;

function readSeen(): ReadonlySet<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

function rememberSeen(seen: ReadonlySet<string>): void {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    // Without storage the cheer may show again, which is harmless.
  }
}

function useTitleOf() {
  const { language } = useTranslation();
  return (activity: HabitActivity) => localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language).title;
}

/** For the child: the one or two habits being practised, and a single cheer for a first or a graduation, said once. */
export function KidIndependence({ childId }: { readonly childId: string }) {
  const { profiles, activities, logs, experience, familyPausePeriods } = useAppStore();
  const { language } = useTranslation();
  const copy = getIndependenceCopy(language);
  const titleOf = useTitleOf();
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => (typeof window === 'undefined' ? new Set() : readSeen()));
  const child = profiles.find((profile) => profile.id === childId);
  const today = localDayKey(new Date());

  const summary = useMemo(() => (
    child ? summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today }) : null
  ), [child, activities, logs, experience, familyPausePeriods, today]);
  if (!child || !summary) return null;

  const practising = summary.habits
    .filter((habit) => habit.evaluation.phase === 'anchor' || habit.evaluation.phase === 'build')
    .slice(0, MAX_PRACTISING)
    .flatMap((habit) => activities.find((activity) => activity.id === habit.activityId) ?? []);

  const cheers = [
    ...summary.habits.flatMap((habit) => {
      const activity = activities.find((candidate) => candidate.id === habit.activityId);
      return habit.milestone && activity ? [{ key: `${activity.id}:${habit.milestone.milestone}`, text: copy.milestone[habit.milestone.milestone](titleOf(activity)) }] : [];
    }),
    ...activities.flatMap((activity) => (
      activity.graduatedAt && !activity.isActive && (activity.childId === null || activity.childId === childId) && activity.graduatedAt.slice(0, 10) >= addDays(today, -2)
        ? [{ key: `${activity.id}:graduated`, text: `${copy.kidGraduatedTitle} ${titleOf(activity)}` }]
        : []
    )),
  ].filter((cheer) => !seen.has(cheer.key));
  const cheer = cheers[0];

  if (practising.length === 0 && !cheer) return null;
  return (
    <div data-testid="kid-independence" className="space-y-3">
      {cheer && (
        <div role="status" data-testid="kid-cheer" className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          <span>🌟 {cheer.text}</span>
          <button type="button" onClick={() => { const next = new Set(seen).add(cheer.key); rememberSeen(next); setSeen(next); }} className="min-h-11 shrink-0 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">OK</button>
        </div>
      )}
      {practising.length > 0 && (
        <div data-testid="kid-practising" className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">{copy.kidPracticeTitle}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {practising.map((activity) => (
              <li key={activity.id} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-800 dark:bg-zinc-900 dark:text-slate-100">{activity.icon} {titleOf(activity)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** What the child can already do alone: every graduated habit, only to look at. */
export function KidGraduatedList({ childId }: { readonly childId: string }) {
  const { activities } = useAppStore();
  const { language } = useTranslation();
  const copy = getIndependenceCopy(language);
  const titleOf = useTitleOf();
  const graduated = activities.filter((activity) => activity.graduatedAt && !activity.isActive && (activity.childId === null || activity.childId === childId));
  if (graduated.length === 0) return null;
  return (
    <details data-testid="kid-graduated" className="rounded-2xl border border-emerald-200 bg-white p-4 dark:border-emerald-900/50 dark:bg-zinc-900">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-extrabold text-emerald-900 dark:text-emerald-200">🏅 {copy.kidGraduatedTitle} ({graduated.length})</summary>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{copy.kidGraduatedBody}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {graduated.map((activity) => (
          <li key={activity.id} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">{activity.icon} {titleOf(activity)}</li>
        ))}
      </ul>
    </details>
  );
}
