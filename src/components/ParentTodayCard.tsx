'use client';

import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { localDayKey } from '@/lib/habit-fire';
import { isActivityDueOn } from '@/lib/habit-programs/opportunities';
import { getParentTodayCopy } from '@/lib/i18n/parent-today-copy';
import { MascotAvatar } from './MascotAvatar';

/** How the chosen child's day is going: tasks done of the tasks scheduled, and a streak that never scolds. */
export function ParentTodayCard({ childId }: { readonly childId: string }) {
  const { profiles, activities, logs } = useAppStore();
  const { language } = useTranslation();
  const copy = getParentTodayCopy(language);
  const child = profiles.find((profile) => profile.id === childId);
  if (!child) return null;

  const today = localDayKey(new Date());
  const scheduled = activities.filter((activity) => (
    activity.isActive && (activity.childId === null || activity.childId === child.id) && isActivityDueOn(activity, today)
  ));
  const done = scheduled.filter((activity) => logs.some((log) => (
    log.childId === child.id && log.activityId === activity.id && log.date === today
    && (log.status === 'completed' || log.status === 'approved' || log.status === 'pending_approval')
  ))).length;
  const percent = scheduled.length === 0 ? 0 : Math.round((100 * done) / scheduled.length);

  return (
    <section data-testid="parent-today-card" aria-labelledby="parent-today-title" className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MascotAvatar avatar={child.avatar} alt="" className="h-12 w-12 text-3xl" />
          <div>
            <h3 id="parent-today-title" className="text-sm font-semibold text-slate-500 dark:text-slate-300">{copy.todayOf(child.nickname || child.name)}</h3>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{scheduled.length === 0 ? copy.noTasksToday : copy.doneOfTotal(done, scheduled.length)}</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500 dark:text-slate-300">
          <p className="font-bold text-slate-700 dark:text-slate-100">{copy.streak(child.streak)}</p>
          <p>{copy.streakNote}</p>
        </div>
      </div>
      {scheduled.length > 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800" role="progressbar" aria-label={copy.doneOfTotal(done, scheduled.length)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
        </div>
      )}
    </section>
  );
}
