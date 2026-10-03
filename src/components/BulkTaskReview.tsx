'use client';

import React from 'react';
import { Check, Inbox } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n/context';
import { parentApprovalsCopy } from '@/lib/i18n/parent-approvals-copy';
import { getParentActionsCopy } from '@/lib/i18n/parent-actions-copy';
import { MAX_BATCH_REVIEW } from '@/lib/domain/commands';
import { groupPendingByChild, selectAllPending, toggleSelection } from '@/lib/parent-actions';
import { HelpTip } from '@/components/help/HelpTip';

/** The waiting tasks, with tick boxes: nothing is ticked at first, and one PIN covers the whole batch. */
export function BulkTaskReview() {
  const { profiles, activities, logs, reviewLogs } = useAppStore();
  const { t, language } = useTranslation();
  const copy = parentApprovalsCopy[language];
  const actions = getParentActionsCopy(language);
  const pendingLogs = logs.filter((log) => log.status === 'pending_approval');
  const pendingIds = pendingLogs.map((log) => log.id);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ readonly text: string; readonly failed: boolean } | null>(null);

  // A tick on a log that is no longer waiting (reviewed elsewhere) is ignored here, so it never reaches a command.
  const chosen = pendingLogs.filter((log) => selected.has(log.id));
  const names = groupPendingByChild(chosen, profiles).map((group) => `${group.childName} (${group.count})`).join(', ');
  const allSelected = pendingIds.length > 0 && pendingIds.slice(0, MAX_BATCH_REVIEW).every((id) => selected.has(id));

  const review = async (decision: 'approve' | 'reject') => {
    if (busy || chosen.length === 0) return;
    setBusy(true);
    setMessage(null);
    const outcome = await reviewLogs(chosen.map((log) => log.id), decision);
    setBusy(false);
    if (!outcome) {
      setMessage({ text: actions.reviewFailed, failed: true });
      return;
    }
    const parts = [
      outcome.approved > 0 ? actions.reviewedApproved(outcome.approved) : '',
      outcome.rejected > 0 ? actions.reviewedRejected(outcome.rejected) : '',
      outcome.skipped > 0 ? actions.reviewedSkipped(outcome.skipped) : '',
    ].filter(Boolean);
    setMessage({ text: parts.join(' '), failed: false });
    setSelected(new Set());
  };

  return (
    <div id="pending-tasks" tabIndex={-1} className="rounded-3xl border border-slate-100 bg-white p-6 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-1">
        <h3 className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-800 dark:text-slate-100">
          {copy.pendingTasks} ({pendingLogs.length})
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
              onClick={() => setSelected(allSelected ? new Set() : selectAllPending(pendingIds, MAX_BATCH_REVIEW))}
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
                    disabled={!checked && selected.size >= MAX_BATCH_REVIEW}
                    onChange={() => setSelected((previous) => toggleSelection(previous, log.id, MAX_BATCH_REVIEW))}
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
            {chosen.length > 0 && <p data-testid="bulk-selection-summary" className="text-xs font-bold text-slate-600 dark:text-slate-200">{actions.selectedCount(chosen.length, names)}</p>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="bulk-reject"
                disabled={busy || chosen.length === 0}
                onClick={() => void review('reject')}
                className="min-h-11 rounded-xl bg-rose-50 px-4 text-sm font-bold text-rose-700 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
              >
                {chosen.length > 0 ? actions.rejectSelected(chosen.length) : t.reject}
              </button>
              <button
                type="button"
                data-testid="bulk-approve"
                disabled={busy || chosen.length === 0}
                onClick={() => void review('approve')}
                className="flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {busy ? actions.reviewing : chosen.length > 0 ? actions.approveSelected(chosen.length) : t.approve}
              </button>
            </div>
          </div>
        </>
      )}
      {message && <p role={message.failed ? 'alert' : 'status'} data-testid="bulk-result" className={`mt-3 text-sm font-bold ${message.failed ? 'text-rose-600' : 'text-emerald-700 dark:text-emerald-300'}`}>{message.text}</p>}
    </div>
  );
}
