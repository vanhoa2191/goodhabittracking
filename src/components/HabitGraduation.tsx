'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getIndependenceCopy } from '@/lib/i18n/independence-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { localDayKey } from '@/lib/habit-fire';
import { isGraduationCheckDue, nextGraduationCheck } from '@/lib/habit-programs/graduation';
import { isSuggestionHidden } from '@/lib/habit-programs/suggestion-display';
import { nextLowerStarStep, restoreStarStep } from '@/lib/habit-programs/star-step';
import { summarizeChildHabits } from '@/lib/habit-programs/summary';
import { useSuggestionDismissals } from '@/lib/habit-programs/use-suggestion-dismissals';
import type { ChildProfile, HabitActivity } from '@/types';
import { HelpTip } from '@/components/help/HelpTip';

const button = 'min-h-11 rounded-xl border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
const primary = `${button} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700`;
const quiet = `${button} border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200 dark:hover:bg-zinc-800`;

function useHabitTitle() {
  const { language } = useTranslation();
  return (activity: HabitActivity) => localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language).title;
}

type GraduationItem = { readonly child: ChildProfile; readonly activity: HabitActivity };

/** Habits ready to be suggested for graduation, and graduated habits whose monthly check has come. */
export function useGraduationItems(): { readonly ready: readonly GraduationItem[]; readonly rechecks: readonly GraduationItem[] } {
  const { profiles, activities, logs, experience, familyPausePeriods } = useAppStore();
  const { dismissed } = useSuggestionDismissals();
  const now = new Date();
  const today = localDayKey(now);
  const ready = profiles.flatMap((child) => {
    const summary = summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today });
    return summary.habits.flatMap((habit) => {
      const activity = activities.find((candidate) => candidate.id === habit.activityId);
      // A task shared by several children cannot graduate for one of them without leaving the others' lists.
      if (!activity || (activity.childId === null && profiles.length > 1) || !habit.readyToGraduate || isSuggestionHidden(dismissed, `${child.id}:${activity.id}:graduate`, now)) return [];
      return [{ child, activity }];
    });
  });
  const rechecks = activities.flatMap((activity) => {
    if (!activity.graduatedAt || !isGraduationCheckDue(activity.graduationCheckDue, today)) return [];
    const child = profiles.find((candidate) => activity.childId === null || candidate.id === activity.childId);
    return child ? [{ child, activity }] : [];
  });
  return { ready, rechecks };
}

/** Ready and due habits, each with the one-tap choices the parent makes. */
export function GraduationPrompts() {
  const { updateActivity } = useAppStore();
  const { language } = useTranslation();
  const copy = getIndependenceCopy(language);
  const titleOf = useHabitTitle();
  const { dismiss } = useSuggestionDismissals();
  const { ready, rechecks } = useGraduationItems();
  const [message, setMessage] = useState<{ readonly text: string; readonly undo?: () => Promise<boolean>; readonly failed?: boolean } | null>(null);
  const today = localDayKey(new Date());

  const run = async (success: string, changes: Partial<HabitActivity>, undo?: Partial<HabitActivity>, id?: string) => {
    const ok = id ? await updateActivity(id, changes) : false;
    setMessage(ok
      ? { text: success, undo: undo && id ? () => updateActivity(id, undo).then((restored) => { if (restored) setMessage(null); return restored; }) : undefined }
      : { text: copy.failed, failed: true });
  };

  if (ready.length === 0 && rechecks.length === 0 && !message) return null;

  return (
    <div data-testid="graduation-prompts" className="space-y-2">
      {ready.map(({ child, activity }) => {
        const name = child.nickname || child.name;
        const lower = nextLowerStarStep(activity.points, activity.basePoints);
        return (
          <div key={activity.id} data-graduation="ready" className="space-y-2 rounded-2xl bg-white p-3 text-sm text-slate-700 dark:bg-zinc-900 dark:text-slate-200">
            <p className="flex items-start gap-1">{copy.readyToGraduate(name, titleOf(activity))}<HelpTip topic="progress.graduation" /></p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primary} onClick={() => void run(
                copy.graduatedNotice(titleOf(activity)),
                { isActive: false, graduatedAt: new Date().toISOString(), graduationCheckDue: nextGraduationCheck(today) },
                { isActive: true, graduatedAt: null, graduationCheckDue: null },
                activity.id,
              )}>{copy.graduate}</button>
              {lower && (
                <button type="button" className={quiet} onClick={() => void run(
                  copy.starsReduced(titleOf(activity), lower.points),
                  { points: lower.points, basePoints: lower.basePoints },
                  { points: activity.points, basePoints: activity.basePoints ?? null },
                  activity.id,
                )}>{copy.reduceStars(activity.points, lower.points)}</button>
              )}
              <button type="button" className={quiet} onClick={() => dismiss(`${child.id}:${activity.id}:graduate`)}>{copy.keepAsIs}</button>
            </div>
          </div>
        );
      })}
      {rechecks.map(({ child, activity }) => (
        <div key={activity.id} data-graduation="recheck" className="space-y-2 rounded-2xl bg-white p-3 text-sm text-slate-700 dark:bg-zinc-900 dark:text-slate-200">
          <p>{copy.recheck(child.nickname || child.name, titleOf(activity))}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => void run(copy.stillAlone, { graduationCheckDue: nextGraduationCheck(today) }, undefined, activity.id)}>{copy.stillAlone}</button>
            <button type="button" className={quiet} onClick={() => void run(copy.bringBack, { isActive: true, graduatedAt: null, graduationCheckDue: null }, undefined, activity.id)}>{copy.bringBack}</button>
          </div>
        </div>
      ))}
      {message && (
        <p role={message.failed ? 'alert' : 'status'} className={`flex flex-wrap items-center gap-2 text-sm font-bold ${message.failed ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
          {message.text}
          {message.undo && <button type="button" className={quiet} onClick={() => void message.undo?.()}>{copy.undo}</button>}
        </p>
      )}
    </div>
  );
}

/** What the child can do alone now, with a way back and a way to give the stars back. */
export function GraduatedHabitsList({ childId }: { readonly childId?: string }) {
  const { activities, updateActivity } = useAppStore();
  const { language } = useTranslation();
  const copy = getIndependenceCopy(language);
  const titleOf = useHabitTitle();
  const graduated = activities.filter((activity) => activity.graduatedAt && (!childId || activity.childId === null || activity.childId === childId));
  if (graduated.length === 0) return null;
  return (
    <section data-testid="graduated-habits" aria-labelledby="graduated-title" className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <h4 id="graduated-title" className="text-sm font-black text-emerald-900 dark:text-emerald-200">{copy.graduatedTitle}</h4>
      <ul className="space-y-2">
        {graduated.map((activity) => {
          const restore = restoreStarStep(activity.points, activity.basePoints);
          return (
            <li key={activity.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-800 dark:text-slate-100">
              <span>{activity.icon} {titleOf(activity)} <span className="text-xs text-slate-600 dark:text-slate-300">{copy.graduatedSince(localDayKey(new Date(activity.graduatedAt ?? '')))}</span></span>
              <span className="flex flex-wrap gap-2">
                {restore && <button type="button" className={quiet} onClick={() => void updateActivity(activity.id, { points: restore.points, basePoints: null })}>{copy.restoreStars(restore.points)}</button>}
                <button type="button" className={quiet} onClick={() => void updateActivity(activity.id, { isActive: true, graduatedAt: null, graduationCheckDue: null })}>{copy.bringBack}</button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
