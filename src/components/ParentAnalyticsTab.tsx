'use client';

import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { getParentSecondaryCopy } from '@/lib/i18n/parent-secondary-copy';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { ParentJournalPanel } from '@/components/ParentJournalPanel';
import { AchievementShareDialog } from '@/components/AchievementShareDialog';
import { localDayKey } from '@/lib/local-day';
import { PrintWeekButtons } from '@/components/PrintableWeek';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { InlineNotice, useNotice } from '@/components/ui/InlineNotice';
import { HelpTip } from '@/components/help/HelpTip';

const DELETE_FAMILY_PHRASE = 'DELETE FAMILY';

export function ParentAnalyticsTab() {
  const { logs, currentUser, logout } = useAppStore();
  const { t, language } = useTranslation();
  const copy = getParentSecondaryCopy(language);
  const [isDeletingFamily, setIsDeletingFamily] = useState(false);
  const { confirm, dialog } = useConfirm();
  const { notice, notify } = useNotice();

  const handleDeleteFamily = async () => {
    const confirmation = DELETE_FAMILY_PHRASE;
    if (!await confirm({ message: copy.deleteFamilyPrompt, confirmLabel: t.delete, destructive: true, requireText: confirmation })) return;

    setIsDeletingFamily(true);
    try {
      if (!currentUser) throw new Error(copy.deleteFamilyError);
      const response = await fetch('/api/family', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || copy.deleteFamilyError);
      }
      await logout();
      window.location.reload();
    } catch (error) {
      notify(error instanceof Error ? error.message : copy.deleteFamilyError, 'error');
      setIsDeletingFamily(false);
    }
  };

  return (
    <div className="space-y-6">
      {dialog}
      <InlineNotice notice={notice} />
      <h3 className="font-black text-lg text-slate-800 dark:text-slate-100">
        {t.analytics} ({copy.analyticsReport})
      </h3>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-1"><h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          {t.weeklyTrend}
        </h4><HelpTip topic="stats.weekly" /></div>
        <div className="mb-4 flex flex-wrap items-center gap-1"><PrintWeekButtons /><HelpTip topic="stats.print" /></div>

        <div role="group" aria-label={t.weeklyTrend} className="grid grid-cols-7 gap-2 pt-8 pb-2">
          {Array.from({ length: 7 }).map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dateKey = localDayKey(date);
            const count = logs.filter(
              (log) => log.date === dateKey && (log.status === 'completed' || log.status === 'approved')
            ).length;
            // A day with nothing done is an empty track, not a short bar that reads as some activity.
            const heightPercent = count === 0 ? 0 : Math.min(100, Math.max(12, count * 20));

            const dayName = new Intl.DateTimeFormat(language, { weekday: 'long' }).format(date);

            return (
              <div key={dateKey} role="img" aria-label={`${dayName}: ${count}`} className="flex flex-col items-center gap-2">
                <span className={`text-xs font-bold ${count > 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {count}
                </span>
                <div className="w-full h-32 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-end p-1">
                  <div
                    className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {defaultExperienceFlags.dailyJournal && <ParentJournalPanel />}

      <AchievementShareDialog />

      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950/30">
          <div className="flex items-center gap-1"><h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">{copy.deleteFamily}</h4><HelpTip topic="stats.deleteFamily" /></div>
          <p className="mt-1 text-xs leading-relaxed text-rose-700 dark:text-rose-300">
            {copy.deleteFamilyDescription}
          </p>
          <button
            type="button"
            onClick={() => void handleDeleteFamily()}
            disabled={isDeletingFamily}
            className="mt-4 min-h-11 rounded-xl bg-rose-700 px-4 text-xs font-bold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            {isDeletingFamily ? copy.deleteFamilyBusy : copy.deleteFamily}
          </button>
      </div>
    </div>
  );
}
