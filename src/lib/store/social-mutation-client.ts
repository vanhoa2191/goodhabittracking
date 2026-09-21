import { z } from 'zod';
import {
  socialMutationSchema,
  type SocialMutation,
} from '@/lib/domain/social-mutations';

const socialMutationResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    entityId: z.string().uuid().optional(),
    correlationId: z.string().uuid().optional(),
  }).strict(),
  z.object({
    success: z.literal(false),
    error: z.string().min(1),
    correlationId: z.string().uuid().optional(),
  }).strict(),
]);

export type SocialMutationRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class SocialMutationRequestError extends Error {
  readonly name = 'SocialMutationRequestError';

  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function requestSocialMutation(
  mutation: SocialMutation,
  requester: SocialMutationRequester = globalThis.fetch,
): Promise<{ readonly entityId?: string }> {
  const response = await requester('/api/domain/social', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(socialMutationSchema.parse(mutation)),
  });
  const input: unknown = await response.json();
  const parsedResponse = socialMutationResponseSchema.safeParse(input);
  if (!parsedResponse.success) {
    throw new SocialMutationRequestError(
      'The server returned an invalid social mutation response.',
      response.status,
    );
  }
  if (!response.ok || !parsedResponse.data.success) {
    const message = parsedResponse.data.success
      ? 'The social action could not be saved.'
      : parsedResponse.data.error;
    throw new SocialMutationRequestError(message, response.status);
  }
  return { entityId: parsedResponse.data.entityId };
}
