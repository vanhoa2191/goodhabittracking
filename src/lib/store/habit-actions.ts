import confetti from 'canvas-confetti';
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
import { requestChildDomainCommand, requestDomainCommand } from './domain-command-client';
import { approvePendingLog, rejectPendingLog } from './local-domain-actions';
import { toggleLocalHabit } from './local-habit-actions';

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
  readonly storageMode: 'local' | 'cloud';
  readonly badges?: readonly Badge[];
  readonly analyticsSink?: ProductEventSink;
};

type HabitActions = {
  readonly toggleActivity: (activityId: string, date: string) => Promise<boolean>;
  readonly approveLog: (logId: string) => void;
  readonly rejectLog: (logId: string) => void;
};

export function createHabitActions(dependencies: Dependencies): HabitActions {
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

  return {
    toggleActivity: async (activityId, date) => {
      const childId = dependencies.state.activeChildId;
      if (!childId) return false;
      const activity = dependencies.state.activities.find((candidate) => candidate.id === activityId);
      if (!activity) return false;
      const existingLog = dependencies.state.logs.find((log) =>
        log.activityId === activityId && log.childId === childId && log.date === date,
      );

      if (dependencies.storageMode === 'cloud') {
        const user = cloudUser();
        if (!user && !dependencies.cloud.isFamilyConnected) return false;
        try {
          let commandStatus: string;
          if (!user) {
            if (existingLog) {
              commandStatus = (await requestChildDomainCommand({ type: 'undoHabit', logId: existingLog.id })).status;
            } else {
              commandStatus = (await requestChildDomainCommand({
                type: 'completeHabit',
                activityId,
                date,
                commandId: crypto.randomUUID(),
              })).status;
            }
            if (!await dependencies.cloud.refreshChildSession()) return false;
          } else if (existingLog) {
            commandStatus = (await requestDomainCommand({ type: 'undoHabit', logId: existingLog.id })).status;
          } else {
            commandStatus = (await requestDomainCommand({
              type: 'completeHabit',
              activityId,
              childId,
              date,
              commandId: crypto.randomUUID(),
            })).status;
          }
          if (user && !await dependencies.cloud.syncCloudFamily(user)) return false;
          if (commandStatus === 'undone' || commandStatus === 'pending_approval' || commandStatus === 'completed') {
            trackProductEvent({ event: 'task_ticked', action: commandStatus, mode: 'cloud' }, dependencies.analyticsSink);
          }
          sounds.playTaskComplete();
          return true;
        } catch (error: unknown) {
          dependencies.cloud.setCloudSyncActive(false);
          console.error(
            'Saving habit completion failed:',
            error instanceof Error ? error.message : 'unknown',
          );
          return false;
        }
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
        today: completedAt.slice(0, 10),
        logId: crypto.randomUUID(),
        completedAt,
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
      sounds.playTaskComplete();
      if (transition.unlockedBadgeCount > 0) {
        sounds.playLevelUp();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, disableForReducedMotion: true });
      }
      return true;
    },
    approveLog: (logId) => {
      if (dependencies.storageMode === 'cloud') {
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
    rejectLog: (logId) => {
      if (dependencies.storageMode === 'cloud') {
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
