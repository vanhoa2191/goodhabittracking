import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  childDomainCommandSchema,
  type ChildDomainCommand,
} from '@/lib/domain/commands';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function rpcFor(command: ChildDomainCommand, tokenHash: string) {
  switch (command.type) {
    case 'completeHabit':
      return {
        name: 'complete_child_habit_command',
        args: {
          session_token_hash: tokenHash,
          target_activity_id: command.activityId,
          target_log_date: command.date,
          command_id: command.commandId,
        },
      };
    case 'undoHabit':
      return {
        name: 'undo_child_habit_command',
        args: { session_token_hash: tokenHash, target_log_id: command.logId },
      };
    case 'redeemReward':
      return {
        name: 'redeem_child_reward_command',
        args: {
          session_token_hash: tokenHash,
          target_reward_id: command.rewardId,
          command_id: command.commandId,
        },
      };
  }
}

export async function POST(request: NextRequest) {
  const correlationId = createCorrelationId();
  const parsed = childDomainCommandSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid child command.', correlationId },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Child device session required.', correlationId },
      { status: 401 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const rpc = rpcFor(parsed.data, await sha256Hex(token));
  const { data, error } = await supabase.rpc(rpc.name, rpc.args);
  if (error) {
    logOperationalEvent('error', {
      operation: `child_${parsed.data.type}`,
      reasonCode: error.code || 'command_failed',
      correlationId,
      route: request.nextUrl.pathname,
      status: 409,
    });
    return NextResponse.json(
      { success: false, error: 'The child action could not be saved.', correlationId },
      { status: 409 },
    );
  }
  if (data?.status === 'session_invalid') {
    const response = NextResponse.json(
      { success: false, error: 'Child device session expired or revoked.', correlationId },
      { status: 401 },
    );
    response.cookies.delete(CHILD_SESSION_COOKIE);
    return response;
  }

  return NextResponse.json({ success: true, result: data });
}
