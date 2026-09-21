import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { socialMutationSchema } from '@/lib/domain/social-mutations';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const commandResultSchema = z.object({ entityId: z.string().uuid() }).strict();

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

  const parsed = socialMutationSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid social mutation.', correlationId },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('mutate_social_command', {
    mutation_input: parsed.data,
  });
  const result = commandResultSchema.safeParse(data);
  if (error || !result.success) {
    logOperationalEvent('error', {
      operation: `social_${parsed.data.type}`,
      reasonCode: error?.code ?? 'invalid_social_command_response',
      correlationId,
      route: request.nextUrl.pathname,
      status: 409,
    });
    return NextResponse.json(
      { success: false, error: 'The social action could not be saved.', correlationId },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    entityId: result.data.entityId,
    correlationId,
  });
}
