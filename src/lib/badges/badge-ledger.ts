const LEDGER_PREFIX = 'kidhabit_badge_ledger_v1_';

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Badges a child has already been congratulated on, on this device. Returns null when the
 * child has never been seen here, so existing progress can be recorded without a burst of
 * celebrations.
 */
export function readBadgeLedger(childId: string): Set<string> | null {
  const raw = storage()?.getItem(`${LEDGER_PREFIX}${childId}`);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter((id): id is string => typeof id === 'string')) : null;
  } catch {
    return null;
  }
}

export function writeBadgeLedger(childId: string, badgeIds: ReadonlySet<string>): void {
  try {
    storage()?.setItem(`${LEDGER_PREFIX}${childId}`, JSON.stringify([...badgeIds]));
  } catch {
    // Private mode or a full quota only means the child may be congratulated again later.
  }
}
