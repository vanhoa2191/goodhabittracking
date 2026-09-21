import { z } from 'zod';
import {
  activityMutationSchema,
  type ActivityMutation,
} from '@/lib/domain/activity-mutations';

const activityMutationResponseSchema = z.union([
  z.object({
    success: z.literal(true),
    activityId: z.string().uuid(),
    correlationId: z.string().uuid().optional(),
  }).strict(),
  z.object({
    success: z.literal(true),
    activityIds: z.array(z.string().uuid()).min(1),
    correlationId: z.string().uuid().optional(),
  }).strict(),
  z.object({
    success: z.literal(false),
    error: z.string().min(1),
    correlationId: z.string().uuid().optional(),
  }).strict(),
]);

export type ActivityMutationRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class ActivityMutationRequestError extends Error {
  readonly name = 'ActivityMutationRequestError';

  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function requestActivityMutation(
  mutation: ActivityMutation,
  requester: ActivityMutationRequester = globalThis.fetch,
): Promise<{ readonly activityIds: readonly string[] }> {
  const parsedMutation = activityMutationSchema.parse(mutation);
  const response = await requester('/api/domain/activities', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsedMutation),
  });
  const input: unknown = await response.json();
  const parsedResponse = activityMutationResponseSchema.safeParse(input);
  if (!parsedResponse.success) {
    throw new ActivityMutationRequestError(
      'The server returned an invalid activity response.',
      response.status,
    );
  }
  if (!response.ok || !parsedResponse.data.success) {
    const message = parsedResponse.data.success
      ? 'The habit could not be saved.'
      : parsedResponse.data.error;
    throw new ActivityMutationRequestError(message, response.status);
  }
  return {
    activityIds: 'activityIds' in parsedResponse.data
      ? parsedResponse.data.activityIds
      : [parsedResponse.data.activityId],
  };
}
