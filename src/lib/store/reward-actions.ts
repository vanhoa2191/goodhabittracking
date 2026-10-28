import confetti from 'canvas-confetti';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ChildProfile, Redemption, Reward } from '@/types';
import { sounds } from '@/lib/sound';
import {
  rewardMutationSchema,
  type RewardMutation,
} from '@/lib/domain/reward-mutations';
import { rememberChildOperation, type ChildOperationState, type ParentOperationState } from './habit-actions';
import { DomainCommandRequestError, requestChildDomainCommand, requestDomainCommand } from './domain-command-client';
import { requestRewardMutation } from './reward-mutation-client';
import {
  addReward,
  claimLocalReward,
  removeReward,
  transitionLocalRedemption,
  updateRewardList,
} from './local-domain-actions';

type NewReward = Omit<Reward, 'id' | 'createdAt'>;

/**
 * What one redemption command actually did, so the screen reports the truth instead of a guess:
 * `command` is the last server-acknowledged step (or why there was none), `refresh` says whether
 * the reload after it produced fresh data, and `unfulfilled` marks an approval that was
 * acknowledged while the delivery that should follow it failed.
 */
export type RedemptionOutcome = {
  readonly command: 'approved' | 'delivered' | 'rejected' | 'invalid_transition' | 'failed' | 'unknown';
  readonly refresh: 'synced' | 'stale';
  readonly unfulfilled?: true;
};

type Dependencies = {
  readonly childRedemptions?: () => readonly Redemption[];
  readonly childOperations?: () => ChildOperationState;
  readonly redemptionOperations?: () => ParentOperationState;
  readonly activeChildId: string | null;
  readonly currentUser: User | null;
  readonly familyId: string | null;
  readonly isFamilyConnected: boolean;
  readonly profiles: readonly ChildProfile[];
  readonly redemptions: readonly Redemption[];
  readonly rewards: readonly Reward[];
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly setProfiles: Dispatch<SetStateAction<ChildProfile[]>>;
  readonly setRedemptions: Dispatch<SetStateAction<Redemption[]>>;
  readonly setRewards: Dispatch<SetStateAction<Reward[]>>;
  readonly isDemoSession: boolean;
  readonly refreshChildSession: () => Promise<boolean>;
  readonly syncCloudFamily: (user: User) => Promise<boolean>;
};

type RewardActions = {
  readonly approveRedemption: (redemptionId: string) => Promise<RedemptionOutcome>;
  readonly claimReward: (rewardId: string) => Promise<boolean>;
  readonly createReward: (reward: NewReward) => Promise<boolean>;
  readonly deleteReward: (id: string) => Promise<boolean>;
  readonly deliverRedemption: (redemptionId: string) => Promise<RedemptionOutcome>;
  readonly rejectRedemption: (redemptionId: string) => Promise<RedemptionOutcome>;
  readonly updateReward: (id: string, updates: Partial<Reward>) => Promise<boolean>;
};

function mutationReward(reward: Reward) {
  return rewardMutationSchema.options[0].shape.reward.parse({
    id: reward.id,
    title: reward.title,
    description: reward.description,
    icon: reward.icon,
    costPoints: reward.costPoints,
    stock: reward.stock,
    isActive: reward.isActive,
    createdAt: reward.createdAt,
  });
}

function mutationUpdates(updates: Partial<Reward>) {
  return rewardMutationSchema.options[1].shape.updates.parse({
    title: updates.title,
    description: updates.description,
    icon: updates.icon,
    costPoints: updates.costPoints,
    stock: updates.stock,
    isActive: updates.isActive,
  });
}

