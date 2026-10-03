'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getCoachCopy } from '@/lib/i18n/coach-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { localDayKey } from '@/lib/habit-fire';
import { addDays, weekStart } from '@/lib/habit-programs/opportunities';
import { childAgeYears } from '@/lib/habit-programs/summary';
import type { HabitActivity } from '@/types';
import { HelpTip } from '@/components/help/HelpTip';

const MAX_OFFERED = 4;
const MAX_FOCUS = 2;
const FOCUS_MIN_AGE = 6;

function useTitleOf() {
  const { language } = useTranslation();
  return (activity: HabitActivity) => localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language).title;
}

/** Days out of the last seven on which the child did this task. */
export function daysDoneOfSeven(activityId: string, childId: string, logs: readonly { activityId: string; childId: string; date: string; status: string }[], today: string): number {
  const days = new Set(Array.from({ length: 7 }, (_, index) => addDays(today, -index)));
  const done = new Set(logs
    .filter((log) => log.activityId === activityId && log.childId === childId && days.has(log.date) && ['completed', 'approved', 'pending_approval'].includes(log.status))
    .map((log) => log.date));
  return done.size;
}

/** For a parent: which tasks the child may choose from, and, for a young child, the choice made together. */
export function WeeklyFocusParent({ childId }: { readonly childId: string }) {
  const { profiles, activities, experience, updateActivity, chooseWeeklyFocus } = useAppStore();
  const { language } = useTranslation();
  const copy = getCoachCopy(language);
  const titleOf = useTitleOf();
  const [saved, setSaved] = useState<'ok' | 'failed' | null>(null);
  const child = profiles.find((profile) => profile.id === childId);
  const today = localDayKey(new Date());
  if (!child) return null;
  const week = weekStart(today);
  const own = activities.filter((activity) => activity.isActive && (activity.childId === null || activity.childId === childId));
  if (own.length === 0) return null;
  const offered = own.filter((activity) => activity.offeredForFocus);
  const current = experience.weeklyFocus.find((row) => row.child_id === childId && row.week_start === week);
  const young = childAgeYears(child, today) < FOCUS_MIN_AGE;

  const toggleFocus = async (activityId: string) => {
    const base = current?.activity_ids ?? [];
    const next = base.includes(activityId) ? base.filter((id) => id !== activityId) : [...base, activityId].slice(-MAX_FOCUS);
    setSaved((await chooseWeeklyFocus(childId, week, next)) ? 'ok' : 'failed');
  };

  return (
    <section data-testid="weekly-focus-parent" aria-labelledby="weekly-focus-title" className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center gap-1"><h3 id="weekly-focus-title" className="text-base font-extrabold text-slate-800 dark:text-slate-100">{copy.focusTitle}</h3><HelpTip topic="coach.weeklyFocus" /></div>
        <p className="text-xs text-slate-600 dark:text-slate-300">{copy.focusIntro}</p>
      </div>
      <ul className="space-y-1">
        {own.map((activity) => (
          <li key={activity.id}>
            <label className="flex min-h-11 items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
              <input
                type="checkbox"
                className="h-5 w-5 accent-indigo-600"
                checked={Boolean(activity.offeredForFocus)}
                disabled={!activity.offeredForFocus && offered.length >= MAX_OFFERED}
                onChange={(event) => void updateActivity(activity.id, { offeredForFocus: event.target.checked })}
                aria-label={copy.offer(titleOf(activity))}
              />
              <span>{activity.icon} {titleOf(activity)}</span>
            </label>
          </li>
        ))}
      </ul>
      {young && offered.length > 0 && (
        <fieldset className="space-y-1">
          <legend className="text-sm font-bold text-slate-700 dark:text-slate-200">{copy.pickFocus(child.nickname || child.name)}</legend>
          {offered.map((activity) => (
            <label key={activity.id} className="flex min-h-11 items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
              <input type="checkbox" className="h-5 w-5 accent-indigo-600" checked={Boolean(current?.activity_ids.includes(activity.id))} onChange={() => void toggleFocus(activity.id)} />
              <span>{activity.icon} {titleOf(activity)}</span>
            </label>
          ))}
        </fieldset>
      )}
      {saved && <p role={saved === 'ok' ? 'status' : 'alert'} className={`text-sm font-bold ${saved === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600'}`}>{saved === 'ok' ? copy.focusSaved : copy.failed}</p>}
    </section>
  );
}

/** For the child: pick one or two of the offered tasks as this week's focus, then follow x/7 days. */
export function KidWeeklyFocus({ childId }: { readonly childId: string }) {
  const { profiles, activities, logs, experience, chooseWeeklyFocus } = useAppStore();
  const { language } = useTranslation();
  const copy = getCoachCopy(language);
  const titleOf = useTitleOf();
  const [picked, setPicked] = useState<readonly string[]>([]);
  const [editing, setEditing] = useState(false);
  const [failed, setFailed] = useState(false);
  const child = profiles.find((profile) => profile.id === childId);
  const today = localDayKey(new Date());
  if (!child) return null;
  const week = weekStart(today);
  const offered = activities.filter((activity) => activity.isActive && activity.offeredForFocus && (activity.childId === null || activity.childId === childId));
  const current = experience.weeklyFocus.find((row) => row.child_id === childId && row.week_start === week);
  const chosen = offered.filter((activity) => current?.activity_ids.includes(activity.id));
  const canPick = childAgeYears(child, today) >= FOCUS_MIN_AGE;

  if (chosen.length > 0 && !editing) {
    return (
      <section data-testid="kid-weekly-focus" className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
        <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">🎯 {copy.kidFocusTitle}</h3>
        <ul className="mt-2 space-y-1">
          {chosen.map((activity) => (
            <li key={activity.id} className="flex items-center justify-between gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
              <span>{activity.icon} {titleOf(activity)}</span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs dark:bg-zinc-900">{copy.kidFocusProgress(daysDoneOfSeven(activity.id, childId, logs, today))}</span>
            </li>
          ))}
        </ul>
        {canPick && <button type="button" onClick={() => { setPicked(chosen.map((activity) => activity.id)); setEditing(true); }} className="mt-2 min-h-11 text-xs font-bold text-indigo-700 underline dark:text-indigo-300">{copy.kidFocusChange}</button>}
      </section>
    );
  }
  if (!canPick || offered.length === 0) return null;

  return (
    <section data-testid="kid-weekly-focus-picker" className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <h3 className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">🎯 {copy.kidFocusTitle}</h3>
      <p className="text-xs text-slate-700 dark:text-slate-200">{copy.kidFocusPick}</p>
      <ul className="flex flex-wrap gap-2">
        {offered.map((activity) => {
          const on = picked.includes(activity.id);
          return (
            <li key={activity.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={!on && picked.length >= MAX_FOCUS}
                onClick={() => setPicked((previous) => on ? previous.filter((id) => id !== activity.id) : [...previous, activity.id])}
                className={`min-h-11 rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-100'}`}
              >
                {activity.icon} {titleOf(activity)}
              </button>
            </li>
          );
        })}
      </ul>
      {picked.length >= MAX_FOCUS && <p className="text-xs text-slate-600 dark:text-slate-300">{copy.kidFocusMax}</p>}
      {failed && <p role="alert" className="text-xs font-bold text-rose-600">{copy.failed}</p>}
      <button
        type="button"
        disabled={picked.length === 0}
        onClick={() => void chooseWeeklyFocus(childId, week, picked).then((ok) => { setFailed(!ok); if (ok) setEditing(false); })}
        className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        {copy.kidFocusSave}
      </button>
    </section>
  );
}
