import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import {
  activityMutationSchema,
  type ActivityMutation,
} from '@/lib/domain/activity-mutations';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type CreatedActivity = Extract<ActivityMutation, { readonly type: 'create' }>['activity'];

function createRow(
  activity: CreatedActivity,
  familyId: string,
  userId: string,
): Record<string, unknown> {
  return {
    id: activity.id,
    family_id: familyId,
    user_id: userId,
    child_id: activity.childId,
    title: activity.title,
    description: activity.description,
    icon: activity.icon,
    category: activity.category,
    points: activity.points,
    recurrence_type: activity.recurrenceType,
    recurrence_days: activity.recurrenceDays,
    time_of_day: activity.timeOfDay,
    duration_minutes: activity.durationMinutes,
    requires_approval: activity.requiresApproval,
    is_active: activity.isActive,
    target_age_stage: activity.targetAgeStage ?? 'all',
    is_parent_role: activity.isParentRole ?? false,
    portrait16_key: activity.portrait16Key,
    bo_thi7_key: activity.boThi7Key,
  };
}

function updateRow(
  mutation: Extract<ActivityMutation, { readonly type: 'update' }>,
): Record<string, unknown> {
  const updates = mutation.updates;
  const candidates: readonly (readonly [string, unknown])[] = [
    ['child_id', updates.childId],
    ['title', updates.title],
    ['description', updates.description],
    ['icon', updates.icon],
    ['category', updates.category],
    ['points', updates.points],
    ['recurrence_type', updates.recurrenceType],
    ['recurrence_days', updates.recurrenceDays],
    ['time_of_day', updates.timeOfDay],
    ['duration_minutes', updates.durationMinutes],
    ['requires_approval', updates.requiresApproval],
    ['is_active', updates.isActive],
    ['target_age_stage', updates.targetAgeStage],
    ['is_parent_role', updates.isParentRole],
    ['portrait16_key', updates.portrait16Key],
    ['bo_thi7_key', updates.boThi7Key],
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

  const parsed = activityMutationSchema.safeParse(await readBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid activity mutation.', correlationId },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  let error: { readonly code?: string } | null;
  switch (parsed.data.type) {
    case 'create': {
      ({ error } = await supabase
        .from('habit_activities')
        .insert(createRow(parsed.data.activity, parent.familyId, parent.user.id)));
      break;
    }
    case 'createMany': {
      ({ error } = await supabase
        .from('habit_activities')
        .insert(parsed.data.activities.map((activity) => (
          createRow(activity, parent.familyId, parent.user.id)
        ))));
      break;
    }
    case 'update': {
      ({ error } = await supabase
        .from('habit_activities')
        .update(updateRow(parsed.data))
        .eq('family_id', parent.familyId)
        .eq('id', parsed.data.activityId));
      break;
    }
    case 'delete': {
      ({ error } = await supabase
        .from('habit_activities')
        .delete()
        .eq('family_id', parent.familyId)
        .eq('id', parsed.data.activityId));
      break;
    }
    default: {
      const unreachable: never = parsed.data;
      return unreachable;
    }
  }

  if (error) {
    logOperationalEvent('error', {
      operation: `activity_${parsed.data.type}`,
      reasonCode: error.code ?? 'activity_mutation_failed',
      correlationId,
      route: request.nextUrl.pathname,
      status: 409,
    });
    return NextResponse.json(
      { success: false, error: 'The habit could not be saved.', correlationId },
      { status: 409 },
    );
  }
  switch (parsed.data.type) {
    case 'createMany':
      return NextResponse.json({
        success: true,
        activityIds: parsed.data.activities.map((activity) => activity.id),
        correlationId,
      });
    case 'create':
      return NextResponse.json({
        success: true,
        activityId: parsed.data.activity.id,
        correlationId,
      });
    case 'update':
    case 'delete':
      return NextResponse.json({
        success: true,
        activityId: parsed.data.activityId,
        correlationId,
      });
    default: {
      const unreachable: never = parsed.data;
      return unreachable;
    }
  }
}
