'use client';

import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { localDayKey } from '@/lib/habit-fire';
import { newHabitLimit } from '@/lib/habit-programs/config';
import { childAgeYears, summarizeChildHabits } from '@/lib/habit-programs/summary';
import { buildWeeklyReview } from '@/lib/habit-programs/weekly-review';
import { getParentTodayCopy } from '@/lib/i18n/parent-today-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { HelpTip } from '@/components/help/HelpTip';
import dynamic from 'next/dynamic';
import { defaultExperienceFlags } from '@/lib/experience-flags';

const WeeklySummaryButton = dynamic(() => import('./ai/WeeklySummaryButton').then((module) => module.WeeklySummaryButton), { ssr: false });

/** A five-minute weekly look back for one child: one thing to praise, one to adjust, and whether to wait before adding a habit. */
export function WeeklyReviewCard({ childId }: { readonly childId: string }) {
  const { profiles, activities, logs, experience, familyPausePeriods } = useAppStore();
  const { language } = useTranslation();
  const copy = getParentTodayCopy(language);
  const child = profiles.find((profile) => profile.id === childId);
  if (!child) return null;

  const today = localDayKey(new Date());
  const summary = summarizeChildHabits({ child, activities, logs, experience, pausePeriods: familyPausePeriods, today });
  if (summary.habits.length === 0) return null;
  const review = buildWeeklyReview(summary.habits, newHabitLimit(childAgeYears(child, today)));
  // Counts only, added up over the habits by week: no habit name and no child name can reach the AI.
  const byWeek = new Map<string, { alone: number; prompted: number; together: number; unknown: number; missed: number }>();
  for (const habit of summary.habits) {
    for (const week of habit.trend) {
      const total = byWeek.get(week.weekStart) ?? { alone: 0, prompted: 0, together: 0, unknown: 0, missed: 0 };
      total.alone += week.alone; total.prompted += week.prompted; total.together += week.together; total.unknown += week.unknown; total.missed += week.missed;
      byWeek.set(week.weekStart, total);
    }
  }
  const summaryCounts = {
    weeks: [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, counts]) => counts),
    habitsBuilding: summary.habits.filter((habit) => habit.status === 'forming').length,
    habitsNeedingHelp: summary.habits.filter((habit) => habit.status === 'needs-help').length,
    habitsSteady: summary.habits.filter((habit) => habit.status === 'steady').length,
  };
  const titleOf = (activityId: string) => {
    const activity = activities.find((candidate) => candidate.id === activityId);
    return activity ? localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language).title : '';
  };

  return (
    <details data-testid="weekly-review" className="group rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-extrabold text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-100">
        {copy.weeklyTitle}
        <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-90">▸</span>
      </summary>
      <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
        <div className="flex items-center gap-1"><p className="text-xs text-slate-500 dark:text-slate-300">{copy.weeklyIntro}</p><HelpTip topic="weekly.review" /></div>
        {review.next === 'unknown' ? <p>{copy.weeklyNoData}</p> : (
          <ul className="space-y-2">
            {review.praise && <li>{copy.weeklyPraise(titleOf(review.praise.activityId))}</li>}
            {review.adjust && <li>{copy.weeklyAdjust(titleOf(review.adjust.activityId))}</li>}
            <li>{review.next === 'add' ? copy.weeklyAdd : copy.weeklyHold}</li>
          </ul>
        )}
        {defaultExperienceFlags.parentAi && <WeeklySummaryButton counts={summaryCounts} />}
      </div>
    </details>
  );
}
