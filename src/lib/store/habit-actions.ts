import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  ActivityLog,
  Badge,
  ChildBadge,
  ChildProfile,
  HabitActivity,
} from '@/types';
import { DEFAULT_BADGES } from '@/lib/constants';
import { sounds } from '@/lib/sound';
import { approvalLagBucket, trackProductEvent } from '@/lib/product-analytics';
import type { ProductEventSink } from '@/lib/product-analytics';
import { setDeferredTask } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
import { MAX_BATCH_REVIEW } from '@/lib/domain/commands';
import { DomainCommandRequestError, requestChildDomainCommand, requestDomainCommand } from './domain-command-client';
import { approvePendingLog, rejectPendingLog } from './local-domain-actions';
import { toggleLocalHabit } from './local-habit-actions';
import { localDayKey } from '@/lib/local-day';

type HabitState = {
  readonly activeChildId: string | null;
  readonly activities: readonly HabitActivity[];
  readonly profiles: readonly ChildProfile[];
  readonly logs: readonly ActivityLog[];
  readonly childBadges: readonly ChildBadge[];
  readonly setProfiles: Dispatch<SetStateAction<ChildProfile[]>>;
  readonly setLogs: Dispatch<SetStateAction<ActivityLog[]>>;
  readonly setChildBadges: Dispatch<SetStateAction<ChildBadge[]>>;
  readonly setExperience: Dispatch<SetStateAction<ExperienceState>>;
};

type CloudContext = {
  readonly currentUser: User | null;
  readonly familyId: string | null;
  readonly isFamilyConnected: boolean;
  readonly refreshChildSession: () => Promise<boolean>;
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly syncCloudFamily: (user: User) => Promise<boolean>;
};

type Dependencies = {
  readonly cloud: CloudContext;
  readonly state: HabitState;
  readonly isDemoSession: boolean;
  readonly badges?: readonly Badge[];
  readonly analyticsSink?: ProductEventSink;
  readonly childLogs?: () => readonly ActivityLog[];
  readonly childOperations?: () => ChildOperationState;
  readonly reviewOperations?: () => ParentOperationState;
};

type HabitActions = {
  readonly getToggleOutcome: (activityId: string, date: string) => ChildToggleOutcome | null;
  readonly toggleActivity: (activityId: string, date: string, completing?: boolean) => Promise<boolean>;
  readonly approveLog: (logId: string) => void;
  readonly rejectLog: (logId: string) => void;
  readonly reviewLogs: (logIds: readonly string[], decision: 'approve' | 'reject') => Promise<BatchReviewOutcome | null>;
};

/** Provider-owned, session-scoped child operations. No module-global retry/outcome cache. */
export type ChildToggleOutcome = {
  readonly status: 'completed' | 'pending_approval' | 'undone' | 'unknown' | 'refused';
  readonly pointsAwarded: number;
  readonly stale: boolean;
};
export type ChildOperation = {
  readonly commandId: string;
  readonly kind: 'complete' | 'undo' | 'reward';
  readonly logId?: string;
  busy: boolean;
  phase: 'uncertain' | 'accepted' | 'settled';
  outcome: ChildToggleOutcome;
};
export type ChildOperationState = {
  active: boolean;
  readonly habits: Map<string, ChildOperation>;
  readonly rewards: Map<string, ChildOperation>;
};

const MAX_SETTLED_CHILD_OPERATIONS = 128;

/** Keep only the newest settled outcomes while preserving every operation that still needs recovery. */
export function rememberChildOperation(map: Map<string, ChildOperation>, key: string, operation: ChildOperation): void {
  map.set(key, operation);
  if (map.size <= MAX_SETTLED_CHILD_OPERATIONS) return;
  for (const [candidateKey, candidate] of map) {
    if (candidateKey !== key && candidate.phase === 'settled') map.delete(candidateKey);
    if (map.size <= MAX_SETTLED_CHILD_OPERATIONS * 3 / 4) break;
  }
}

/** What a batch review did, counted per log so the screen can say how many were taken and how many were already handled. `stale` marks an outcome whose follow-up reload failed, so the screen offers a refresh instead of implying its data is fresh. */
export type ParentOperationState = {
  readonly busy: Set<string>;
  readonly blocked: Set<string>;
};

