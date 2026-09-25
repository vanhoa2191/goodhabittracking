import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { parseDeferredTask } from '@/lib/experience-state';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const commandSchema = z.object({
  activityId: z.string().uuid(),
  date: z.iso.date(),
  deferred: z.boolean(),
}).strict();

function invalidSession() {
  const response = NextResponse.json({ error: 'Child device session expired or revoked.' }, { status: 401 });
  response.cookies.delete(CHILD_SESSION_COOKIE);
  return response;
}

async function sessionHash() {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  return token ? sha256Hex(token) : null;
}

export async function GET() {
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('read_child_task_deferrals', { session_token_hash: tokenHash });
  if (error) return NextResponse.json({ error: 'Tasks could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  const parsed = z.object({ status: z.literal('ready'), deferredTasks: z.array(z.unknown()) }).safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Tasks could not be loaded.' }, { status: 503 });
  try {
    return NextResponse.json({ deferredTasks: parsed.data.deferredTasks.map(parseDeferredTask) });
  } catch {
    return NextResponse.json({ error: 'Tasks could not be loaded.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid task choice.' }, { status: 400 });
  }
  const command = commandSchema.safeParse(body);
  if (!command.success) return NextResponse.json({ error: 'Invalid task choice.' }, { status: 400 });

  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('set_child_task_deferral', {
    session_token_hash: tokenHash,
    target_activity_id: command.data.activityId,
    target_local_date: command.data.date,
    should_defer: command.data.deferred,
  });
  if (error) return NextResponse.json({ error: 'Task could not be saved.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status === 'task_unavailable' || data?.status === 'already_complete') {
    return NextResponse.json({ error: 'Task is unavailable.' }, { status: 409 });
  }
  const saved = z.object({ status: z.enum(['saved', 'restored']), changed: z.boolean(), deferredTask: z.unknown().nullable() }).safeParse(data);
  if (!saved.success) return NextResponse.json({ error: 'Task could not be saved.' }, { status: 503 });
  try {
    const deferredTask = saved.data.deferredTask === null ? null : parseDeferredTask(saved.data.deferredTask);
    if (command.data.deferred !== (deferredTask !== null)
      || (deferredTask && (deferredTask.activity_id !== command.data.activityId
        || deferredTask.local_date !== command.data.date))) {
      return NextResponse.json({ error: 'Task could not be saved.' }, { status: 503 });
    }
    return NextResponse.json({ changed: saved.data.changed, deferredTask });
  } catch {
    return NextResponse.json({ error: 'Task could not be saved.' }, { status: 503 });
  }
}
