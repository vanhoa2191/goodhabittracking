'use client';

import React from 'react';
import { Check, Inbox, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { parentApprovalsCopy } from '@/lib/i18n/parent-approvals-copy';
import { getParentActionsCopy } from '@/lib/i18n/parent-actions-copy';
import { MAX_BATCH_REVIEW } from '@/lib/domain/commands';
import { groupPendingByChild, selectAllPending, toggleSelection } from '@/lib/parent-actions';
import { HelpTip } from '@/components/help/HelpTip';

/** The badge that names this queue as spanning the whole family, so its count is never read as one child's. */
const scopeBadgeClass = 'rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';

/** The waiting tasks, with tick boxes: nothing is ticked at first, and one PIN covers the whole batch. */
export function BulkTaskReview() {
  const { profiles, activities, logs, reviewLogs, syncNow, isReviewBlocked, parentReviewSelection: selected, setParentReviewSelection: setSelected } = useAppStore();
  const { t, language } = useTranslation();
  const copy = parentApprovalsCopy[language];
  const actions = getParentActionsCopy(language);
  const pendingLogs = logs.filter((log) => log.status === 'pending_approval');
  const pendingIds = pendingLogs.map((log) => log.id);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ readonly text: string; readonly failed: boolean; readonly refresh?: boolean } | null>(null);
  // A ref decides, not the rendered state: a double click must not start a second batch.
  const busyRef = React.useRef(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // A tick on a log that is no longer waiting (reviewed elsewhere) is ignored here, so it never reaches a command.
  const chosen = pendingLogs.filter((log) => selected.has(log.id));
  const visibleMessage = message ?? (!busy && pendingLogs.some((log) => isReviewBlocked(log.id))
    ? { text: actions.reviewedStale, failed: true, refresh: true } : null);
  const blocked = chosen.some((log) => isReviewBlocked(log.id));
  const names = groupPendingByChild(chosen, profiles).map((group) => `${group.childName} (${group.count})`).join(', ');
  const allSelected = pendingIds.length > 0 && pendingIds.slice(0, MAX_BATCH_REVIEW).every((id) => selected.has(id));

  const review = async (decision: 'approve' | 'reject') => {
    if (busyRef.current || chosen.length === 0 || chosen.some((log) => isReviewBlocked(log.id))) return;
    busyRef.current = true;
    setBusy(true);
    setMessage(null);
    try {
      const outcome = await reviewLogs(chosen.map((log) => log.id), decision);
      if (!outcome) {
        setMessage({ text: actions.reviewFailed, failed: true });
        return;
      }
      const parts = [
        outcome.approved > 0 ? actions.reviewedApproved(outcome.approved) : '',
        outcome.rejected > 0 ? actions.reviewedRejected(outcome.rejected) : '',
        outcome.skipped > 0 ? actions.reviewedSkipped(outcome.skipped) : '',
      ].filter(Boolean);
      const stale = outcome.stale === true;
      const uncertain = (outcome.unresolvedIds?.length ?? 0) > 0;
      setMessage({
        text: [parts.join(' '), uncertain ? actions.reviewUnconfirmed : '', stale ? actions.reviewedStale : ''].filter(Boolean).join(' '),
        failed: uncertain,
        refresh: stale,
      });
      const acknowledged = new Set(outcome.acknowledgedIds);
      setSelected((previous) => new Set([...previous].filter((id) => !acknowledged.has(id))));
      containerRef.current?.focus();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const refresh = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const synced = await syncNow();
      setMessage({ text: synced ? actions.refreshed : actions.reviewedStale, failed: !synced, refresh: !synced });
      containerRef.current?.focus();
    } finally { busyRef.current = false; setBusy(false); }
  };

  return (
    <div id="pending-tasks" ref={containerRef} tabIndex={-1} className="rounded-3xl border border-slate-100 bg-white p-6 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start gap-1">
        <h3 className="mb-4 flex min-w-0 flex-wrap items-center gap-2 text-base font-extrabold text-slate-800 dark:text-slate-100">
          <span className="min-w-0 break-words">{copy.pendingTasks} ({pendingLogs.length})</span>
          <span data-testid="approvals-scope-label" className={scopeBadgeClass}> — {copy.allChildrenScope}</span>
        </h3>
        <HelpTip topic="approvals.tasks" />
      </div>
      {pendingLogs.length === 0 ? (
        <EmptyState icon={Inbox} title={copy.noPendingTasks} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="bulk-select-all"
              disabled={busy}
              onClick={() => setSelected(allSelected ? new Set() : selectAllPending(pendingIds.filter((id) => !isReviewBlocked(id)), MAX_BATCH_REVIEW))}
              className="min-h-11 rounded-xl border border-indigo-200 px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            >
              {allSelected ? actions.clearSelection : actions.selectAll}
            </button>
            {pendingLogs.length > MAX_BATCH_REVIEW && <span className="text-xs text-slate-500 dark:text-slate-300">{actions.limitNote(MAX_BATCH_REVIEW)}</span>}
          </div>
          <ul className="space-y-3">
            {pendingLogs.map((log) => {
              const activity = activities.find((item) => item.id === log.activityId);
              const child = profiles.find((profile) => profile.id === log.childId);
              const checked = selected.has(log.id);
              return (
                <li key={log.id} className={`flex items-center gap-3 rounded-2xl border p-4 ${checked ? 'border-indigo-300 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-950/30' : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy || isReviewBlocked(log.id) || (!checked && chosen.length >= MAX_BATCH_REVIEW)}
                    onChange={() => setSelected((previous) => toggleSelection(new Set([...previous].filter((id) => pendingIds.includes(id))), log.id, MAX_BATCH_REVIEW))}
                    aria-label={actions.selectOne(activity?.title ?? '', child?.name ?? '')}
                    className="h-6 w-6 shrink-0 accent-indigo-600"
                  />
                  <span className="text-3xl">{activity?.icon || '✨'}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{activity?.title}</span>
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">{child?.name}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{copy.rewardCompleted(activity?.points ?? 0, new Intl.DateTimeFormat(language).format(new Date(`${log.date}T00:00:00`)))}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-2 mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95" aria-live="polite">
            {chosen.length > 0 && (
              <p data-testid="bulk-selection-summary" className="text-xs font-bold text-slate-600 dark:text-slate-200">
                <span data-testid="approvals-scope-label" className={scopeBadgeClass}>{copy.allChildrenScope}</span>
                {' · '}{actions.selectedCount(chosen.length, names)}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="bulk-reject"
                disabled={busy || blocked || chosen.length === 0}
                onClick={() => void review('reject')}
                className="min-h-11 rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
              >
                {chosen.length > 0 ? actions.rejectSelected(chosen.length) : t.reject}
              </button>
              <button
                type="button"
                data-testid="bulk-approve"
                disabled={busy || blocked || chosen.length === 0}
                onClick={() => void review('approve')}
                className="flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {busy ? actions.reviewing : chosen.length > 0 ? actions.approveSelected(chosen.length) : t.approve}
              </button>
            </div>
          </div>
        </>
      )}
      {visibleMessage && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p role={visibleMessage.failed ? 'alert' : 'status'} data-testid="bulk-result" className={`text-sm font-bold ${visibleMessage.failed ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-300'}`}>{visibleMessage.text}</p>
          {visibleMessage.refresh && (
            <button
              type="button"
              data-testid="bulk-refresh"
              disabled={busy}
              onClick={() => void refresh()}
              className="flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {actions.refreshList}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
