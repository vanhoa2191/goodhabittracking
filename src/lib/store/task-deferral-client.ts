import { z } from 'zod';
import { parseDeferredTasks } from '@/lib/experience-state';
import type { DeferredTask } from '@/lib/experience-state';

type Requester = (url: string, init?: RequestInit) => Promise<Response>;

export async function loadChildTaskDeferrals(request: Requester = fetch): Promise<DeferredTask[] | null> {
  const response = await request('/api/child/task-deferrals', { cache: 'no-store' });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  const parsed = z.object({ deferredTasks: z.unknown() }).safeParse(payload);
  if (!parsed.success) return null;
  return parseDeferredTasks(parsed.data.deferredTasks);
}
