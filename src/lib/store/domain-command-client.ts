import { z } from 'zod';
import {
  childDomainCommandSchema,
  domainCommandSchema,
  type ChildDomainCommand,
  type DomainCommand,
} from '@/lib/domain/commands';

const reviewedLogSchema = z.object({
  logId: z.string().uuid(),
  status: z.enum(['approved', 'rejected', 'already_reviewed', 'not_found']),
  pointsAwarded: z.number().int().optional(),
});

const domainCommandResultSchema = z.object({
  status: z.enum([
    'reviewed',
    'completed',
    'pending_approval',
    'duplicate',
    'undone',
    'not_found',
    'not_reversible',
    'points_already_spent',
    'approved',
    'rejected',
    'already_reviewed',
    'pending',
    'insufficient_points',
    'out_of_stock',
    'delivered',
    'invalid_transition',
    'adjusted',
  ]),
  logId: z.string().uuid().optional(),
  redemptionId: z.string().uuid().optional(),
  pointsAwarded: z.number().int().optional(),
  results: z.array(reviewedLogSchema).optional(),
});

// Reject mixed outcomes instead of letting Zod discard the contradictory field.
const domainCommandResponseSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), result: domainCommandResultSchema, error: z.never().optional() }),
  z.object({ success: z.literal(false), error: z.string().min(1), result: z.never().optional() }),
]);

// PIN middleware refuses before execution and returns a bare { error, code } body.
const parentPinRefusalSchema = z.object({
  error: z.string().min(1),
  code: z.enum(['parent_pin_required', 'parent_pin_not_set']),
  success: z.never().optional(),
  result: z.never().optional(),
});

export type DomainCommandRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class DomainCommandRequestError extends Error {
  readonly status: number;
  readonly outcome: 'refused' | 'unknown';

  constructor(message: string, status: number, outcome: 'refused' | 'unknown' = 'unknown') {
    super(message);
    this.name = 'DomainCommandRequestError';
    this.status = status;
    this.outcome = outcome;
  }
}

export async function requestDomainCommand(
  command: DomainCommand,
  requester: DomainCommandRequester = globalThis.fetch,
): Promise<z.infer<typeof domainCommandResultSchema>> {
  const parsedCommand = domainCommandSchema.parse(command);
  const response = await requester('/api/domain/commands', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsedCommand),
  });
  const input: unknown = await response.json().catch(() => null);
  const parsedResponse = domainCommandResponseSchema.safeParse(input);

  if (!parsedResponse.success) {
    const pinRefusal = response.status === 403 ? parentPinRefusalSchema.safeParse(input) : null;
    if (pinRefusal?.success) {
      throw new DomainCommandRequestError(pinRefusal.data.error, response.status, 'refused');
    }
    throw new DomainCommandRequestError('The server returned an invalid command response.', response.status);
  }
  if (!response.ok || !parsedResponse.data.success) {
    const message = parsedResponse.data.success
      ? 'The change could not be saved.'
      : parsedResponse.data.error;
    // These known route responses happen before a command or explicitly refuse its RPC.
    // 5xx, contradictory envelopes and malformed bodies never prove non-commit.
    const refused = !parsedResponse.data.success && [400, 401, 403, 409, 429].includes(response.status);
    throw new DomainCommandRequestError(message, response.status, refused ? 'refused' : 'unknown');
  }
  return parsedResponse.data.result;
}

export async function requestChildDomainCommand(
  command: ChildDomainCommand,
  requester: DomainCommandRequester = globalThis.fetch,
): Promise<z.infer<typeof domainCommandResultSchema>> {
  const parsedCommand = childDomainCommandSchema.parse(command);
  const response = await requester('/api/child/commands', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsedCommand),
  });
  const input: unknown = await response.json().catch(() => null);
  const parsedResponse = domainCommandResponseSchema.safeParse(input);

  if (!parsedResponse.success) {
    throw new DomainCommandRequestError(
      'The server returned an invalid child command response.',
      response.status,
    );
  }
  if (!response.ok || !parsedResponse.data.success) {
    const message = parsedResponse.data.success
      ? 'The child action could not be saved.'
      : parsedResponse.data.error;
    const refused = !parsedResponse.data.success && [400, 401, 403, 409, 429].includes(response.status);
    throw new DomainCommandRequestError(message, response.status, refused ? 'refused' : 'unknown');
  }
  return parsedResponse.data.result;
}
