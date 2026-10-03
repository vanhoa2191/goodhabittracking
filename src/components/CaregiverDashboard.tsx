'use client';

import { CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getCaregiverCopy } from '@/lib/i18n/caregiver-copy';
import { summarizeChildDayProgress, type DayProgress } from '@/lib/caregiver-day-progress';

/** The sentence is the accessible name and also what people read; the bar only repeats it visually. */
function ProgressRow({ progress, text, noneText }: { readonly progress: DayProgress; readonly text: string; readonly noneText: string }) {
  if (progress.due === 0) return <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{noneText}</p>;
  const percent = Math.round((progress.done / progress.due) * 100);
  return (
    <div>
      <p className="break-words text-sm font-bold text-slate-900 dark:text-white">{text}</p>
      <div
        role="progressbar"
        aria-label={text}
        aria-valuemin={0}
        aria-valuemax={progress.due}
        aria-valuenow={progress.done}
        aria-valuetext={text}
        className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700"
      >
        <div className="h-full rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function CaregiverDashboard() {
  const { caregiverProgress } = useAppStore();
  const profiles = caregiverProgress?.profiles ?? [];
  const activities = caregiverProgress?.activities ?? [];
  const { language } = useTranslation();
  const copy = getCaregiverCopy(language);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6" aria-labelledby="caregiver-title">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-700 to-violet-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Eye aria-hidden="true" /></span>
          <div>
            <h1 id="caregiver-title" className="text-2xl font-black">{copy.dashTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-indigo-100">{copy.dashIntro}</p>
          </div>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200">{copy.dashEmpty}</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {profiles.map((profile) => {
            const profileActivities = activities.filter((activity) => activity.child_id === null || activity.child_id === profile.id);
            const approved = caregiverProgress?.completionCounts.find((count) => count.child_id === profile.id)?.count ?? 0;
            const days = caregiverProgress ? summarizeChildDayProgress(caregiverProgress, profile.id) : null;
            return (
              <article key={profile.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="min-w-0 break-words text-xl font-black text-slate-900 dark:text-white">{profile.name}</h2>
                  <Sparkles aria-hidden="true" className="h-7 w-7 shrink-0 text-amber-500" />
                </div>
                {days && (
                  <div className="mt-4 space-y-3">
                    <ProgressRow progress={days.today} text={copy.dashToday(days.today.done, days.today.due)} noneText={copy.dashTodayNone} />
                    <ProgressRow progress={days.week} text={copy.dashWeek(days.week.done, days.week.due)} noneText={copy.dashWeekNone} />
                  </div>
                )}
                <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{copy.dashAllTime(approved)}</p>
                <ul className="mt-5 space-y-3" aria-label={copy.dashHabitsOf(profile.name)}>
                  {profileActivities.map((activity) => (
                    <li key={activity.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <div><p className="font-bold text-slate-900 dark:text-white">{activity.title}</p>{activity.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activity.description}</p>}</div>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
