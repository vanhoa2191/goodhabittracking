import { z } from 'zod';
import {
  childDomainCommandSchema,
  domainCommandSchema,
  type ChildDomainCommand,
  type DomainCommand,
} from '@/lib/domain/commands';

const domainCommandResultSchema = z.object({
  status: z.enum([
    'completed',
    'pending_approval',
    'duplicate',
    'undone',
    'not_found',
    'not_reversible',
    'approved',
    'rejected',
    'already_reviewed',
    'pending',
    'insufficient_points',
    'out_of_stock',
    'delivered',
    'invalid_transition',
  ]),
  logId: z.string().uuid().optional(),
  redemptionId: z.string().uuid().optional(),
  pointsAwarded: z.number().int().optional(),
});

const domainCommandResponseSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), result: domainCommandResultSchema }),
  z.object({ success: z.literal(false), error: z.string().min(1) }),
]);

export type DomainCommandRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class DomainCommandRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'DomainCommandRequestError';
    this.status = status;
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
  const input: unknown = await response.json();
  const parsedResponse = domainCommandResponseSchema.safeParse(input);

  if (!parsedResponse.success) {
    throw new DomainCommandRequestError('The server returned an invalid command response.', response.status);
  }
  if (!response.ok || !parsedResponse.data.success) {
    const message = parsedResponse.data.success
      ? 'The change could not be saved.'
      : parsedResponse.data.error;
    throw new DomainCommandRequestError(message, response.status);
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
  const input: unknown = await response.json();
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
    throw new DomainCommandRequestError(message, response.status);
  }
  return parsedResponse.data.result;
}
