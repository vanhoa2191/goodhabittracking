import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import {
  rewardMutationSchema,
  type RewardMutation,
} from '@/lib/domain/reward-mutations';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type CreatedReward = Extract<RewardMutation, { readonly type: 'create' }>['reward'];

function createRow(
  reward: CreatedReward,
  familyId: string,
  userId: string,
): Record<string, unknown> {
  return {
    id: reward.id,
    family_id: familyId,
    user_id: userId,
    title: reward.title,
    description: reward.description,
    icon: reward.icon,
    cost_points: reward.costPoints,
    stock: reward.stock,
    is_active: reward.isActive,
    created_at: reward.createdAt,
  };
}

function updateRow(
  mutation: Extract<RewardMutation, { readonly type: 'update' }>,
): Record<string, unknown> {
  const updates = mutation.updates;
  const candidates: readonly (readonly [string, unknown])[] = [
    ['title', updates.title],
    ['description', updates.description],
    ['icon', updates.icon],
    ['cost_points', updates.costPoints],
    ['stock', updates.stock],
    ['is_active', updates.isActive],
  ];
  return Object.fromEntries(candidates.filter(([, value]) => value !== undefined));
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
    return NextResponse.json(
      { success: false, error: 'Authentication required.', correlationId },
      { status: 401 },
    );
  }

  const parsed = rewardMutationSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid reward mutation.', correlationId },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  let error: { readonly code?: string } | null;
  switch (parsed.data.type) {
    case 'create': {
      ({ error } = await supabase
        .from('rewards')
        .insert(createRow(parsed.data.reward, parent.familyId, parent.user.id)));
      break;
    }
    case 'update': {
      ({ error } = await supabase
        .from('rewards')
        .update(updateRow(parsed.data))
        .eq('family_id', parent.familyId)
        .eq('id', parsed.data.rewardId));
      break;
    }
    case 'delete': {
      ({ error } = await supabase
        .from('rewards')
        .delete()
        .eq('family_id', parent.familyId)
        .eq('id', parsed.data.rewardId));
      break;
    }
    default: {
      const unreachable: never = parsed.data;
      return unreachable;
    }
  }

  if (error) {
    logOperationalEvent('error', {
      operation: `reward_${parsed.data.type}`,
      reasonCode: error.code ?? 'reward_mutation_failed',
      correlationId,
      route: request.nextUrl.pathname,
      status: 409,
    });
    return NextResponse.json(
      { success: false, error: 'The reward could not be saved.', correlationId },
      { status: 409 },
    );
  }

  return NextResponse.json({
    success: true,
    rewardId: parsed.data.type === 'create' ? parsed.data.reward.id : parsed.data.rewardId,
    correlationId,
  });
}
