import { z } from 'zod';
import { parseCuePlans, parseSupportObservations } from '@/lib/experience-state';
import type { CuePlan, SupportObservation } from '@/lib/experience-state';

type Requester = (url: string, init?: RequestInit) => Promise<Response>;

export type ChildHabitPrograms = {
  readonly supportObservations: SupportObservation[];
  readonly cuePlans: CuePlan[];
};

/** Loads what a paired child device may see; null means "leave the current state alone". */
export async function loadChildHabitPrograms(request: Requester = fetch): Promise<ChildHabitPrograms | null> {
  const response = await request('/api/child/habit-programs', { cache: 'no-store' });
  if (!response.ok) return null;
  const parsed = z.object({ supportObservations: z.unknown(), cuePlans: z.unknown() }).safeParse(await response.json());
  if (!parsed.success) return null;
  try {
    return {
      supportObservations: parseSupportObservations(parsed.data.supportObservations),
      cuePlans: parseCuePlans(parsed.data.cuePlans),
    };
  } catch {
    return null;
  }
}
