'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Check, CheckCircle2, Gift, Inbox, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { parentApprovalsCopy } from '@/lib/i18n/parent-approvals-copy';
import { getParentActionsCopy } from '@/lib/i18n/parent-actions-copy';
import { ParentReminderBanner } from './ParentReminderBanner';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { HabitProgressSummary } from './HabitProgressSummary';
import { HabitSupportPrompt } from './HabitSupportPrompt';
import { ParentTodayCard } from './ParentTodayCard';
import { WeeklyReviewCard } from './WeeklyReviewCard';
import { getParentTodayCopy } from '@/lib/i18n/parent-today-copy';
import { HelpTip } from '@/components/help/HelpTip';
import { useParentReminderConsent } from '@/lib/parent-reminder-context';
import { appBadgeCount } from '@/lib/parent-actions';
import { useAppBadge } from '@/lib/use-app-badge';

// Loaded on demand with the flag, so the first download does not grow for families that do not use them.
const ParentActionStrip = dynamic(() => import('./ParentActionStrip').then((module) => module.ParentActionStrip), { ssr: false });
const WeeklyCoachCard = dynamic(() => import('./WeeklyCoachCard').then((module) => module.WeeklyCoachCard), { ssr: false });
const WeeklyFocusParent = dynamic(() => import('./WeeklyFocus').then((module) => module.WeeklyFocusParent), { ssr: false });
const BulkTaskReview = dynamic(() => import('./BulkTaskReview').then((module) => module.BulkTaskReview), { ssr: false });

/** The badge that names both queues as spanning the whole family, so a count is never read as one child's. */
const scopeBadgeClass = 'rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';

type QueueTone = 'ok' | 'error' | 'warn';
type QueueMessage = {
  readonly text: string;
  readonly tone: QueueTone;
  /** Set when the state shown on screen could not be refreshed after the command, so the row offers a reload. */
  readonly refresh?: boolean;
};

function OutcomeLine({ message, testId, refreshTestId, refreshLabel, onRefresh, refreshing }: {
  readonly message: QueueMessage;
  readonly testId: string;
  readonly refreshTestId: string;
  readonly refreshLabel: string;
  readonly onRefresh: () => void;
  readonly refreshing: boolean;
}) {
  const toneClass = message.tone === 'error'
    ? 'text-rose-600'
    : message.tone === 'warn'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-emerald-700 dark:text-emerald-300';
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <p role={message.tone === 'error' ? 'alert' : 'status'} data-testid={testId} className={`text-sm font-bold ${toneClass}`}>{message.text}</p>
      {message.refresh && (
        <button
          type="button"
          data-testid={refreshTestId}
          disabled={refreshing}
          onClick={onRefresh}
          className="flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {refreshLabel}
        </button>
      )}
    </div>
  );
}

