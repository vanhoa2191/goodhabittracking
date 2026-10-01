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
        <p className="text-xs text-slate-500 dark:text-slate-300">{copy.weeklyIntro}</p>
        {review.next === 'unknown' ? <p>{copy.weeklyNoData}</p> : (
          <ul className="space-y-2">
            {review.praise && <li>{copy.weeklyPraise(titleOf(review.praise.activityId))}</li>}
            {review.adjust && <li>{copy.weeklyAdjust(titleOf(review.adjust.activityId))}</li>}
            <li>{review.next === 'add' ? copy.weeklyAdd : copy.weeklyHold}</li>
          </ul>
        )}
      </div>
    </details>
  );
}
