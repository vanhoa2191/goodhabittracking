import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { parseCuePlans, parseSupportObservation, parseSupportObservations } from '@/lib/experience-state';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const commandSchema = z.object({
  logId: z.string().uuid(),
  level: z.enum(['alone', 'prompted', 'together']),
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
  const { data, error } = await supabase.rpc('read_child_habit_programs', { session_token_hash: tokenHash });
  if (error) return NextResponse.json({ error: 'Habits could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  const parsed = z.object({
    status: z.literal('ready'),
    supportObservations: z.array(z.unknown()),
    cuePlans: z.array(z.unknown()),
  }).safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Habits could not be loaded.' }, { status: 503 });
  try {
    return NextResponse.json({
      supportObservations: parseSupportObservations(parsed.data.supportObservations),
      cuePlans: parseCuePlans(parsed.data.cuePlans),
    });
  } catch {
    return NextResponse.json({ error: 'Habits could not be loaded.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid support level.' }, { status: 400 });
  }
  const command = commandSchema.safeParse(body);
  if (!command.success) return NextResponse.json({ error: 'Invalid support level.' }, { status: 400 });

  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('set_child_habit_support', {
    session_token_hash: tokenHash,
    target_log_id: command.data.logId,
    target_level: command.data.level,
  });
  if (error) return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status === 'log_unavailable') return NextResponse.json({ error: 'Habit record is unavailable.' }, { status: 409 });
  const saved = z.object({ status: z.literal('saved'), changed: z.boolean(), observation: z.unknown() }).safeParse(data);
  if (!saved.success) return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
  try {
    const observation = parseSupportObservation(saved.data.observation);
    if (observation.log_id !== command.data.logId || observation.support_level !== command.data.level) {
      return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
    }
    return NextResponse.json({ changed: saved.data.changed, observation });
  } catch {
    return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
  }
}
