import { z } from 'zod';
import type { FamilyPausePeriod } from '@/lib/experience-state';
import type { ActivityLog, ChildProfile, HabitActivity, Redemption, Reward } from '@/types';

type Requester = (url: string, init?: RequestInit) => Promise<Response>;

export type PairingCredential = {
  readonly childId: string;
  readonly code: string;
  readonly qrPayload: string;
  readonly rotatedAt: string;
};

export type PairingExchangeInput =
  | { readonly code: string }
  | { readonly token: string };

export interface ChildSession {
  familyPausedAt: string | null;
  familyPausePeriods: FamilyPausePeriod[];
  child: ChildProfile;
  activities: HabitActivity[];
  logs: ActivityLog[];
  rewards: Reward[];
  redemptions: Redemption[];
}

type ChildSessionResult =
  | { success: true; session: ChildSession }
  | { success: false; message: string };

const optionalString = z.string().nullish().transform((value) => value ?? undefined);
const optionalNumber = z.number().nullish().transform((value) => value ?? undefined);

const childProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  nickname: optionalString,
  avatar: z.string(),
  themeColor: z.string(),
  points: z.number(),
  totalEarned: z.number(),
  level: z.number(),
  streak: z.number(),
  birthYear: optionalNumber,
  ageStage: z.enum(['0-3', '3-6', '6-12', '12-18']).nullish().transform((value) => value ?? undefined),
  lastActiveDate: optionalString,
  leagueTier: z.enum(['bronze', 'silver', 'gold', 'diamond']).nullish().transform((value) => value ?? undefined),
  createdAt: z.string(),
});

const activitySchema = z.object({
  id: z.string(),
  childId: z.string().nullable(),
  title: z.string(),
  description: optionalString,
  instructions: optionalString,
  icon: z.string(),
  category: z.enum([
    'wisdom', 'mindset', 'personality', 'virtue', 'capacity', 'giving', 'nutrition',
    'physical', 'study', 'chores', 'health', 'selfcare', 'kindness',
  ]),
  points: z.number(),
  recurrenceType: z.enum(['daily', 'weekdays', 'weekends', 'custom']),
  recurrenceDays: z.array(z.number()),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
  durationMinutes: optionalNumber,
  requiresApproval: z.boolean(),
  isActive: z.boolean(),
  targetAgeStage: z.enum(['0-3', '3-6', '6-12', '12-18', 'all']).nullish().transform((value) => value ?? undefined),
  isParentRole: z.boolean().nullish().transform((value) => value ?? undefined),
  portrait16Key: optionalString,
  boThi7Key: z.enum(['nhan', 'nhan_mat', 'ngon', 'tam', 'phong', 'than', 'toa']).nullish().transform((value) => value ?? undefined),
  frameworkHabitId: optionalString,
  frameworkContentVersion: optionalString,
  legacyTemplateId: optionalString,
  createdAt: z.string(),
});

const rewardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: optionalString,
  icon: z.string(),
  costPoints: z.number(),
  stock: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

const activityLogSchema = z.object({
  id: z.string(),
  activityId: z.string(),
  childId: z.string(),
  date: z.string(),
  status: z.enum(['completed', 'pending_approval', 'approved', 'rejected']),
  pointsAwarded: z.number(),
  completedAt: z.string(),
  proofNote: optionalString,
});

const redemptionSchema = z.object({
  id: z.string(),
  rewardId: z.string(),
  childId: z.string(),
  pointsSpent: z.number(),
  status: z.enum(['pending', 'approved', 'delivered', 'rejected']),
  requestedAt: z.string(),
  resolvedAt: optionalString,
});

const childSessionSchema = z.object({
  familyPausedAt: z.string().datetime().nullable(),
  familyPausePeriods: z.array(z.object({
    startedAt: z.string().datetime({ offset: true }),
    endedAt: z.string().datetime({ offset: true }).nullable(),
  })).default([]),
  child: childProfileSchema,
  activities: z.array(activitySchema),
  logs: z.array(activityLogSchema),
  rewards: z.array(rewardSchema),
  redemptions: z.array(redemptionSchema),
});

const errorSchema = z.object({ error: z.string() });
const pairingCredentialSchema = z.object({
  childId: z.string(),
  code: z.string().regex(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/),
  qrPayload: z.string().url(),
  rotatedAt: z.string(),
});

async function readJson(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

export async function createPairingChallenge(
  childId: string,
  request: Requester = fetch,
): Promise<string | null> {
  return (await readPairingCredential(childId, request))?.code ?? null;
}

async function requestPairingCredential(
  url: string,
  childId: string,
  request: Requester,
): Promise<PairingCredential | null> {
  const response = await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ childId }),
  });
  if (!response.ok) return null;
  const parsed = pairingCredentialSchema.safeParse(await readJson(response));
  return parsed.success ? parsed.data : null;
}

export function readPairingCredential(
  childId: string,
  request: Requester = fetch,
): Promise<PairingCredential | null> {
  return requestPairingCredential('/api/pairing/credentials', childId, request);
}

export function rotatePairingCredential(
  childId: string,
  request: Requester = fetch,
): Promise<PairingCredential | null> {
  return requestPairingCredential('/api/pairing/credentials/rotate', childId, request);
}

export async function loadChildSession(request: Requester = fetch): Promise<ChildSessionResult> {
  const response = await request('/api/child/session', { cache: 'no-store' });
  const payload = await readJson(response);
  if (!response.ok) {
    const failure = errorSchema.safeParse(payload);
    return {
      success: false,
      message: failure.success ? failure.data.error : 'Không thể tải dữ liệu của bé.',
    };
  }

  const parsed = childSessionSchema.safeParse(payload);
  return parsed.success
    ? { success: true, session: parsed.data }
    : { success: false, message: 'Không thể tải dữ liệu của bé.' };
}

export async function connectChildDevice(
  input: string | PairingExchangeInput,
  request: Requester = fetch,
): Promise<ChildSessionResult> {
  try {
    const credential = typeof input === 'string' ? { code: input } : input;
    const response = await request('/api/pairing/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credential),
    });
    const payload = await readJson(response);
    if (!response.ok || !z.object({ success: z.literal(true) }).safeParse(payload).success) {
      const failure = errorSchema.safeParse(payload);
      return {
        success: false,
        message: failure.success ? failure.data.error : 'Mã kết nối không hợp lệ.',
      };
    }
    return loadChildSession(request);
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : '';
    return { success: false, message: `Không thể kết nối máy chủ: ${detail}` };
  }
}

export async function disconnectChildDevice(request: Requester = fetch): Promise<void> {
  await request('/api/child/session', { method: 'DELETE' });
}
