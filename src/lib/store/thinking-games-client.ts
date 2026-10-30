import type { GameAgeTrack } from '@/lib/thinking-games/types';
import { z } from 'zod';

const successSchema = z.object({
  ok: z.literal(true),
  schemaVersion: z.literal('v1'),
  status: z.enum([
    'available', 'started', 'finished', 'retry', 'paused', 'bonus_locked',
    'bonus_not_eligible', 'bonus_pending_approval', 'bonus_quiet_hours',
    'duplicate', 'journey_complete',
  ]),
  data: z.unknown().optional(),
});
const failureSchema = z.object({
  ok: z.literal(false),
  schemaVersion: z.literal('v1'),
  code: z.string().min(1),
  messageKey: z.string().min(1),
});
export const thinkingGameResponseSchema = z.discriminatedUnion('ok', [successSchema, failureSchema]);
export type ThinkingGameResponse = z.infer<typeof thinkingGameResponseSchema>;
export type ThinkingGameRequester = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class ThinkingGameRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly outcome: 'refused' | 'unknown';
  constructor(message: string, status: number, code: string, outcome: 'refused' | 'unknown') {
    super(message);
    this.name = 'ThinkingGameRequestError';
    this.status = status;
    this.code = code;
    this.outcome = outcome;
  }
}

async function request(
  path: string,
  init: RequestInit | undefined,
  requester: ThinkingGameRequester,
): Promise<ThinkingGameResponse> {
  const response = await requester(path, init);
  const body: unknown = await response.json().catch(() => null);
  const parsed = thinkingGameResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ThinkingGameRequestError('Invalid thinking-game response.', response.status, 'invalid_response', 'unknown');
  }
  if (!response.ok || !parsed.data.ok) {
    const code = parsed.data.ok ? 'http_error' : parsed.data.code;
    const refused = [400, 401, 403, 404, 409, 429].includes(response.status);
    throw new ThinkingGameRequestError(
      parsed.data.ok ? 'Thinking-game request failed.' : parsed.data.messageKey,
      response.status, code, refused ? 'refused' : 'unknown',
    );
  }
  return parsed.data;
}

const json = (body: unknown, method = 'POST'): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

export function getThinkingGameState(expectedLocalDay?: string, requester: ThinkingGameRequester = fetch) {
  const query = expectedLocalDay ? `?expectedLocalDay=${encodeURIComponent(expectedLocalDay)}` : '';
  return request(`/api/child/thinking-games/state${query}`, undefined, requester);
}
export function getThinkingGameParentState(input: { childId: string; expectedLocalDay?: string }, requester: ThinkingGameRequester = fetch) {
  const query = new URLSearchParams({ childId: input.childId });
  if (input.expectedLocalDay) query.set('expectedLocalDay', input.expectedLocalDay);
  return request(`/api/domain/thinking-games/state?${query.toString()}`, undefined, requester);
}
export function getThinkingGameChildSettings(requester: ThinkingGameRequester = fetch) {
  return request('/api/child/thinking-games/settings', undefined, requester);
}
export function startThinkingGame(input: { slot: 'main' | 'bonus'; expectedLocalDay: string; commandId: string }, requester: ThinkingGameRequester = fetch) {
  return request('/api/child/thinking-games/start', json(input), requester);
}
export function startThinkingGameForParent(input: { childId: string; slot: 'main' | 'bonus'; expectedLocalDay: string; commandId: string }, requester: ThinkingGameRequester = fetch) {
  return request('/api/domain/thinking-games/start', json(input), requester);
}
export function pauseThinkingGame(input: { attemptId: string; commandId: string }, requester: ThinkingGameRequester = fetch) {
  return request('/api/child/thinking-games/pause', json(input), requester);
}
export function pauseThinkingGameForParent(input: { childId: string; attemptId: string; commandId: string }, requester: ThinkingGameRequester = fetch) {
  return request('/api/domain/thinking-games/pause', json(input), requester);
}
export function finishThinkingGame(input: { attemptId: string; answer: unknown; commandId: string }, requester: ThinkingGameRequester = fetch) {
  return request('/api/child/thinking-games/finish', json(input), requester);
}
export function finishThinkingGameForParent(input: { childId: string; attemptId: string; answer: unknown; commandId: string }, requester: ThinkingGameRequester = fetch) {
  return request('/api/domain/thinking-games/finish', json(input), requester);
}
export function getThinkingGameParentSettings(requester: ThinkingGameRequester = fetch) {
  return request('/api/domain/thinking-games/settings', undefined, requester);
}
export function updateThinkingGameParentSettings(input: {
  enabled: boolean; bonusEnabled: boolean; timezone: string; cutoffLocal: string;
  bedtimeStartLocal: string; bedtimeEndLocal: string; ageTrackOverride: GameAgeTrack | null; commandId: string;
}, requester: ThinkingGameRequester = fetch) {
  return request('/api/domain/thinking-games/settings', json(input, 'PUT'), requester);
}
export function previewThinkingGameDay(input: { childId: string; localDay: string }, requester: ThinkingGameRequester = fetch) {
  return request(`/api/domain/thinking-games/preview?childId=${encodeURIComponent(input.childId)}&localDay=${encodeURIComponent(input.localDay)}`, undefined, requester);
}
export function excuseThinkingGameTask(input: {
  childId: string; localDay: string; activityId: string; reason: string; commandId: string;
}, requester: ThinkingGameRequester = fetch) {
  return request('/api/domain/thinking-games/excuse', json(input), requester);
}
