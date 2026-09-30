'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { localizeAgeAdaptedHabit } from '@/lib/i18n/age-habit-copy';
import { localizeDemoActivity } from '@/lib/i18n/demo-content-copy';
import { localDayKey } from '@/lib/habit-fire';
import { addDays } from '@/lib/habit-programs/opportunities';
import { selectSupportPromptItems } from '@/lib/habit-programs/parent-ui-state';
import { fillTemplate } from '@/lib/habit-programs/suggestion-display';
import type { SupportLevel } from '@/lib/habit-programs/types';

const LEVELS: readonly { level: SupportLevel; key: 'levelAlone' | 'levelPrompted' | 'levelTogether' }[] = [
  { level: 'alone', key: 'levelAlone' },
  { level: 'prompted', key: 'levelPrompted' },
  { level: 'together', key: 'levelTogether' },
];

/** Asks, with one tap and never as an obligation, how a planned habit was done today or yesterday. */
export function HabitSupportPrompt() {
  const { profiles, activities, logs, experience, recordHabitSupport } = useAppStore();
  const { language } = useTranslation();
  const copy = getHabitProgramsCopy(language);
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const [failedLogId, setFailedLogId] = useState<string | null>(null);

  const today = localDayKey(new Date());
  const yesterday = addDays(today, -1);
  const recorded = new Set(experience.supportObservations.map((row) => row.log_id));
  const planned = new Set(experience.cuePlans.map((plan) => `${plan.child_id}:${plan.activity_id}`));

  const items = selectSupportPromptItems(logs, { planned, recorded, saved, today, yesterday });
  if (items.length === 0) return null;

  const choose = async (logId: string, level: SupportLevel) => {
    setFailedLogId(null);
    const ok = await recordHabitSupport(logId, level);
    if (ok) setSaved((previous) => new Set(previous).add(logId));
    else setFailedLogId(logId);
  };

  return (
    <section data-testid="habit-support-prompt" aria-labelledby="habit-support-title" className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <h3 id="habit-support-title" className="text-base font-extrabold text-slate-800 dark:text-slate-100">{copy.supportTitle}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-300">{copy.supportIntro}</p>
        <p data-testid="self-report-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-300">{copy.parentSelfReportHint}</p>
      </div>
      <ul className="space-y-3">
        {items.map((log) => {
          const activity = activities.find((candidate) => candidate.id === log.activityId);
          const child = profiles.find((profile) => profile.id === log.childId);
          if (!activity || !child) return null;
          const title = localizeAgeAdaptedHabit(localizeDemoActivity(activity, language), language).title;
          const isSaved = saved.has(log.id);
          return (
            <li key={log.id} data-log-id={log.id} className="space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-zinc-800/60">
              <p id={`support-question-${log.id}`} className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                {fillTemplate(copy.supportQuestion, { day: log.date === today ? copy.supportDayToday : copy.supportDayYesterday, child: child.nickname || child.name, habit: title })}
              </p>
              {isSaved ? (
                <p role="status" className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  <Check className="h-4 w-4" aria-hidden="true" />{copy.supportSaved}
                </p>
              ) : (
                <div role="group" aria-labelledby={`support-question-${log.id}`} className="flex flex-wrap gap-2">
                  {LEVELS.map(({ level, key }) => (
                    <button
                      key={level}
                      type="button"
                      data-level={level}
                      onClick={() => void choose(log.id, level)}
                      className="min-h-11 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                    >
                      {copy[key]}
                    </button>
                  ))}
                </div>
              )}
              {failedLogId === log.id && <p role="alert" className="text-xs font-bold text-rose-600">{copy.supportFailed}</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