export function createRewardActions(dependencies: Dependencies): RewardActions {
  const persistReward = async (mutation: RewardMutation): Promise<boolean> => {
    const user = dependencies.currentUser;
    if (!user || !dependencies.familyId) {
      dependencies.setCloudSyncActive(false);
      return false;
    }
    try {
      await requestRewardMutation(mutation);
      return await dependencies.syncCloudFamily(user);
    } catch (error: unknown) {
      dependencies.setCloudSyncActive(false);
      console.error(
        'Saving reward failed:',
        error instanceof Error ? error.message : 'unknown',
      );
      return false;
    }
  };

  const applyLocalTransition = (
    redemptionId: string,
    decision: 'approve' | 'deliver' | 'reject',
  ) => {
    const transition = transitionLocalRedemption(
      dependencies.redemptions,
      dependencies.profiles,
      redemptionId,
      decision,
      new Date().toISOString(),
    );
    dependencies.setRedemptions(transition.redemptions);
    dependencies.setProfiles(transition.profiles);
    const before = dependencies.redemptions.find((item) => item.id === redemptionId);
    const after = transition.redemptions.find((item) => item.id === redemptionId);
    if (before && before.status !== 'rejected' && after?.status === 'rejected') {
      dependencies.setRewards((previous) => previous.map((reward) => reward.id === before.rewardId && reward.stock >= 0
        ? { ...reward, stock: reward.stock + 1 } : reward));
    }
  };

  const fallbackChildOperations: ChildOperationState = { active: true, habits: new Map(), rewards: new Map() };
  const fallbackOperations = { busy: new Set<string>(), blocked: new Set<string>() };
  const reloadAfter = async (user: User): Promise<'synced' | 'stale'> => {
    try { return await dependencies.syncCloudFamily(user) ? 'synced' : 'stale'; }
    catch { return 'stale'; }
  };

  const applyAcknowledgedTransition = (id: string, status: 'approved' | 'delivered' | 'rejected'): void => {
    // ACK changes only this row. Balances, stock and refunds come from the snapshot.
    dependencies.setRedemptions((previous) => previous.map((row) => row.id === id
      ? { ...row, status, resolvedAt: new Date().toISOString() } : row));
  };

  const sendTransition = async (redemptionId: string, decision: 'approve' | 'deliver' | 'reject'): Promise<RedemptionOutcome['command']> => {
    try {
      const result = await requestDomainCommand({ type: 'transitionRedemption', redemptionId, decision });
      if (result.redemptionId && result.redemptionId !== redemptionId) return 'unknown';
      if (result.status === 'invalid_transition' || result.status === 'not_found') return 'invalid_transition';
      if (decision === 'approve' && result.status === 'approved') return 'approved';
      if (decision === 'deliver' && result.status === 'delivered') return 'delivered';
      if (decision === 'reject' && result.status === 'rejected') return 'rejected';
      return 'unknown';
    } catch (error: unknown) {
      return error instanceof DomainCommandRequestError && error.outcome === 'refused' ? 'failed' : 'unknown';
    }
  };

  const runParentTransition = async (redemptionId: string, requested: 'approve' | 'deliver' | 'reject'): Promise<RedemptionOutcome> => {
    const operations = dependencies.redemptionOperations?.() ?? fallbackOperations;
    if (operations.busy.has(redemptionId) || operations.blocked.has(redemptionId)) {
      return { command: 'unknown', refresh: 'stale' };
    }
    const user = dependencies.currentUser;
    if (!user) {
      dependencies.setCloudSyncActive(false);
      return { command: 'failed', refresh: 'stale' };
    }
    operations.busy.add(redemptionId);
    let approved = dependencies.redemptions.some((row) => row.id === redemptionId && row.status === 'approved');
    try {
      if (requested === 'deliver' && !approved) {
        const command = await sendTransition(redemptionId, 'approve');
        if (command !== 'approved') {
          const refresh = command === 'failed' ? 'stale' : await reloadAfter(user);
          if (refresh === 'stale' && command !== 'failed') operations.blocked.add(redemptionId);
          return { command, refresh };
        }
        approved = true;
        applyAcknowledgedTransition(redemptionId, 'approved');
      }
      const command = await sendTransition(redemptionId, requested);
      const acknowledged = command === 'approved' || command === 'delivered' || command === 'rejected';
      if (acknowledged) applyAcknowledgedTransition(redemptionId, command);
      // Even a known deliver refusal follows an acknowledged approval; reconcile that partial state.
      const refresh = command === 'failed' && !approved ? 'stale' : await reloadAfter(user);
      if (refresh === 'stale' && (acknowledged || command !== 'failed' || approved)) operations.blocked.add(redemptionId);
      if (command === 'failed') dependencies.setCloudSyncActive(false);
      return { command, refresh, ...(approved && requested === 'deliver' && command !== 'delivered' ? { unfulfilled: true as const } : {}) };
    } finally {
      operations.busy.delete(redemptionId);
    }
  };

  const demoOutcome = (
    redemptionId: string,
    decision: 'approve' | 'deliver' | 'reject',
    afterTransition: () => void,
  ): RedemptionOutcome => {
    const current = dependencies.redemptions.find((item) => item.id === redemptionId);
    const nextStatus = decision === 'deliver' ? 'delivered' : decision === 'approve' ? 'approved' : 'rejected';
    // The local transition decides what demo mode can do (a demo delivery may skip the approval
    // step the server requires), so an already settled row is refused instead of faked as success.
    const canTransition = current
      && ((decision === 'approve' && current.status === 'pending')
        || ((decision === 'deliver' || decision === 'reject') && (current.status === 'pending' || current.status === 'approved')));
    if (!canTransition || !current) {
      return { command: 'invalid_transition', refresh: 'synced' };
    }
    applyLocalTransition(redemptionId, decision);
    afterTransition();
    return { command: nextStatus, refresh: 'synced' };
  };

  return {
    createReward: async (rewardData) => {
      const reward: Reward = {
        ...rewardData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      if (!dependencies.isDemoSession) {
        return persistReward({ type: 'create', reward: mutationReward(reward) });
      }
      dependencies.setRewards((previous) => addReward(previous, reward));
      return true;
    },
    updateReward: async (id, updates) => {
      if (!dependencies.isDemoSession) {
        return persistReward({ type: 'update', rewardId: id, updates: mutationUpdates(updates) });
      }
      dependencies.setRewards((previous) => updateRewardList(previous, id, updates));
      return true;
    },
    deleteReward: async (id) => {
      if (!dependencies.isDemoSession) {
        return persistReward({ type: 'delete', rewardId: id });
      }
      const unsettled = dependencies.redemptions.filter((item) => item.rewardId === id && (item.status === 'pending' || item.status === 'approved'));
      dependencies.setProfiles((previous) => previous.map((child) => ({ ...child,
        points: child.points + unsettled.filter((item) => item.childId === child.id).reduce((sum, item) => sum + item.pointsSpent, 0),
      })));
      dependencies.setRedemptions((previous) => previous.filter((item) => item.rewardId !== id));
      dependencies.setRewards((previous) => removeReward(previous, id));
      return true;
    },
    claimReward: async (rewardId) => {
      const childId = dependencies.activeChildId;
      if (!childId) return false;
      const reward = dependencies.rewards.find((candidate) => candidate.id === rewardId);
      const child = dependencies.profiles.find((candidate) => candidate.id === childId);
      if (!reward || !child || child.points < reward.costPoints) return false;

      const user = dependencies.currentUser;
      if (!dependencies.isDemoSession) {
        if (!user && !dependencies.isFamilyConnected) {
          dependencies.setCloudSyncActive(false);
          return false;
        }
        const operations = dependencies.childOperations?.() ?? fallbackChildOperations;
        const key = `${user?.id ?? 'paired'}:${dependencies.familyId ?? ''}:${childId}:${rewardId}`;
        let operation = operations.rewards.get(key);
        if (!operations.active || operation?.busy) return false;
        const current = () => operations.active && (dependencies.childOperations?.() ?? fallbackChildOperations) === operations;
        const reconcile = async () => {
          try { return (user ? await dependencies.syncCloudFamily(user) : await dependencies.refreshChildSession()) && current(); }
          catch { return false; }
        };
        if (operation && operation.phase !== 'settled') {
          operation.busy = true;
          const synced = await reconcile();
          operation.busy = false;
          if (!current()) return false;
          if (operation.phase === 'accepted') {
            if (synced) operation.phase = 'settled';
            return true;
          }
          if (!synced) return false;
          const recoveringId = operation.commandId;
          if ((dependencies.childRedemptions?.() ?? dependencies.redemptions).some((row) => row.id === recoveringId && row.childId === childId && row.rewardId === rewardId)) {
            operation.phase = 'settled';
            return true;
          }
        } else {
          operation = { commandId: crypto.randomUUID(), kind: 'reward', busy: false, phase: 'uncertain',
            outcome: { status: 'unknown', pointsAwarded: 0, stale: true } };
          rememberChildOperation(operations.rewards, key, operation);
        }
        operation.busy = true;
        try {
          const command = { type: 'redeemReward' as const, rewardId, commandId: operation.commandId };
          const result = user ? await requestDomainCommand({ ...command, childId }) : await requestChildDomainCommand(command);
          if (!current()) return false;
          if (result.status === 'pending' && typeof result.redemptionId === 'string') {
            operation.phase = 'accepted';
            const synced = await reconcile();
            if (!current()) return false;
            if (synced) operation.phase = 'settled';
            sounds.playRewardRedeem();
            return true;
          }
          if (result.status === 'insufficient_points' || result.status === 'out_of_stock') {
            operation.phase = 'settled';
            return false;
          }
          const synced = await reconcile();
          if (synced && (dependencies.childRedemptions?.() ?? dependencies.redemptions).some((row) => row.id === operation.commandId && row.childId === childId && row.rewardId === rewardId)) {
            operation.phase = 'settled';
            return true;
          }
          return false;
        } catch (error: unknown) {
          if (!current()) return false;
          dependencies.setCloudSyncActive(false);
          if (error instanceof DomainCommandRequestError && error.outcome === 'refused') operation.phase = 'settled';
          else {
            const synced = await reconcile();
            if (synced && (dependencies.childRedemptions?.() ?? dependencies.redemptions).some((row) => row.id === operation.commandId && row.childId === childId && row.rewardId === rewardId)) {
              operation.phase = 'settled';
              return true;
            }
          }
          return false;
        } finally { operation.busy = false; }
      }

      const claimed = claimLocalReward(
        dependencies.profiles,
        dependencies.redemptions,
        childId,
        reward,
        crypto.randomUUID(),
        new Date().toISOString(),
      );
      if (!claimed) return false;
      dependencies.setProfiles(claimed.profiles);
      dependencies.setRedemptions(claimed.redemptions);
      if (reward.stock > 0) {
        dependencies.setRewards((previous) => previous.map((candidate) =>
          candidate.id === rewardId && candidate.stock > 0
            ? { ...candidate, stock: candidate.stock - 1 }
            : candidate));
      }
      sounds.playRewardRedeem();
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ec4899', '#f59e0b', '#3b82f6'],
        disableForReducedMotion: true,
      });
      return true;
    },
    approveRedemption: async (redemptionId) => {
      if (!dependencies.isDemoSession) {
        return runParentTransition(redemptionId, 'approve');
      }
      return demoOutcome(redemptionId, 'approve', () => sounds.playClick());
    },
    deliverRedemption: async (redemptionId) => {
      if (!dependencies.isDemoSession) return runParentTransition(redemptionId, 'deliver');
      return demoOutcome(redemptionId, 'deliver', () => sounds.playLevelUp());
    },
    rejectRedemption: async (redemptionId) => {
      if (!dependencies.isDemoSession) {
        return runParentTransition(redemptionId, 'reject');
      }
      return demoOutcome(redemptionId, 'reject', () => sounds.playClick());
    },
  };
}
