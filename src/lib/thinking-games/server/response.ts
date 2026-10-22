import { z } from 'zod';

export const thinkingGameResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    schemaVersion: z.literal('v1'),
    status: z.enum([
      'available', 'started', 'finished', 'retry', 'paused', 'bonus_locked',
      'bonus_not_eligible', 'bonus_pending_approval', 'bonus_quiet_hours',
      'duplicate', 'journey_complete',
    ]),
    data: z.unknown().optional(),
  }),
  z.object({
    ok: z.literal(false),
    schemaVersion: z.literal('v1'),
    code: z.string(),
    messageKey: z.string(),
  }),
]);

export type ThinkingGameResponse = z.infer<typeof thinkingGameResponseSchema>;

export function success(status: z.infer<typeof thinkingGameResponseSchema> extends infer T
  ? T extends { ok: true; status: infer S } ? S : never : never, data?: unknown) {
  return { ok: true as const, schemaVersion: 'v1' as const, status, ...(data === undefined ? {} : { data }) };
}

export function failure(code: string, messageKey = `thinkingGames.${code}`) {
  return { ok: false as const, schemaVersion: 'v1' as const, code, messageKey };
}
