'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getHabitProgramsCopy } from '@/lib/i18n/habit-programs-copy';
import { localDayKey } from '@/lib/habit-fire';
import { childMaySelfReport } from '@/lib/habit-programs/child-view';
import { selectSupportPromptItems } from '@/lib/habit-programs/parent-ui-state';
import type { SupportLevel } from '@/lib/habit-programs/types';

const LEVELS: readonly { level: SupportLevel; key: 'childLevelAlone' | 'childLevelPrompted' | 'childLevelTogether' }[] = [
  { level: 'alone', key: 'childLevelAlone' },
  { level: 'prompted', key: 'childLevelPrompted' },
  { level: 'together', key: 'childLevelTogether' },
];

/** From 15 years old: one optional question about the habit just done. Skipping it costs nothing. */
export function ChildSelfReportPrompt() {
  const { activeChildId, profiles, logs, experience, recordHabitSupport } = useAppStore();
  const { language } = useTranslation();
  const copy = getHabitProgramsCopy(language);
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set());
  const [failedLogId, setFailedLogId] = useState<string | null>(null);

  const today = localDayKey(new Date());
  const child = profiles.find((profile) => profile.id === activeChildId);
  if (!child || !childMaySelfReport(child, today)) return null;

  const recorded = new Set(experience.supportObservations.map((row) => row.log_id));
  const planned = new Set(experience.cuePlans.map((plan) => `${plan.child_id}:${plan.activity_id}`));
  const own = logs.filter((log) => log.childId === child.id);
  const item = selectSupportPromptItems(own, { planned, recorded, saved, today, yesterday: today })
    .find((log) => saved.has(log.id) || !skipped.has(log.id));
  if (!item) return null;

  const choose = async (level: SupportLevel) => {
    setFailedLogId(null);
    const ok = await recordHabitSupport(item.id, level);
    if (ok) setSaved((previous) => new Set(previous).add(item.id));
    else setFailedLogId(item.id);
  };

  return (
    <section data-testid="child-self-report" aria-labelledby="child-self-report-title" className="space-y-2 rounded-2xl border border-indigo-100 bg-white p-4 dark:border-indigo-900/40 dark:bg-zinc-900">
      <p id="child-self-report-title" className="text-sm font-bold text-slate-800 dark:text-slate-100">{copy.childSelfReportTitle}</p>
      {saved.has(item.id) ? (
        <p role="status" className="flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
          <Check className="h-4 w-4" aria-hidden="true" />{copy.childSelfReportSaved}
        </p>
      ) : (
        <div role="group" aria-labelledby="child-self-report-title" className="flex flex-wrap gap-2">
          {LEVELS.map(({ level, key }) => (
            <button
              key={level}
              type="button"
              data-level={level}
              onClick={() => void choose(level)}
              className="min-h-11 rounded-xl border border-indigo-200 bg-white px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300"
            >
              {copy[key]}
            </button>
          ))}
          <button
            type="button"
            data-testid="child-self-report-skip"
            onClick={() => setSkipped((previous) => new Set(previous).add(item.id))}
            className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-zinc-800"
          >
            {copy.childSelfReportSkip}
          </button>
        </div>
      )}
      {failedLogId === item.id && <p role="alert" className="text-xs font-bold text-rose-600">{copy.supportFailed}</p>}
    </section>
  );
}
