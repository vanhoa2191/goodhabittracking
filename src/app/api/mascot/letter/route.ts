import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const letterRequest = z.object({
  childId: z.string().uuid(),
  date: z.iso.date(),
}).strict();

const letterResponse = z.object({
  status: z.literal('ready'),
  template_key: z.string().regex(/^(leo|bunny|panda|fox|turtle|bee)_[0-2]$/),
  read_at: z.string().datetime({ offset: true }).nullable(),
  newly_read: z.boolean().default(false),
});

function isCurrentLocalDate(date: string): boolean {
  const targetDay = Date.parse(`${date}T00:00:00Z`) / 86_400_000;
  const utcDay = Math.floor(Date.now() / 86_400_000);
  return Math.abs(targetDay - utcDay) <= 1;
}

function invalidSession(clearChildCookie: boolean) {
  const response = NextResponse.json({ error: 'Session expired or access denied.' }, { status: 401 });
  if (clearChildCookie) response.cookies.delete(CHILD_SESSION_COOKIE);
  return response;
}

async function openLetter(childId: string, date: string, markRead: boolean) {
  const supabase = await createServerSupabaseClient();
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value ?? null;
  if (!token) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return invalidSession(false);
  }

  const tokenHash = token ? await sha256Hex(token) : null;
  const { data, error } = await supabase.rpc('open_daily_mascot_letter', {
    target_child_id: childId,
    target_local_date: date,
    mark_read: markRead,
    session_token_hash: tokenHash,
  });
  if (error) return NextResponse.json({ error: 'Letter could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession(Boolean(token));

  const parsed = letterResponse.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Letter could not be loaded.' }, { status: 503 });
  return NextResponse.json({ templateKey: parsed.data.template_key, readAt: parsed.data.read_at, newlyRead: parsed.data.newly_read });
}

export async function GET(request: NextRequest) {
  const parsed = letterRequest.safeParse({
    childId: request.nextUrl.searchParams.get('childId'),
    date: request.nextUrl.searchParams.get('date'),
  });
  if (!parsed.success || !isCurrentLocalDate(parsed.data.date)) {
    return NextResponse.json({ error: 'Invalid letter date.' }, { status: 400 });
  }
  return openLetter(parsed.data.childId, parsed.data.date, false);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid letter request.' }, { status: 400 });
  }
  const parsed = letterRequest.safeParse(body);
  if (!parsed.success || !isCurrentLocalDate(parsed.data.date)) {
    return NextResponse.json({ error: 'Invalid letter date.' }, { status: 400 });
  }
  return openLetter(parsed.data.childId, parsed.data.date, true);
}
