import { z } from 'zod';

const eventSchema = z.discriminatedUnion('event', [
  z.strictObject({ event: z.literal('session_started'), mode: z.enum(['demo', 'local', 'cloud']) }),
  z.strictObject({ event: z.literal('task_ticked'), action: z.enum(['completed', 'pending_approval', 'undone']), mode: z.enum(['local', 'cloud']) }),
  z.strictObject({ event: z.literal('habit_reviewed'), decision: z.enum(['approved', 'rejected']), approvalLag: z.enum(['under_1h', 'under_1d', 'over_1d', 'unknown']), mode: z.enum(['local', 'cloud']) }),
  z.strictObject({ event: z.literal('mascot_selected'), mode: z.enum(['local', 'cloud']) }),
  z.strictObject({ event: z.literal('mascot_letter_read'), mode: z.enum(['local', 'cloud']) }),
  z.strictObject({ event: z.literal('secret_quest_completed'), mode: z.enum(['local', 'cloud']) }),
  z.strictObject({ event: z.literal('wishlist_selected'), mode: z.enum(['local', 'cloud']) }),
]);

export type ProductEvent = z.infer<typeof eventSchema>;
export type ProductEventSink = (event: ProductEvent) => void;

export function parseProductEvent(payload: unknown): ProductEvent | null {
  const parsed = eventSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export function trackProductEvent(payload: ProductEvent, sink?: ProductEventSink): boolean {
  if (!sink) return false;
  const event = parseProductEvent(payload);
  if (!event) return false;
  try {
    sink(event);
    return true;
  } catch {
    return false;
  }
}

export function createSessionTracker(sink?: ProductEventSink) {
  let activeMode: 'demo' | 'local' | 'cloud' | null = null;
  let activeChildId: string | null = null;
  return {
    enter(mode: 'demo' | 'local' | 'cloud', childId: string | null = null): void {
      if (activeMode === mode && activeChildId === childId) return;
      activeMode = mode;
      activeChildId = childId;
      trackProductEvent({ event: 'session_started', mode }, sink);
    },
    leave(): void {
      activeMode = null;
      activeChildId = null;
    },
  };
}

export type ProductSessionState = {
  readonly isLoaded: boolean;
  readonly mode: 'kid' | 'parent';
  readonly activeChildId: string | null;
  readonly isDemoSession: boolean;
  readonly isFamilyConnected: boolean;
  readonly hasCloudSnapshot: boolean;
  readonly storageMode: 'local' | 'cloud';
};

export function sessionMode(state: ProductSessionState): 'demo' | 'local' | 'cloud' | null {
  if (!state.isLoaded || state.mode !== 'kid' || !state.activeChildId) return null;
  if (state.isDemoSession) return 'demo';
  if (state.isFamilyConnected || (state.hasCloudSnapshot && state.storageMode === 'cloud')) return 'cloud';
  return state.storageMode === 'local' ? 'local' : null;
}

export function approvalLagBucket(completedAt: string | null | undefined, reviewedAt: Date = new Date()): 'under_1h' | 'under_1d' | 'over_1d' | 'unknown' {
  if (!completedAt) return 'unknown';
  const elapsed = reviewedAt.getTime() - Date.parse(completedAt);
  if (!Number.isFinite(elapsed) || elapsed < 0) return 'unknown';
  if (elapsed < 60 * 60 * 1000) return 'under_1h';
  if (elapsed < 24 * 60 * 60 * 1000) return 'under_1d';
  return 'over_1d';
}
