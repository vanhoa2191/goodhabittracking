import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import type { HabitActivity } from '@/types';
import type { ActivityMutation } from '@/lib/domain/activity-mutations';
import { requestActivityMutation } from './activity-mutation-client';
import { removeActivity, updateActivityList } from './local-domain-actions';

type NewActivity = Omit<HabitActivity, 'id' | 'createdAt'>;

type ActivityActionsDependencies = {
  readonly currentUser: User | null;
  readonly familyId: string | null;
  readonly setActivities: Dispatch<SetStateAction<HabitActivity[]>>;
  readonly setCloudSyncActive: Dispatch<SetStateAction<boolean>>;
  readonly storageMode: 'local' | 'cloud';
  readonly syncCloudFamily: (user: User) => Promise<boolean>;
};

type ActivityActions = {
  readonly createActivities: (activities: readonly NewActivity[]) => Promise<boolean>;
  readonly createActivity: (activity: NewActivity) => Promise<boolean>;
  readonly deleteActivity: (id: string) => Promise<boolean>;
  readonly updateActivity: (id: string, updates: Partial<HabitActivity>) => Promise<boolean>;
};

export function createActivityActions(
  dependencies: ActivityActionsDependencies,
): ActivityActions {
  const persistCloudActivity = async (mutation: ActivityMutation): Promise<boolean> => {
    if (!dependencies.currentUser || !dependencies.familyId) {
      dependencies.setCloudSyncActive(false);
      return false;
    }
    try {
      await requestActivityMutation(mutation);
      return await dependencies.syncCloudFamily(dependencies.currentUser);
    } catch (error: unknown) {
      dependencies.setCloudSyncActive(false);
      console.error(
        'Saving habit activity failed:',
        error instanceof Error ? error.message : 'unknown',
      );
      return false;
    }
  };

  const createActivities = async (
    activities: readonly NewActivity[],
  ): Promise<boolean> => {
    const createdAt = new Date().toISOString();
    const createdActivities = activities.map((activity) => ({
      ...activity,
      id: crypto.randomUUID(),
      createdAt,
    }));
    if (dependencies.storageMode === 'cloud') {
      return persistCloudActivity({ type: 'createMany', activities: createdActivities });
    }
    dependencies.setActivities((previous) => [...previous, ...createdActivities]);
    return true;
  };

  return {
    createActivities,
    createActivity: (activity) => createActivities([activity]),
    deleteActivity: async (id) => {
      if (dependencies.storageMode === 'cloud') {
        return persistCloudActivity({ type: 'delete', activityId: id });
      }
      dependencies.setActivities((previous) => removeActivity(previous, id));
      return true;
    },
    updateActivity: async (id, updates) => {
      if (dependencies.storageMode === 'cloud') {
        return persistCloudActivity({ type: 'update', activityId: id, updates });
      }
      dependencies.setActivities((previous) => updateActivityList(previous, id, updates));
      return true;
    },
  };
}
