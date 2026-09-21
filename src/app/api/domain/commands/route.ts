import { NextRequest, NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { domainCommandSchema, type DomainCommand } from '@/lib/domain/commands';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';

export const runtime = 'nodejs';

function rpcFor(command: DomainCommand): { name: string; args: Record<string, unknown> } {
  switch (command.type) {
    case 'completeHabit':
      return {
        name: 'complete_habit_command',
        args: {
          target_activity_id: command.activityId,
          target_child_id: command.childId,
          target_log_date: command.date,
          command_id: command.commandId,
        },
      };
    case 'undoHabit':
      return { name: 'undo_habit_command', args: { target_log_id: command.logId } };
    case 'reviewHabit':
      return {
        name: 'review_habit_command',
        args: { target_log_id: command.logId, decision: command.decision },
      };
    case 'redeemReward':
      return {
        name: 'redeem_reward_command',
        args: {
          target_reward_id: command.rewardId,
          target_child_id: command.childId,
          command_id: command.commandId,
        },
      };
    case 'transitionRedemption':
      return {
        name: 'transition_redemption_command',
        args: { target_redemption_id: command.redemptionId, decision: command.decision },
      };
  }
}

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  const parent = await getParentContext();
  if (!parent) {
    logOperationalEvent('warn', { operation: 'domain_command', reasonCode: 'authentication_required', correlationId, route: request.nextUrl.pathname, status: 401 });
    return NextResponse.json({ success: false, error: 'Authentication required.', correlationId }, { status: 401 });
  }

  const parsed = domainCommandSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    logOperationalEvent('warn', { operation: 'domain_command', reasonCode: 'invalid_command', correlationId, route: request.nextUrl.pathname, status: 400 });
    return NextResponse.json({ success: false, error: 'Invalid domain command.', correlationId }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const rpc = rpcFor(parsed.data);
  const { data, error } = await supabase.rpc(rpc.name, rpc.args);
  if (error) {
    logOperationalEvent('error', { operation: parsed.data.type, reasonCode: error.code || 'command_failed', correlationId, route: request.nextUrl.pathname, status: 409 });
    return NextResponse.json({ success: false, error: 'The change could not be saved.', correlationId }, { status: 409 });
  }
  return NextResponse.json({ success: true, result: data });
}
