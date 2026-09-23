import confetti from 'canvas-confetti';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ChildProfile, GroupTeam, Kudo } from '@/types';
import { sounds } from '@/lib/sound';
import type { SocialMutation } from '@/lib/domain/social-mutations';
import { requestSocialMutation } from './social-mutation-client';

type NewGroup = Omit<GroupTeam, 'id' | 'inviteCode' | 'createdAt'>;

type SocialState = {
  readonly activeChild: ChildProfile | null;
  readonly groups: readonly GroupTeam[];
  readonly setGroups: Dispatch<SetStateAction<GroupTeam[]>>;
  readonly setKudos: Dispatch<SetStateAction<Kudo[]>>;
};

type CloudContext = {
  readonly currentUser: User | null;
  readonly familyId: string | null;
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly syncCloudFamily: (user: User) => Promise<boolean>;
};

type Dependencies = {
  readonly cloud: CloudContext;
  readonly state: SocialState;
  readonly storageMode: 'local' | 'cloud';
};

type SocialActions = {
  readonly createGroup: (group: NewGroup) => Promise<boolean>;
  readonly joinGroup: (inviteCode: string) => Promise<boolean>;
  readonly sendKudo: (toChildId: string, emoji?: string) => Promise<boolean>;
  readonly updateGroupReward: (
    groupId: string,
    rewardType: GroupTeam['rewardType'],
    customRewardText?: string,
  ) => Promise<boolean>;
};

function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    crypto.getRandomValues(new Uint8Array(8)),
    (value) => alphabet[value % alphabet.length],
  ).join('');
}

export function createSocialActions(dependencies: Dependencies): SocialActions {
  const persistCloudMutation = async (mutation: SocialMutation): Promise<boolean> => {
    const user = dependencies.cloud.currentUser;
    if (!user || !dependencies.cloud.familyId) {
      dependencies.cloud.setCloudSyncActive(false);
      return false;
    }
    try {
      await requestSocialMutation(mutation);
      return await dependencies.cloud.syncCloudFamily(user);
    } catch (error: unknown) {
      dependencies.cloud.setCloudSyncActive(false);
      console.error(
        'Saving social action failed:',
        error instanceof Error ? error.message : 'unknown',
      );
      return false;
    }
  };

  return {
    createGroup: async (groupData) => {
      if (dependencies.storageMode === 'cloud') {
        return persistCloudMutation({
          type: 'createGroup',
          group: {
            name: groupData.name,
            icon: groupData.icon,
            createdByChildId: groupData.createdByChildId,
            weeklyTargetPoints: groupData.weeklyTargetPoints,
            rewardType: groupData.rewardType,
            customRewardText: groupData.customRewardText,
          },
        });
      }
      const group: GroupTeam = {
        ...groupData,
        id: crypto.randomUUID(),
        inviteCode: generateInviteCode(),
        createdAt: new Date().toISOString(),
      };
      dependencies.state.setGroups((previous) => [group, ...previous]);
      sounds.playFanfare();
      return true;
    },
    joinGroup: async (inviteCode) => {
      const child = dependencies.state.activeChild;
      if (!child) return false;
      if (dependencies.storageMode === 'cloud') {
        return persistCloudMutation({
          type: 'joinGroup',
          inviteCode: inviteCode.trim().toUpperCase(),
          childId: child.id,
        });
      }
      const normalizedCode = inviteCode.trim().toUpperCase();
      const group = dependencies.state.groups.find(
        (candidate) => candidate.inviteCode.toUpperCase() === normalizedCode,
      );
      if (!group) return false;
      dependencies.state.setGroups((previous) => previous.map((candidate) => (
        candidate.id === group.id && !candidate.memberChildIds.includes(child.id)
          ? { ...candidate, memberChildIds: [...candidate.memberChildIds, child.id] }
          : candidate
      )));
      sounds.playFanfare();
      return true;
    },
    updateGroupReward: async (groupId, rewardType, customRewardText) => {
      if (dependencies.storageMode === 'cloud') {
        return persistCloudMutation({
          type: 'updateGroupReward',
          groupId,
          rewardType,
          customRewardText,
        });
      }
      dependencies.state.setGroups((previous) => previous.map((group) => (
        group.id === groupId ? { ...group, rewardType, customRewardText } : group
      )));
      sounds.playClick();
      return true;
    },
    sendKudo: async (toChildId, emoji = '👏') => {
      const child = dependencies.state.activeChild;
      if (!child || child.id === toChildId) return false;
      if (dependencies.storageMode === 'cloud') {
        return persistCloudMutation({
          type: 'sendKudo',
          fromChildId: child.id,
          toChildId,
          emoji,
        });
      }
      const kudo: Kudo = {
        id: crypto.randomUUID(),
        fromChildId: child.id,
        fromChildName: child.name,
        toChildId,
        emoji,
        sentAt: new Date().toISOString(),
      };
      dependencies.state.setKudos((previous) => [kudo, ...previous.slice(0, 49)]);
      sounds.playFanfare();
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 }, disableForReducedMotion: true });
      return true;
    },
  };
}
