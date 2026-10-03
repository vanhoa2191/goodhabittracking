'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getCoachCopy } from '@/lib/i18n/coach-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { localDayKey } from '@/lib/habit-fire';
import { chooseWeeklyChange, openTries, triesToReview, type HabitForCoach, type TryOutcome, type TryRecord, type WeeklyChange } from '@/lib/habit-programs/coach';
import { revertChanges, smallerVersionFor } from '@/lib/habit-programs/smaller-version';
import { summarizeChildHabits } from '@/lib/habit-programs/summary';
import { formatMinute, suggestTimeOfDay } from '@/lib/habit-programs/time-suggestion';
import type { HabitActivity } from '@/types';
import { HelpTip } from '@/components/help/HelpTip';
import { useStartChange } from './use-start-change';

const button = 'min-h-11 rounded-xl border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
const primary = `${button} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`;
const quiet = `${button} border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800`;

/** One change at a time: the single idea worth a week's try, the tries running, and the answer to "did it help?". */
export function WeeklyCoachCard({ childId, onOpenHabits }: { readonly childId: string; readonly onOpenHabits?: () => void }) {
  const { profiles, activities, logs, experience, familyPausePeriods, updateActivity, resolveHabitTry } = useAppStore();
  const { language } = useTranslation();
  const copy = getCoachCopy(language);
  const startChange = useStartChange();
  const [message, setMessage] = useState<{ readonly text: string; readonly failed?: boolean } | null>(null);
  const child = profiles.find((profile) => profile.id === childId);
  const today = localDayKey(new Date());
  if (!child) return null;

  const titleOf = (activity: HabitActivity | undefined) => (
    activity ? localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language).title : ''
  );
  const activityOf = (id: string) => activities.find((candidate) => candidate.id === id);
  const summary = summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today });
  const habits: HabitForCoach[] = summary.habits.map((habit) => {
    const activity = activityOf(habit.activityId);
    return {
      childId,
      activityId: habit.activityId,
      suggestions: habit.suggestions.map((suggestion) => suggestion.code),
      timeSuggestion: activity ? suggestTimeOfDay(activity, childId, logs, today) : null,
    };
  });
  const tries: readonly TryRecord[] = experience.habitTries;
  const own = tries.filter((entry) => entry.child_id === childId);
  const change = chooseWeeklyChange(childId, habits, tries, today);
  const running = openTries(own, today);
  const toReview = triesToReview(own, today);
  if (!change && running.length === 0 && toReview.length === 0 && !message) return null;

  const start = async (wanted: WeeklyChange) => {
    const started = await startChange(wanted.activityId, childId, wanted.kind);
    setMessage(started ? { text: copy.started } : { text: copy.failed, failed: true });
    if (started && wanted.kind === 'cue_change') onOpenHabits?.();
  };

  const answer = async (entry: TryRecord, outcome: TryOutcome) => {
    const activity = activityOf(entry.activity_id);
    // A change that did not help is undone first; if that cannot be saved the try stays open so nothing is stuck halfway.
    if (outcome !== 'helped' && activity) {
      const changes = revertChanges(activity, entry, smallerVersionFor(activity.frameworkHabitId, language));
      if (changes && !(await updateActivity(activity.id, changes))) {
        setMessage({ text: copy.failed, failed: true });
        return;
      }
    }
    const saved = await resolveHabitTry(entry.id, outcome);
    if (!saved) setMessage({ text: copy.failed, failed: true });
  };

  const usable = change && (change.kind !== 'smaller' || smallerVersionFor(activityOf(change.activityId)?.frameworkHabitId, language));
  const timeText = change?.kind === 'retime' && activityOf(change.activityId)
    ? (() => {
        const suggestion = suggestTimeOfDay(activityOf(change.activityId) as HabitActivity, childId, logs, today);
        return suggestion ? copy.whyBetterTime(titleOf(activityOf(change.activityId)), formatMinute(suggestion.medianMinute)) : '';
      })()
    : '';

  return (
    <section data-testid="weekly-coach" aria-labelledby="weekly-coach-title" className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <div className="flex items-center gap-1"><h3 id="weekly-coach-title" className="text-base font-extrabold text-slate-800 dark:text-slate-100">{copy.title}</h3><HelpTip topic="coach.weeklyChange" /></div>
        <p className="text-xs text-slate-600 dark:text-slate-300">{copy.intro}</p>
      </div>
      {toReview.map((entry) => (
        <div key={entry.id} data-coach="review" className="space-y-2 rounded-2xl bg-slate-50 p-3 text-sm dark:bg-zinc-800/60">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{copy.review(titleOf(activityOf(entry.activity_id)), copy.kindName[entry.kind])}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => void answer(entry, 'helped')}>{copy.helped}</button>
            <button type="button" className={quiet} onClick={() => void answer(entry, 'not_yet')}>{copy.notYet}</button>
            <button type="button" className={quiet} onClick={() => void answer(entry, 'dropped')}>{copy.dropped}</button>
          </div>
          {(entry.kind === 'smaller' || entry.kind === 'retime') && <p className="text-xs text-slate-600 dark:text-slate-300">{copy.backToFull}</p>}
        </div>
      ))}
      {running.map((entry) => (
        <p key={entry.id} data-coach="running" className="rounded-2xl bg-indigo-50 p-3 text-sm text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100">
          {copy.running(titleOf(activityOf(entry.activity_id)), copy.kindName[entry.kind], entry.ends_on)}
        </p>
      ))}
      {change && usable && (
        <div data-coach="suggestion" data-kind={change.kind} className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p>{copy.change[change.kind](titleOf(activityOf(change.activityId)))}</p>
          {timeText && <p className="text-xs">{timeText}</p>}
          <button type="button" className={primary} onClick={() => void start(change)}>{copy.tryIt}</button>
        </div>
      )}
      {message && <p role={message.failed ? 'alert' : 'status'} className={`text-sm font-bold ${message.failed ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>{message.text}</p>}
    </section>
  );
}
