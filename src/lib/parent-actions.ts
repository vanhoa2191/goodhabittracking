import type { ActivityLog, ChildProfile } from '@/types';

export type ParentActionKind = 'review-tasks' | 'review-rewards' | 'suggestions';

export type ParentAction = {
  readonly kind: ParentActionKind;
  readonly count: number;
};

type ParentActionInput = {
  readonly pendingTasks: number;
  readonly pendingRewards: number;
  readonly suggestions: number;
};

/** What waits for a parent, most direct first; kinds with nothing waiting are left out. */
export function selectParentActions(input: ParentActionInput): ParentAction[] {
  const actions: ParentAction[] = [
    { kind: 'review-tasks', count: input.pendingTasks },
    { kind: 'review-rewards', count: input.pendingRewards },
    { kind: 'suggestions', count: input.suggestions },
  ];
  return actions.filter((action) => action.count > 0);
}

/** The number shown on the app icon: only things a parent has to decide, never suggestions. */
export function appBadgeCount(input: Pick<ParentActionInput, 'pendingTasks' | 'pendingRewards'>): number {
  return Math.max(0, input.pendingTasks) + Math.max(0, input.pendingRewards);
}

export type PendingGroup = {
  readonly childId: string;
  readonly childName: string;
  readonly count: number;
};

/** Waiting tasks counted per child, in the order the children are listed, so a parent sees whose tasks a bulk approval covers. */
export function groupPendingByChild(
  logs: readonly Pick<ActivityLog, 'id' | 'childId'>[],
  profiles: readonly Pick<ChildProfile, 'id' | 'name' | 'nickname'>[],
): PendingGroup[] {
  return profiles
    .map((profile) => ({
      childId: profile.id,
      childName: profile.nickname || profile.name,
      count: logs.filter((log) => log.childId === profile.id).length,
    }))
    .filter((group) => group.count > 0);
}

export function toggleSelection(selected: ReadonlySet<string>, id: string, limit = Infinity): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else if (next.size < limit) next.add(id);
  return next;
}

/** Everything is ticked when every waiting log is; selecting all of a longer list is capped by the batch limit. */
export function selectAllPending(pendingIds: readonly string[], limit: number): Set<string> {
  return new Set(pendingIds.slice(0, limit));
}
