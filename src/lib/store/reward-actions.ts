import confetti from 'canvas-confetti';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ChildProfile, Redemption, Reward } from '@/types';
import { sounds } from '@/lib/sound';
import {
  rewardMutationSchema,
  type RewardMutation,
} from '@/lib/domain/reward-mutations';
import { requestDomainCommand } from './domain-command-client';
import { requestRewardMutation } from './reward-mutation-client';
import {
  addReward,
  claimLocalReward,
  removeReward,
  transitionLocalRedemption,
  updateRewardList,
} from './local-domain-actions';

type NewReward = Omit<Reward, 'id' | 'createdAt'>;

type Dependencies = {
  readonly activeChildId: string | null;
  readonly currentUser: User | null;
  readonly familyId: string | null;
  readonly profiles: readonly ChildProfile[];
  readonly redemptions: readonly Redemption[];
  readonly rewards: readonly Reward[];
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly setProfiles: Dispatch<SetStateAction<ChildProfile[]>>;
  readonly setRedemptions: Dispatch<SetStateAction<Redemption[]>>;
  readonly setRewards: Dispatch<SetStateAction<Reward[]>>;
  readonly storageMode: 'local' | 'cloud';
  readonly syncCloudFamily: (user: User) => Promise<boolean>;
};

type RewardActions = {
  readonly approveRedemption: (redemptionId: string) => void;
  readonly claimReward: (rewardId: string) => Promise<boolean>;
  readonly createReward: (reward: NewReward) => Promise<boolean>;
  readonly deleteReward: (id: string) => Promise<boolean>;
  readonly deliverRedemption: (redemptionId: string) => void;
  readonly rejectRedemption: (redemptionId: string) => void;
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
  };

  const persistCloudTransition = (
    redemptionId: string,
    decision: 'approve' | 'reject',
  ) => {
    const user = dependencies.currentUser;
    if (!user) return;
    void requestDomainCommand({ type: 'transitionRedemption', redemptionId, decision })
      .then(() => dependencies.syncCloudFamily(user))
      .catch((error: unknown) => {
        console.error(
          `${decision === 'approve' ? 'Approving' : 'Rejecting'} redemption failed:`,
          error instanceof Error ? error.message : 'unknown',
        );
      });
  };

  return {
    createReward: async (rewardData) => {
      const reward: Reward = {
        ...rewardData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      if (dependencies.storageMode === 'cloud') {
        return persistReward({ type: 'create', reward: mutationReward(reward) });
      }
      dependencies.setRewards((previous) => addReward(previous, reward));
      return true;
    },
    updateReward: async (id, updates) => {
      if (dependencies.storageMode === 'cloud') {
        return persistReward({ type: 'update', rewardId: id, updates: mutationUpdates(updates) });
      }
      dependencies.setRewards((previous) => updateRewardList(previous, id, updates));
      return true;
    },
    deleteReward: async (id) => {
      if (dependencies.storageMode === 'cloud') {
        return persistReward({ type: 'delete', rewardId: id });
      }
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
      if (dependencies.storageMode === 'cloud') {
        if (!user) {
          dependencies.setCloudSyncActive(false);
          return false;
        }
        try {
          const result = await requestDomainCommand({
            type: 'redeemReward',
            rewardId,
            childId,
            commandId: crypto.randomUUID(),
          });
          if (result.status === 'insufficient_points' || result.status === 'out_of_stock') {
            return false;
          }
          await dependencies.syncCloudFamily(user);
          sounds.playRewardRedeem();
          return true;
        } catch (error: unknown) {
          dependencies.setCloudSyncActive(false);
          console.error(
            'Redeeming reward failed:',
            error instanceof Error ? error.message : 'unknown',
          );
          return false;
        }
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
      sounds.playRewardRedeem();
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ec4899', '#f59e0b', '#3b82f6'],
      });
      return true;
    },
    approveRedemption: (redemptionId) => {
      if (dependencies.storageMode === 'cloud') {
        if (!dependencies.currentUser) {
          dependencies.setCloudSyncActive(false);
          return;
        }
        persistCloudTransition(redemptionId, 'approve');
        return;
      }
      applyLocalTransition(redemptionId, 'approve');
      sounds.playClick();
    },
    deliverRedemption: (redemptionId) => {
      const user = dependencies.currentUser;
      if (dependencies.storageMode === 'cloud') {
        if (!user) {
          dependencies.setCloudSyncActive(false);
          return;
        }
        void requestDomainCommand({
          type: 'transitionRedemption',
          redemptionId,
          decision: 'approve',
        })
          .then(() => requestDomainCommand({
            type: 'transitionRedemption',
            redemptionId,
            decision: 'deliver',
          }))
          .then(() => dependencies.syncCloudFamily(user))
          .catch((error: unknown) => {
            dependencies.setCloudSyncActive(false);
            console.error(
              'Delivering redemption failed:',
              error instanceof Error ? error.message : 'unknown',
            );
          });
        return;
      }
      applyLocalTransition(redemptionId, 'deliver');
      sounds.playLevelUp();
    },
    rejectRedemption: (redemptionId) => {
      if (dependencies.storageMode === 'cloud') {
        if (!dependencies.currentUser) {
          dependencies.setCloudSyncActive(false);
          return;
        }
        persistCloudTransition(redemptionId, 'reject');
        return;
      }
      applyLocalTransition(redemptionId, 'reject');
      sounds.playClick();
    },
  };
}
