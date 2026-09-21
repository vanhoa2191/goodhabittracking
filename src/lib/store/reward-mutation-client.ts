import { z } from 'zod';
import {
  rewardMutationSchema,
  type RewardMutation,
} from '@/lib/domain/reward-mutations';

const rewardMutationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    rewardId: z.string().uuid(),
    correlationId: z.string().uuid().optional(),
  }).strict(),
  z.object({
    success: z.literal(false),
    error: z.string().min(1),
    correlationId: z.string().uuid().optional(),
  }).strict(),
]);

export type RewardMutationRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class RewardMutationRequestError extends Error {
  readonly name = 'RewardMutationRequestError';

  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function requestRewardMutation(
  mutation: RewardMutation,
  requester: RewardMutationRequester = globalThis.fetch,
): Promise<{ readonly rewardId: string }> {
  const parsedMutation = rewardMutationSchema.parse(mutation);
  const response = await requester('/api/domain/rewards', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsedMutation),
  });
  const input: unknown = await response.json();
  const parsedResponse = rewardMutationResponseSchema.safeParse(input);
  if (!parsedResponse.success) {
    throw new RewardMutationRequestError(
      'The server returned an invalid reward response.',
      response.status,
    );
  }
  if (!response.ok || !parsedResponse.data.success) {
    const message = parsedResponse.data.success
      ? 'The reward could not be saved.'
      : parsedResponse.data.error;
    throw new RewardMutationRequestError(message, response.status);
  }
  return { rewardId: parsedResponse.data.rewardId };
}
