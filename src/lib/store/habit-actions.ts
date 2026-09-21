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
    void requestDomainCommand({ type: 'reviewHabit', logId, decision })
      .then(() => dependencies.cloud.syncCloudFamily(user))
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
          if (!user) {
            if (existingLog) {
              await requestChildDomainCommand({ type: 'undoHabit', logId: existingLog.id });
            } else {
              await requestChildDomainCommand({
                type: 'completeHabit',
                activityId,
                date,
                commandId: crypto.randomUUID(),
              });
            }
            if (!await dependencies.cloud.refreshChildSession()) return false;
          } else if (existingLog) {
            await requestDomainCommand({ type: 'undoHabit', logId: existingLog.id });
          } else {
            await requestDomainCommand({
              type: 'completeHabit',
              activityId,
              childId,
              date,
              commandId: crypto.randomUUID(),
            });
          }
          if (user && !await dependencies.cloud.syncCloudFamily(user)) return false;
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

      if (transition.kind === 'undone' || transition.kind === 'pending_approval') {
        sounds.playClick();
        return true;
      }
      sounds.playTaskComplete();
      if (transition.unlockedBadgeCount > 0) {
        sounds.playLevelUp();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
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
      sounds.playTaskComplete();
    },
    rejectLog: (logId) => {
      if (dependencies.storageMode === 'cloud') {
        reviewCloudLog(logId, 'reject');
        return;
      }
      dependencies.state.setLogs((previous) => rejectPendingLog(previous, logId));
      sounds.playClick();
    },
  };
}
