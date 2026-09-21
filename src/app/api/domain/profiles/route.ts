import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { profileMutationSchema } from '@/lib/domain/profile-mutations';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const commandResultSchema = z.object({ profileId: z.string().uuid() }).passthrough();

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
    return NextResponse.json(
      { success: false, error: 'Authentication required.', correlationId },
      { status: 401 },
    );
  }

  const parsed = profileMutationSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid profile mutation.', correlationId },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const mutation = parsed.data;
  const { data, error } = await supabase.rpc('mutate_child_profile_command', {
    mutation_input: mutation,
  });
  const commandResult = commandResultSchema.safeParse(data);
  if (error || !commandResult.success) {
    logOperationalEvent('error', {
      operation: `profile_${mutation.type}`,
      reasonCode: error?.code ?? 'profile_mutation_failed',
      correlationId,
      route: request.nextUrl.pathname,
      status: 409,
    });
    return NextResponse.json(
      { success: false, error: 'The child profile could not be saved.', correlationId },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    profileId: commandResult.data.profileId,
    correlationId,
  });
}