export type BatchReviewOutcome = {
  readonly approved: number;
  readonly rejected: number;
  readonly skipped: number;
  readonly stale?: true;
  /** Explicit per-ID outcomes; callers never infer IDs from aggregate counts. */
  readonly acknowledgedIds: readonly string[];
  readonly unresolvedIds: readonly string[];
};

// Why the last tick could not be saved, as a short code the child screen shows next to its message, so a report
// from a family says which step failed instead of only that something did.
let lastToggleFailure: string | null = null;
export function getLastToggleFailure(): string | null {
  return lastToggleFailure;
}
function failureCodeOf(error: unknown): string {
  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === 'number') return `request-${status}`;
  return error instanceof Error ? `error-${error.name}` : 'error';
}
const failedWith = (code: string): false => {
  lastToggleFailure = code;
  return false;
};

function undoRefusalCode(status: string): string {
  if (status === 'not_reversible') return 'not-reversible';
  if (status === 'not_found') return 'not-found';
  return `status-${status.replace(/_/g, '-')}`;
}

export function createHabitActions(dependencies: Dependencies): HabitActions {
  const fallbackReviewOperations = { busy: new Set<string>(), blocked: new Set<string>() };
  const cloudUser = (): User | null => {
    const user = dependencies.cloud.currentUser;
    if (!user || !dependencies.cloud.familyId) {
      if (!dependencies.cloud.isFamilyConnected) {
        dependencies.cloud.setCloudSyncActive(false);
      }
      return null;
    }
    return user;
  };

  const reviewCloudLog = (logId: string, decision: 'approve' | 'reject'): void => {
    const user = cloudUser();
    if (!user) return;
    const log = dependencies.state.logs.find((candidate) => candidate.id === logId);
    void requestDomainCommand({ type: 'reviewHabit', logId, decision })
      .then(async (result) => {
        const synced = await dependencies.cloud.syncCloudFamily(user);
        if (synced && (result.status === 'approved' || result.status === 'rejected')) {
          trackProductEvent({ event: 'habit_reviewed', decision: result.status, approvalLag: approvalLagBucket(log?.completedAt), mode: 'cloud' }, dependencies.analyticsSink);
        }
      })
      .catch((error: unknown) => {
        dependencies.cloud.setCloudSyncActive(false);
        console.error(
          `${decision === 'approve' ? 'Approving' : 'Rejecting'} habit failed:`,
          error instanceof Error ? error.message : 'unknown',
        );
      });
  };

  const fallbackChildOperations: ChildOperationState = { active: true, habits: new Map(), rewards: new Map() };
  const childOperations = () => dependencies.childOperations?.() ?? fallbackChildOperations;
  const readChildLogs = () => dependencies.childLogs?.() ?? dependencies.state.logs;
  const operationKey = (activityId: string, date: string) =>
    `${dependencies.cloud.currentUser?.id ?? 'paired'}:${dependencies.cloud.familyId ?? ''}:${dependencies.state.activeChildId}:${activityId}:${date}`;

  return {
    getToggleOutcome: (activityId, date) => childOperations().active ? childOperations().habits.get(operationKey(activityId, date))?.outcome ?? null : null,
    toggleActivity: async (activityId, date, completing) => {
      const childId = dependencies.state.activeChildId;
      lastToggleFailure = null;
      if (!childId) return failedWith('no-child');
      const activity = dependencies.state.activities.find((candidate) => candidate.id === activityId);
      if (!activity) return failedWith('no-activity');
      const existingLog = readChildLogs().find((log) =>
        log.activityId === activityId && log.childId === childId && log.date === date,
      );

      if (!dependencies.isDemoSession) {
        const user = cloudUser();
        if (!user && !dependencies.cloud.isFamilyConnected) return failedWith('no-session');
        const operations = childOperations();
        const key = operationKey(activityId, date);
        let operation = operations.habits.get(key);
        if (!operations.active || operation?.busy) return failedWith('busy');
        const current = () => operations.active && childOperations() === operations;
        const snapshotLog = () => readChildLogs().find((log) =>
          log.activityId === activityId && log.childId === childId && log.date === date,
        );
        const reconcile = async (): Promise<boolean> => {
          try {
            const synced = user ? await dependencies.cloud.syncCloudFamily(user) : await dependencies.cloud.refreshChildSession();
            return current() && synced;
          } catch { return false; }
        };
        const snapshotOutcome = (): ChildToggleOutcome | null => {
          const row = snapshotLog();
          if (operation?.kind === 'undo') return !row ? { status: 'undone', pointsAwarded: 0, stale: false } : null;
          if (!row || !['completed', 'approved', 'pending_approval'].includes(row.status)) return null;
          return { status: row.status === 'pending_approval' ? 'pending_approval' : 'completed',
            pointsAwarded: row.status === 'pending_approval' ? 0 : row.pointsAwarded, stale: false };
        };
        if (operation && operation.phase !== 'settled') {
          operation.busy = true;
          const synced = await reconcile();
          operation.busy = false;
          if (!current()) return false;
          if (operation.phase === 'accepted') {
            operation.outcome = { ...operation.outcome, stale: !synced };
            if (synced) operation.phase = 'settled';
            return true; // finish the original ACK, never turn its recovery tap into undo
          }
          const recovered = synced ? snapshotOutcome() : null;
          if (recovered) {
            operation.outcome = recovered;
            operation.phase = 'settled';
            return true;
          }
          if (!synced) return failedWith('recovery-required');
          // Fresh absence permits an explicit retry with the SAME logical identity.
        } else if (!(operation?.phase === 'settled' && operation.outcome.status === 'refused'
          && (completing === undefined || (completing ? 'complete' : 'undo') === operation.kind))) {
          operation = { commandId: crypto.randomUUID(), kind: completing === undefined
            ? (existingLog ? 'undo' : 'complete') : completing ? 'complete' : 'undo',
            logId: existingLog?.id, busy: false, phase: 'uncertain',
            outcome: { status: 'unknown', pointsAwarded: 0, stale: true } };
          rememberChildOperation(operations.habits, key, operation);
        }
        operation.busy = true; // immediate guard, shared across factory recreation
        try {
          const command = operation.kind === 'undo'
            ? { type: 'undoHabit' as const, logId: operation.logId! }
            : { type: 'completeHabit' as const, activityId, date, commandId: operation.commandId };
          const result = user
            ? await requestDomainCommand(command.type === 'completeHabit' ? { ...command, childId } : command)
            : await requestChildDomainCommand(command);
          if (!current()) return false;
          const accepted = operation.kind === 'undo' ? result.status === 'undone'
            : (result.status === 'completed' || result.status === 'pending_approval')
              && typeof result.logId === 'string' && typeof result.pointsAwarded === 'number' && result.pointsAwarded >= 0;
          if (accepted) {
            const status = operation.kind === 'undo' ? 'undone'
              : result.status === 'pending_approval' ? 'pending_approval' : 'completed';
            const pointsAwarded = status === 'completed' ? result.pointsAwarded! : 0;
            operation.phase = 'accepted';
            operation.outcome = { status, pointsAwarded, stale: true };
            if (status === 'undone') {
              dependencies.state.setLogs((rows) => rows.filter((row) => row.id !== operation.logId));
            } else {
              const row: ActivityLog = { id: result.logId!, activityId, childId, date, status, pointsAwarded,
                completedAt: new Date().toISOString() };
              dependencies.state.setLogs((rows) => [...rows.filter((item) => !(item.activityId === activityId && item.childId === childId && item.date === date)), row]);
            }
            // Balances, streaks and badges require the authoritative snapshot.
            const synced = await reconcile();
            if (!current()) return false;
            operation.outcome = { ...operation.outcome, stale: !synced };
            if (synced) operation.phase = 'settled';
            if (status === 'completed') sounds.playTaskComplete();
            else sounds.playClick();
            trackProductEvent({ event: 'task_ticked', action: status, mode: 'cloud' }, dependencies.analyticsSink);
            return true;
          }
          const refused = operation.kind === 'undo' && ['points_already_spent', 'not_reversible', 'not_found'].includes(result.status);
          if (refused) {
            operation.phase = 'settled';
            operation.outcome = { status: 'refused', pointsAwarded: 0, stale: !await reconcile() };
            return failedWith(result.status === 'points_already_spent' ? 'points-spent' : undoRefusalCode(result.status));
          }
          const synced = await reconcile();
          if (!current()) return false;
          const recovered = synced ? snapshotOutcome() : null;
          if (recovered) { operation.outcome = recovered; operation.phase = 'settled'; return true; }
          return failedWith(undoRefusalCode(result.status));
        } catch (error: unknown) {
          if (!current()) return false;
          dependencies.cloud.setCloudSyncActive(false);
          if (error instanceof DomainCommandRequestError && error.outcome === 'refused') {
            operation.phase = 'settled';
            operation.outcome = { status: 'refused', pointsAwarded: 0, stale: true };
          } else {
            const synced = await reconcile();
            if (!current()) return false;
            const recovered = synced ? snapshotOutcome() : null;
            if (recovered) { operation.outcome = recovered; operation.phase = 'settled'; return true; }
          }
          return failedWith(failureCodeOf(error));
        } finally { operation.busy = false; }
      }

      const completedAt = new Date().toISOString();
      const transition = toggleLocalHabit({
        profiles: dependencies.state.profiles,
        logs: dependencies.state.logs,
        childBadges: dependencies.state.childBadges,
        badges: dependencies.badges ?? DEFAULT_BADGES,
        activity,
        childId,
        date,
        today: localDayKey(new Date(completedAt)),
        logId: crypto.randomUUID(),
        completedAt,
      });
      rememberChildOperation(childOperations().habits, operationKey(activityId, date), {
        commandId: '', kind: transition.kind === 'undone' ? 'undo' : 'complete', busy: false, phase: 'settled',
        outcome: { status: transition.kind, pointsAwarded: transition.kind === 'completed' ? activity.points : 0, stale: false },
      });
      dependencies.state.setLogs(transition.logs);
      dependencies.state.setProfiles(transition.profiles);
      dependencies.state.setChildBadges(transition.childBadges);
      if (transition.kind !== 'undone') {
        dependencies.state.setExperience((previous) => {
          const deferred = previous.deferredTasks.find((row) =>
            row.child_id === childId && row.activity_id === activityId && row.local_date === date,
          );
          return deferred ? setDeferredTask(previous, deferred, false) : previous;
        });
      }
      trackProductEvent({ event: 'task_ticked', action: transition.kind, mode: 'local' }, dependencies.analyticsSink);

      if (transition.kind === 'undone' || transition.kind === 'pending_approval') {
        sounds.playClick();
        return true;
      }
      // Badge congratulations are shown by BadgeCelebration, which reads the same progress in every mode.
      sounds.playTaskComplete();
      return true;
    },
    approveLog: (logId) => {
      if (!dependencies.isDemoSession) {
        reviewCloudLog(logId, 'approve');
        return;
      }
      const log = dependencies.state.logs.find((candidate) => candidate.id === logId);
      if (!log || log.status !== 'pending_approval') return;
      const approved = approvePendingLog(
        dependencies.state.logs,
        dependencies.state.profiles,
        dependencies.state.activities,
        logId,
      );
      dependencies.state.setLogs(approved.logs);
      dependencies.state.setProfiles(approved.profiles);
      trackProductEvent({ event: 'habit_reviewed', decision: 'approved', approvalLag: approvalLagBucket(log.completedAt), mode: 'local' }, dependencies.analyticsSink);
      sounds.playTaskComplete();
    },
    reviewLogs: async (logIds, decision) => {
      const ids = [...new Set(logIds)].slice(0, MAX_BATCH_REVIEW);
      if (ids.length === 0) return { approved: 0, rejected: 0, skipped: 0, acknowledgedIds: [], unresolvedIds: [] };
      if (dependencies.isDemoSession) {
        const pending = ids.filter((id) => dependencies.state.logs.some((log) => log.id === id && log.status === 'pending_approval'));
        if (decision === 'approve') {
          let logs = [...dependencies.state.logs];
          let profiles = [...dependencies.state.profiles];
          for (const id of pending) {
            const approved = approvePendingLog(logs, profiles, dependencies.state.activities, id);
            logs = approved.logs;
            profiles = approved.profiles;
          }
          dependencies.state.setLogs(logs);
          dependencies.state.setProfiles(profiles);
          sounds.playTaskComplete();
        } else {
          dependencies.state.setLogs((previous) => pending.reduce((current, id) => rejectPendingLog(current, id), previous));
          sounds.playClick();
        }
        trackProductEvent({ event: 'habit_reviewed', decision: decision === 'approve' ? 'approved' : 'rejected', approvalLag: 'unknown', mode: 'local' }, dependencies.analyticsSink);
        return { approved: decision === 'approve' ? pending.length : 0, rejected: decision === 'reject' ? pending.length : 0, skipped: ids.length - pending.length, acknowledgedIds: ids, unresolvedIds: [] };
      }
      const user = cloudUser();
      if (!user) return null;
      const reviewOperations = dependencies.reviewOperations?.() ?? fallbackReviewOperations;
      const unknown = (): BatchReviewOutcome => ({ approved: 0, rejected: 0, skipped: 0, acknowledgedIds: [], unresolvedIds: ids });
      if (ids.some((id) => reviewOperations.busy.has(id) || reviewOperations.blocked.has(id))) {
        return { ...unknown(), stale: true };
      }
      ids.forEach((id) => reviewOperations.busy.add(id));
      const reconcile = async (): Promise<boolean> => {
        try { return await dependencies.cloud.syncCloudFamily(user); } catch { return false; }
      };
      const settle = (outcome: BatchReviewOutcome, synced: boolean): BatchReviewOutcome => {
        ids.forEach((id) => synced ? reviewOperations.blocked.delete(id) : reviewOperations.blocked.add(id));
        return synced ? outcome : { ...outcome, stale: true };
      };
      try {
        const result = await requestDomainCommand({ type: 'reviewHabits', logIds: ids, decision });
        const rows = result.results ?? [];
        const acknowledged = result.status === 'reviewed' ? rows.filter((row) =>
          ids.includes(row.logId)
          && rows.filter((candidate) => candidate.logId === row.logId).length === 1
          && (row.status === (decision === 'approve' ? 'approved' : 'rejected')
            || row.status === 'already_reviewed' || row.status === 'not_found'),
        ) : [];
        const acknowledgedIds = acknowledged.map((row) => row.logId);
        const unresolvedIds = ids.filter((id) => !acknowledgedIds.includes(id));
        const outcome: BatchReviewOutcome = {
          approved: acknowledged.filter((row) => row.status === 'approved').length,
          rejected: acknowledged.filter((row) => row.status === 'rejected').length,
          skipped: acknowledged.filter((row) => row.status === 'already_reviewed' || row.status === 'not_found').length,
          acknowledgedIds,
          unresolvedIds,
        };
        const synced = await reconcile();
        if (outcome.approved + outcome.rejected > 0) {
          trackProductEvent({ event: 'habit_reviewed', decision: outcome.approved > 0 ? 'approved' : 'rejected', approvalLag: 'unknown', mode: 'cloud' }, dependencies.analyticsSink);
        }
        return settle(outcome, synced);
      } catch (error) {
        console.error('Reviewing habits failed:', error instanceof Error ? error.message : 'unknown');
        if (error instanceof DomainCommandRequestError && error.outcome === 'refused') return null;
        return settle(unknown(), await reconcile());
      } finally {
        ids.forEach((id) => reviewOperations.busy.delete(id));
      }
    },
    rejectLog: (logId) => {
      if (!dependencies.isDemoSession) {
        reviewCloudLog(logId, 'reject');
        return;
      }
      const log = dependencies.state.logs.find((candidate) => candidate.id === logId);
      if (!log || log.status !== 'pending_approval') return;
      dependencies.state.setLogs((previous) => rejectPendingLog(previous, logId));
      trackProductEvent({ event: 'habit_reviewed', decision: 'rejected', approvalLag: approvalLagBucket(log.completedAt), mode: 'local' }, dependencies.analyticsSink);
      sounds.playClick();
    },
  };
}
