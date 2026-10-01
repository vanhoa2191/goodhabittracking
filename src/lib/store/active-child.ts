import type { ChildProfile } from '@/types';

/**
 * The child the screens show is the selected one, or the first child when none is selected yet (a parent who
 * opens the child area straight after signing in). Saving must use the same child, so both read it from here.
 */
export function resolveActiveChildId(
  profiles: readonly Pick<ChildProfile, 'id'>[],
  selectedChildId: string | null,
): string | null {
  if (selectedChildId && profiles.some((profile) => profile.id === selectedChildId)) return selectedChildId;
  return profiles[0]?.id ?? null;
}
