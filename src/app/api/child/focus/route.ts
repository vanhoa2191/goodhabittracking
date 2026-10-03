import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { parseWeeklyFocus } from '@/lib/experience-state';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';

export const runtime = 'nodejs';

const commandSchema = z.object({
  weekStart: z.iso.date(),
  activityIds: z.array(z.string().uuid()).max(2),
}).strict();

function invalidSession() {
  const response = NextResponse.json({ error: 'Child device session expired or revoked.' }, { status: 401 });
  response.cookies.delete(CHILD_SESSION_COOKIE);
  return response;
}

/** A paired child device chooses the one or two habits it puts first this week. */
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  let body: unknown;
  try {
    body = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid focus.' }, { status: 400 });
  }
  const command = commandSchema.safeParse(body);
  if (!command.success) return NextResponse.json({ error: 'Invalid focus.' }, { status: 400 });

  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  if (!token) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('set_child_weekly_focus', {
    session_token_hash: await sha256Hex(token),
    focus_week: command.data.weekStart,
    focus_activity_ids: command.data.activityIds,
  });
  if (error) return NextResponse.json({ error: 'The focus could not be saved.' }, { status: 409 });
  if (data?.status === 'session_invalid') return invalidSession();
  const saved = z.object({ status: z.literal('saved'), weeklyFocus: z.unknown() }).safeParse(data);
  if (!saved.success) return NextResponse.json({ error: 'The focus could not be saved.' }, { status: 503 });
  try {
    const weeklyFocus = parseWeeklyFocus(saved.data.weeklyFocus);
    if (weeklyFocus.week_start !== command.data.weekStart) return NextResponse.json({ error: 'The focus could not be saved.' }, { status: 503 });
    return NextResponse.json({ success: true, weeklyFocus });
  } catch {
    return NextResponse.json({ error: 'The focus could not be saved.' }, { status: 503 });
  }
}
