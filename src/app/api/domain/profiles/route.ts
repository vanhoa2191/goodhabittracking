import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { profileMutationSchema } from '@/lib/domain/profile-mutations';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const commandResultSchema = z.object({ profileId: z.string().uuid() }).passthrough();

type ProfileErrorCode =
  | 'authentication_required'
  | 'family_membership_required'
  | 'invalid_profile_mutation'
  | 'child_limit_reached'
  | 'profile_not_found'
  | 'profile_conflict'
  | 'profile_service_unavailable'
  | 'profile_mutation_failed';

function classifyProfileError(error: { code?: string; message?: string }): {
  code: ProfileErrorCode;
  status: number;
} {
  const message = error.message ?? '';
  if (message.includes('profile_access_denied') || message.includes('family_membership_required')) {
    return { code: 'family_membership_required', status: 403 };
  }
  if (message.includes('free_plan_child_limit_reached') || message.includes('child_limit_reached')) {
    return { code: 'child_limit_reached', status: 409 };
  }
  if (message.includes('profile_not_found')) {
    return { code: 'profile_not_found', status: 404 };
  }
  if (error.code === '23505' || message.includes('profile_conflict')) {
    return { code: 'profile_conflict', status: 409 };
  }
  if (
    message.includes('profile_name_required')
    || message.includes('invalid_initial_progress')
    || message.includes('invalid_starter_activities')
    || message.includes('starter_activity_child_mismatch')
    || message.includes('invalid_profile_mutation')
  ) {
    return { code: 'invalid_profile_mutation', status: 400 };
  }
  if (error.code?.startsWith('PGRST') || error.code === '08006') {
    return { code: 'profile_service_unavailable', status: 503 };
  }
  return { code: 'profile_mutation_failed', status: 409 };
}

function failure(error: string, errorCode: ProfileErrorCode, correlationId: string, status: number) {
  return NextResponse.json(
    { success: false, error, errorCode, correlationId },
    { status },
  );
}

async function readBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (error: unknown) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  const parent = await getParentContext();
  if (!parent) {
    return failure('Authentication required.', 'authentication_required', correlationId, 401);
  }

  const parsed = profileMutationSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return failure('Invalid profile mutation.', 'invalid_profile_mutation', correlationId, 400);
  }

  const supabase = await createServerSupabaseClient();
  const mutation = parsed.data;
  let data: unknown;
  let error: { code?: string; message?: string } | null;
  try {
    const result = await supabase.rpc('mutate_child_profile_command', {
      mutation_input: mutation,
    });
    data = result.data;
    error = result.error;
  } catch {
    logOperationalEvent('error', {
      operation: `profile_${mutation.type}`,
      reasonCode: 'profile_service_unavailable',
      correlationId,
      route: request.nextUrl.pathname,
      status: 503,
    });
    return failure(
      'Profile service is temporarily unavailable.',
      'profile_service_unavailable',
      correlationId,
      503,
    );
  }
  const commandResult = commandResultSchema.safeParse(data);
  if (error || !commandResult.success) {
    const classified = error
      ? classifyProfileError(error)
      : { code: 'profile_mutation_failed' as const, status: 500 };
    logOperationalEvent('error', {
      operation: `profile_${mutation.type}`,
      reasonCode: classified.code,
      correlationId,
      route: request.nextUrl.pathname,
      status: classified.status,
    });
    return failure(
      'The child profile could not be saved.',
      classified.code,
      correlationId,
      classified.status,
    );
  }

  return NextResponse.json({
    success: true,
    profileId: commandResult.data.profileId,
    correlationId,
  });
}
