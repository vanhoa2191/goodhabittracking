import { z } from 'zod';
import { profileMutationSchema, type ProfileMutation } from '@/lib/domain/profile-mutations';

const responseSchema = z.union([
  z.object({
    success: z.literal(true),
    profileId: z.string().uuid(),
    correlationId: z.string().uuid().optional(),
  }).strict(),
  z.object({
    success: z.literal(false),
    error: z.string().min(1),
    errorCode: z.enum([
      'authentication_required',
      'family_membership_required',
      'invalid_profile_mutation',
      'child_limit_reached',
      'profile_not_found',
      'profile_conflict',
      'profile_service_unavailable',
      'profile_mutation_failed',
    ]),
    correlationId: z.string().uuid().optional(),
  }).strict(),
]);

export type ProfileMutationErrorCode = Extract<
  z.infer<typeof responseSchema>,
  { success: false }
>['errorCode'];

export type ProfileMutationRequester = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class ProfileMutationRequestError extends Error {
  readonly name = 'ProfileMutationRequestError';

  constructor(
    message: string,
    readonly status: number,
    readonly code: ProfileMutationErrorCode = 'profile_mutation_failed',
    readonly correlationId?: string,
  ) {
    super(message);
  }
}

export async function requestProfileMutation(
  mutation: ProfileMutation,
  requester: ProfileMutationRequester = globalThis.fetch,
): Promise<{ readonly profileId: string }> {
  const parsedMutation = profileMutationSchema.parse(mutation);
  const response = await requester('/api/domain/profiles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsedMutation),
  });
  const input: unknown = await response.json();
  const parsedResponse = responseSchema.safeParse(input);
  if (!parsedResponse.success) {
    throw new ProfileMutationRequestError(
      'The server returned an invalid profile response.',
      response.status,
    );
  }
  if (!response.ok || !parsedResponse.data.success) {
    throw new ProfileMutationRequestError(
      parsedResponse.data.success ? 'The profile could not be saved.' : parsedResponse.data.error,
      response.status,
      parsedResponse.data.success ? 'profile_mutation_failed' : parsedResponse.data.errorCode,
      parsedResponse.data.correlationId,
    );
  }
  return { profileId: parsedResponse.data.profileId };
}
