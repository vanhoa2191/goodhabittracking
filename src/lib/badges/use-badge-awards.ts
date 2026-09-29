'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActivityLog, Badge, ChildBadge, ChildProfile, HabitActivity } from '@/types';
import { readBadgeLedger, writeBadgeLedger } from './badge-ledger';
import { computeBadgeMetrics, qualifiedBadgeIds } from './badge-progress';

const MAX_CELEBRATIONS_PER_UPDATE = 5;

type BadgeAwardsInput = {
  readonly child: ChildProfile | null;
  readonly badges: readonly Badge[];
  readonly logs: readonly ActivityLog[];
  readonly activities: readonly HabitActivity[];
  readonly childBadges: readonly ChildBadge[];
};

export type BadgeAwards = {
  /** Every badge the child holds: stored awards plus everything already celebrated. */
  readonly unlockedIds: ReadonlySet<string>;
  /** Badges waiting for a congratulation, oldest first. */
  readonly pending: readonly Badge[];
  readonly dismiss: () => void;
};

/**
 * Works out which badges the child's progress has earned and queues a congratulation for each
 * new one. Works the same for local, demo and cloud families because it reads only the shared
 * progress data; the per-device ledger keeps a badge from being celebrated twice.
 */
export function useBadgeAwards({ child, badges, logs, activities, childBadges }: BadgeAwardsInput): BadgeAwards {
  const [queue, setQueue] = useState<{ childId: string; ids: string[] }>({ childId: '', ids: [] });
  const [ledger, setLedger] = useState<{ childId: string; ids: ReadonlySet<string> }>({ childId: '', ids: new Set() });

  const childId = child?.id ?? null;
  const metrics = useMemo(
    () => child ? computeBadgeMetrics(child, logs, activities) : null,
    // The profile object changes on every point; only these fields feed the metrics.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childId, child?.streak, child?.totalEarned, logs, activities],
  );
  const storedIds = useMemo(
    () => new Set(childBadges.filter((row) => row.childId === childId).map((row) => row.badgeId)),
    [childBadges, childId],
  );

  useEffect(() => {
    if (!childId || !metrics) return;
    const qualified = qualifiedBadgeIds(badges, metrics, storedIds);
    const known = readBadgeLedger(childId);
    queueMicrotask(() => {
      if (!known) {
        const seeded = new Set([...qualified, ...storedIds]);
        writeBadgeLedger(childId, seeded);
        setLedger({ childId, ids: seeded });
        return;
      }
      const fresh = [...qualified].filter((id) => !known.has(id));
      if (fresh.length === 0) {
        setLedger((current) => current.childId === childId && current.ids.size === known.size ? current : { childId, ids: known });
        return;
      }
      const next = new Set([...known, ...fresh, ...storedIds]);
      writeBadgeLedger(childId, next);
      setLedger({ childId, ids: next });
      // One tap earns a handful of badges at most; more than that is a history that just finished loading.
      if (fresh.length > MAX_CELEBRATIONS_PER_UPDATE) return;
      setQueue((current) => ({
        childId,
        ids: [...(current.childId === childId ? current.ids : []), ...fresh],
      }));
    });
  }, [badges, childId, metrics, storedIds]);

  const unlockedIds = useMemo(() => {
    const ids = new Set(storedIds);
    if (ledger.childId === childId) for (const id of ledger.ids) ids.add(id);
    return ids;
  }, [childId, ledger, storedIds]);

  const pending = useMemo(() => {
    if (queue.childId !== childId) return [];
    const byId = new Map(badges.map((badge) => [badge.id, badge]));
    return queue.ids.flatMap((id) => byId.get(id) ?? []);
  }, [badges, childId, queue]);

  const dismiss = useCallback(() => {
    setQueue((current) => ({ ...current, ids: current.ids.slice(1) }));
  }, []);

  return { unlockedIds, pending, dismiss };
}