export function ParentApprovalsTab({ onOpenHabits }: { readonly onOpenHabits?: () => void } = {}) {
  const {
    profiles,
    activities,
    logs,
    reviewLogs,
    rewards,
    redemptions,
    experience,
    deliverRedemption,
    rejectRedemption,
    syncNow,
    isReviewBlocked,
    isRedemptionBlocked,
  } = useAppStore();
  const { t, language } = useTranslation();
  const copy = parentApprovalsCopy[language];
  const actions = getParentActionsCopy(language);
  const todayCopy = getParentTodayCopy(language);
  const [chosenChildId, setChosenChildId] = React.useState<string | null>(null);
  const focusChildId = profiles.some((profile) => profile.id === chosenChildId) ? chosenChildId! : (profiles[0]?.id ?? '');
  const pendingLogs = logs.filter((log) => log.status === 'pending_approval');
  // Approved-but-undelivered requests still wait on a parent, so they stay in the queue with a label that says so.
  const queueRedemptions = redemptions.filter((redemption) => redemption.status === 'pending' || redemption.status === 'approved');
  const pendingCount = pendingLogs.length + queueRedemptions.length;
  const familyPaused = Boolean(experience.settings?.paused_at);
  const dailyEase = defaultExperienceFlags.dailyEase;
  const { enabled: remindersOn } = useParentReminderConsent();
  useAppBadge(appBadgeCount({ pendingTasks: pendingLogs.length, pendingRewards: queueRedemptions.length }), dailyEase && defaultExperienceFlags.parentReengagement && remindersOn && !familyPaused);

  const taskFocusRef = React.useRef<HTMLDivElement>(null);
  const rewardsFocusRef = React.useRef<HTMLDivElement>(null);
  // A ref decides, not the rendered state: a second tap in the same frame must not fire a second command.
  const inlineBusyRef = React.useRef(false);
  const rewardBusyRef = React.useRef(false);
  const [inlineBusyIds, setInlineBusyIds] = React.useState<ReadonlySet<string>>(new Set());
  const [rewardBusy, setRewardBusy] = React.useState(false);
  const [taskMessage, setTaskMessage] = React.useState<QueueMessage | null>(null);
  const [rewardMessage, setRewardMessage] = React.useState<QueueMessage | null>(null);

  const visibleTaskMessage: QueueMessage | null = taskMessage ?? (inlineBusyIds.size === 0 && pendingLogs.some((log) => isReviewBlocked(log.id))
    ? { text: actions.reviewedStale, tone: 'warn', refresh: true } : null);
  const visibleRewardMessage: QueueMessage | null = rewardMessage ?? (!rewardBusy && queueRedemptions.some((row) => isRedemptionBlocked(row.id))
    ? { text: actions.reviewedStale, tone: 'warn', refresh: true } : null);

  const reviewSingle = async (logId: string, decision: 'approve' | 'reject') => {
    if (inlineBusyRef.current || isReviewBlocked(logId)) return;
    inlineBusyRef.current = true;
    setInlineBusyIds(new Set([logId]));
    setTaskMessage(null);
    try {
      const outcome = await reviewLogs([logId], decision);
      if (!outcome) {
        setTaskMessage({ text: actions.reviewFailed, tone: 'error' });
        return;
      }
      const parts = [
        outcome.approved > 0 ? actions.reviewedApproved(outcome.approved) : '',
        outcome.rejected > 0 ? actions.reviewedRejected(outcome.rejected) : '',
        outcome.skipped > 0 ? actions.reviewedSkipped(outcome.skipped) : '',
      ].filter(Boolean);
      const uncertain = (outcome.unresolvedIds?.length ?? 0) > 0;
      setTaskMessage({ text: [parts.join(' '), uncertain ? actions.reviewUnconfirmed : '', outcome.stale ? actions.reviewedStale : ''].filter(Boolean).join(' '),
        tone: uncertain || outcome.stale ? 'warn' : 'ok', refresh: outcome.stale });
      taskFocusRef.current?.focus();
    } finally {
      inlineBusyRef.current = false;
      setInlineBusyIds(new Set());
    }
  };

  const runRedemption = async (redemptionId: string, requested: 'deliver' | 'reject') => {
    if (rewardBusyRef.current || isRedemptionBlocked(redemptionId)) return;
    rewardBusyRef.current = true;
    setRewardBusy(true);
    setRewardMessage(null);
    try {
      const outcome = requested === 'deliver'
        ? await deliverRedemption(redemptionId)
        : await rejectRedemption(redemptionId);
      const stale = outcome.refresh === 'stale';
      let text: string;
      let tone: QueueTone;
      if (outcome.command === 'failed') {
        text = outcome.unfulfilled
          ? copy.deliveryUnfulfilled
          : requested === 'reject' ? actions.reviewFailed : copy.deliveryFailed;
        tone = 'error';
      } else if (outcome.command === 'invalid_transition' || outcome.command === 'unknown') {
        text = actions.reviewUnconfirmed;
        tone = 'warn';
      } else if (outcome.command === 'delivered') {
        text = stale ? copy.deliveredStale : copy.deliveredDone;
        tone = stale ? 'warn' : 'ok';
      } else if (outcome.command === 'rejected') {
        text = stale ? `${copy.rejectedDone} ${actions.reviewedStale}` : copy.rejectedDone;
        tone = stale ? 'warn' : 'ok';
      } else {
        text = copy.approvedAwaitingDelivery;
        tone = 'ok';
      }
      setRewardMessage({ text, tone, refresh: stale });
      if (outcome.command === 'delivered' || outcome.command === 'rejected') {
        rewardsFocusRef.current?.focus();
      }
    } finally {
      rewardBusyRef.current = false;
      setRewardBusy(false);
    }
  };

  const refreshQueue = async (queue: 'tasks' | 'rewards') => {
    const lock = queue === 'tasks' ? inlineBusyRef : rewardBusyRef;
    if (lock.current) return;
    lock.current = true;
    if (queue === 'rewards') setRewardBusy(true);
    else setInlineBusyIds(new Set(pendingLogs.map((log) => log.id)));
    try {
      const synced = await syncNow();
      const setMessage = queue === 'tasks' ? setTaskMessage : setRewardMessage;
      setMessage({ text: synced ? actions.refreshed : actions.reviewedStale, tone: synced ? 'ok' : 'warn', refresh: !synced });
      (queue === 'tasks' ? taskFocusRef : rewardsFocusRef).current?.focus();
    } finally {
      lock.current = false;
      if (queue === 'rewards') setRewardBusy(false);
      else setInlineBusyIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      {defaultExperienceFlags.parentReengagement && <ParentReminderBanner pendingCount={pendingCount} familyPaused={familyPaused} />}

      <section data-testid="parent-family-inbox" aria-labelledby="parent-family-inbox-title" className="space-y-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-1">
          <h2 id="parent-family-inbox-title" className="min-w-0 break-words text-lg font-extrabold text-slate-800 dark:text-slate-100">{copy.inboxTitle}</h2>
          <div className="flex items-center gap-2">
            <span data-testid="parent-inbox-count" className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">{pendingCount}</span>
            <span data-testid="approvals-scope-label" className={scopeBadgeClass}>{copy.allChildrenScope}</span>
          </div>
        </div>
        {pendingCount === 0 && (
          <div data-testid="parent-inbox-empty" className="rounded-3xl border border-slate-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">{copy.inboxEmptyBody}</p>
            {onOpenHabits && (
              <button
                type="button"
                onClick={onOpenHabits}
                className="mt-3 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {t.manageHabits}
              </button>
            )}
          </div>
        )}

      {dailyEase ? <BulkTaskReview /> : <div id="pending-tasks" ref={taskFocusRef} tabIndex={-1} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 focus:outline-none">
        <div className="flex flex-wrap items-start gap-1"><h3 className="mb-4 flex min-w-0 flex-wrap items-center gap-2 text-base font-extrabold text-slate-800 dark:text-slate-100">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-indigo-600" />
          <span className="min-w-0 break-words">{copy.pendingTasks} ({pendingLogs.length})</span>
          <span data-testid="approvals-scope-label" className={scopeBadgeClass}> — {copy.allChildrenScope}</span>
        </h3><HelpTip topic="approvals.tasks" /></div>
        {pendingLogs.length === 0 ? (
          <EmptyState icon={Inbox} title={copy.noPendingTasks} />
        ) : (
          <div className="space-y-3">
            {pendingLogs.map((log) => {
              const activity = activities.find((item) => item.id === log.activityId);
              const child = profiles.find((profile) => profile.id === log.childId);
              const busy = inlineBusyIds.has(log.id);
              const disabled = busy || isReviewBlocked(log.id);
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
                    <button disabled={disabled} onClick={() => void reviewSingle(log.id, 'reject')} className="min-h-11 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50">{t.reject}</button>
                    <button disabled={disabled} onClick={() => void reviewSingle(log.id, 'approve')} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-800 disabled:opacity-50"><Check className="w-3.5 h-3.5" />{busy ? actions.reviewing : t.approve}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {visibleTaskMessage && <OutcomeLine message={visibleTaskMessage} testId="inline-review-result" refreshTestId="inline-review-refresh" refreshLabel={actions.refreshList} onRefresh={() => void refreshQueue('tasks')} refreshing={inlineBusyIds.size > 0} />}
      </div>}

      <div id="pending-rewards" ref={rewardsFocusRef} tabIndex={-1} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 focus:outline-none">
        <div className="flex flex-wrap items-start gap-1"><h3 className="mb-4 flex min-w-0 flex-wrap items-center gap-2 text-base font-extrabold text-slate-800 dark:text-slate-100">
          <Gift className="w-5 h-5 shrink-0 text-pink-600" />
          <span className="min-w-0 break-words">{copy.pendingRewards} ({queueRedemptions.length})</span>
          <span data-testid="approvals-scope-label" className={scopeBadgeClass}> — {copy.allChildrenScope}</span>
        </h3><HelpTip topic="approvals.rewards" /></div>
        {queueRedemptions.length === 0 ? (
          <EmptyState icon={Gift} title={copy.noPendingRewards} />
        ) : (
          <div className="space-y-3">
            {queueRedemptions.map((redemption) => {
              const reward = rewards.find((item) => item.id === redemption.rewardId);
              const child = profiles.find((profile) => profile.id === redemption.childId);
              const awaiting = redemption.status === 'approved';
              return (
                <div key={redemption.id} data-testid={`redemption-row-${redemption.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{reward?.icon || '🎁'}</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{reward?.title}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">{child?.name}</span>
                        {awaiting && <span data-testid="redemption-awaiting" className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">{copy.approvedAwaitingDelivery}</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{copy.redemptionRequested(redemption.pointsSpent, new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(new Date(redemption.requestedAt)))}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button disabled={rewardBusy || isRedemptionBlocked(redemption.id)} onClick={() => void runRedemption(redemption.id, 'reject')} className="min-h-11 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50">{t.reject}</button>
                    <button disabled={rewardBusy || isRedemptionBlocked(redemption.id)} onClick={() => void runRedemption(redemption.id, 'deliver')} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-pink-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-pink-700 disabled:opacity-50"><Gift className="w-3.5 h-3.5" />{rewardBusy ? actions.reviewing : t.delivered}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {visibleRewardMessage && <OutcomeLine message={visibleRewardMessage} testId="reward-result" refreshTestId="reward-refresh" refreshLabel={actions.refreshList} onRefresh={() => void refreshQueue('rewards')} refreshing={rewardBusy} />}
      </div>

        {dailyEase
          ? <ParentActionStrip pendingTasks={pendingLogs.length} pendingRewards={queueRedemptions.length} />
          : <h3 className="px-1 text-sm font-extrabold text-slate-600 dark:text-slate-300">{todayCopy.actionsTitle}</h3>}
        {defaultExperienceFlags.habitPrograms && <HabitSupportPrompt />}
      </section>

      <section data-testid="parent-child-summary" aria-labelledby="parent-child-summary-title" aria-describedby="parent-summary-scope-note" className="space-y-4">
        <div className="px-1">
          <h2 id="parent-child-summary-title" className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{todayCopy.summaryTitle}</h2>
          <p id="parent-summary-scope-note" data-testid="parent-summary-scope-note" className="text-xs text-slate-500 dark:text-slate-300">{todayCopy.summaryScopeNote}</p>
        </div>
        {profiles.length > 1 && (
          <div role="group" aria-label={todayCopy.overviewOfChild} className="flex flex-wrap gap-2">
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

        {defaultExperienceFlags.habitPrograms && (
          <>
            <HabitProgressSummary childId={focusChildId || undefined} onOpenHabits={onOpenHabits} />
            {focusChildId && <WeeklyReviewCard childId={focusChildId} />}
            {focusChildId && defaultExperienceFlags.habitCoach && <WeeklyCoachCard childId={focusChildId} onOpenHabits={onOpenHabits} />}
            {focusChildId && defaultExperienceFlags.habitCoach && <WeeklyFocusParent childId={focusChildId} />}
          </>
        )}
      </section>
    </div>
  );
}
