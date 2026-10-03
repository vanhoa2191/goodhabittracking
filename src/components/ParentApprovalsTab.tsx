'use client';

import React from 'react';
import { Check, CheckCircle2, Gift, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { parentApprovalsCopy } from '@/lib/i18n/parent-approvals-copy';
import { ParentReminderBanner } from './ParentReminderBanner';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { HabitProgressSummary } from './HabitProgressSummary';
import { HabitSupportPrompt } from './HabitSupportPrompt';
import { ParentTodayCard } from './ParentTodayCard';
import { WeeklyReviewCard } from './WeeklyReviewCard';
import { getParentTodayCopy } from '@/lib/i18n/parent-today-copy';
import { HelpTip } from '@/components/help/HelpTip';
import { ParentActionStrip } from './ParentActionStrip';
import { BulkTaskReview } from './BulkTaskReview';
import { useParentReminderConsent } from '@/lib/parent-reminder-context';
import { appBadgeCount } from '@/lib/parent-actions';
import { useAppBadge } from '@/lib/use-app-badge';

export function ParentApprovalsTab({ onOpenHabits }: { readonly onOpenHabits?: () => void } = {}) {
  const {
    profiles,
    activities,
    logs,
    approveLog,
    rejectLog,
    rewards,
    redemptions,
    experience,
    deliverRedemption,
    rejectRedemption,
  } = useAppStore();
  const { t, language } = useTranslation();
  const copy = parentApprovalsCopy[language];
  const todayCopy = getParentTodayCopy(language);
  const [chosenChildId, setChosenChildId] = React.useState<string | null>(null);
  const focusChildId = profiles.some((profile) => profile.id === chosenChildId) ? chosenChildId! : (profiles[0]?.id ?? '');
  const pendingLogs = logs.filter((log) => log.status === 'pending_approval');
  const pendingRedemptions = redemptions.filter((redemption) => redemption.status === 'pending');
  const pendingCount = pendingLogs.length + pendingRedemptions.length;
  const familyPaused = Boolean(experience.settings?.paused_at);
  const dailyEase = defaultExperienceFlags.dailyEase;
  const { enabled: remindersOn } = useParentReminderConsent();
  useAppBadge(appBadgeCount({ pendingTasks: pendingLogs.length, pendingRewards: pendingRedemptions.length }), dailyEase && defaultExperienceFlags.parentReengagement && remindersOn && !familyPaused);

  return (
    <div className="space-y-6">
      {defaultExperienceFlags.parentReengagement && <ParentReminderBanner pendingCount={pendingCount} familyPaused={familyPaused} />}
      {profiles.length > 1 && (
        <div role="group" aria-label={todayCopy.chooseChild} className="flex flex-wrap gap-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              aria-pressed={focusChildId === profile.id}
              onClick={() => setChosenChildId(profile.id)}
              className={`min-h-11 rounded-full border px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${focusChildId === profile.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-slate-200'}`}
            >
              {profile.nickname || profile.name}
            </button>
          ))}
        </div>
      )}

      {focusChildId && <ParentTodayCard childId={focusChildId} />}

      {dailyEase
        ? <ParentActionStrip pendingTasks={pendingLogs.length} pendingRewards={pendingRedemptions.length} />
        : <h3 className="px-1 text-sm font-extrabold text-slate-600 dark:text-slate-300">{todayCopy.actionsTitle}</h3>}
      {defaultExperienceFlags.habitPrograms && <HabitSupportPrompt />}

      {dailyEase ? <BulkTaskReview /> : <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-1"><h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          {copy.pendingTasks} ({pendingLogs.length})
        </h3><HelpTip topic="approvals.tasks" /></div>
        {pendingLogs.length === 0 ? (
          <EmptyState icon={Inbox} title={copy.noPendingTasks} />
        ) : (
          <div className="space-y-3">
            {pendingLogs.map((log) => {
              const activity = activities.find((item) => item.id === log.activityId);
              const child = profiles.find((profile) => profile.id === log.childId);
              return (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activity?.icon || '✨'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{activity?.title}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">{child?.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{copy.rewardCompleted(activity?.points ?? 0, new Intl.DateTimeFormat(language).format(new Date(`${log.date}T00:00:00`)))}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => rejectLog(log.id)} className="min-h-11 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100">{t.reject}</button>
                    <button onClick={() => approveLog(log.id)} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700"><Check className="w-3.5 h-3.5" />{t.approve}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>}

      <div id="pending-rewards" tabIndex={-1} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 focus:outline-none">
        <div className="flex items-center gap-1"><h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-pink-600" />
          {copy.pendingRewards} ({pendingRedemptions.length})
        </h3><HelpTip topic="approvals.rewards" /></div>
        {pendingRedemptions.length === 0 ? (
          <EmptyState icon={Gift} title={copy.noPendingRewards} />
        ) : (
          <div className="space-y-3">
            {pendingRedemptions.map((redemption) => {
              const reward = rewards.find((item) => item.id === redemption.rewardId);
              const child = profiles.find((profile) => profile.id === redemption.childId);
              return (
                <div key={redemption.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{reward?.icon || '🎁'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{reward?.title}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">{child?.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{copy.redemptionRequested(redemption.pointsSpent, new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(new Date(redemption.requestedAt)))}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button onClick={() => rejectRedemption(redemption.id)} className="min-h-11 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100">{t.reject}</button>
                    <button onClick={() => deliverRedemption(redemption.id)} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-pink-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-pink-700"><Gift className="w-3.5 h-3.5" />{t.delivered}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {defaultExperienceFlags.habitPrograms && (
        <>
          <HabitProgressSummary childId={focusChildId || undefined} onOpenHabits={onOpenHabits} />
          {focusChildId && <WeeklyReviewCard childId={focusChildId} />}
        </>
      )}
    </div>
  );
}
