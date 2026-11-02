import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SPACE_GOAL_STATUSES, SPACE_MOODS, SPACE_NOTE_KINDS, SPACE_REASONS, normalizeSpaceGoal, normalizeSpaceLetter, normalizeSpaceNote, spaceSnapshotSchema,
} from '@/lib/child-space';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const putInput = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mood'), date: z.iso.date(), mood: z.enum(SPACE_MOODS), reason: z.enum(SPACE_REASONS).nullable().optional() }).strict(),
  z.object({ type: z.literal('note'), date: z.iso.date(), kind: z.enum(SPACE_NOTE_KINDS), text: z.string(), shared: z.boolean().optional() }).strict(),
  z.object({ type: z.literal('goal'), weekStart: z.iso.date(), text: z.string() }).strict(),
  z.object({ type: z.literal('goal-status'), weekStart: z.iso.date(), status: z.enum(SPACE_GOAL_STATUSES) }).strict(),
  z.object({ type: z.literal('letter'), date: z.iso.date(), text: z.string() }).strict(),
]);
const deleteInput = z.object({ date: z.iso.date(), kind: z.enum(SPACE_NOTE_KINDS) }).strict();

async function invalidSession() {
  (await cookies()).delete(CHILD_SESSION_COOKIE);
  return NextResponse.json({ error: 'Child device session expired or revoked.' }, { status: 401 });
}

async function sessionHash(): Promise<string | null> {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  return token ? sha256Hex(token) : null;
}

const unavailable = (status: unknown) => status === 'date_unavailable' || status === 'input_invalid' || status === 'not_found' || status === 'limit_reached';

export async function GET() {
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('read_child_space', { session_token_hash: tokenHash });
  if (error) return NextResponse.json({ error: 'Space could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  const parsed = spaceSnapshotSchema.safeParse(data);
  if (data?.status !== 'ready' || !parsed.success) return NextResponse.json({ error: 'Space could not be loaded.' }, { status: 503 });
  return NextResponse.json(parsed.data);
}

export async function PUT(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const body = putInput.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Invalid space entry.' }, { status: 400 });
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();
  const supabase = await createServerSupabaseClient();

  let result;
  if (body.data.type === 'mood') {
    result = await supabase.rpc('save_child_space_mood', {
      session_token_hash: tokenHash, target_local_date: body.data.date,
      target_mood: body.data.mood, target_reason: body.data.reason ?? null,
    });
  } else if (body.data.type === 'goal') {
    const text = normalizeSpaceGoal(body.data.text);
    if (!text) return NextResponse.json({ error: 'Invalid space entry.' }, { status: 400 });
    result = await supabase.rpc('save_child_space_goal', {
      session_token_hash: tokenHash, target_week_start: body.data.weekStart, target_text: text,
    });
  } else if (body.data.type === 'goal-status') {
    result = await supabase.rpc('mark_child_space_goal', {
      session_token_hash: tokenHash, target_week_start: body.data.weekStart, target_status: body.data.status,
    });
  } else if (body.data.type === 'letter') {
    const text = normalizeSpaceLetter(body.data.text);
    if (!text) return NextResponse.json({ error: 'Invalid space entry.' }, { status: 400 });
    result = await supabase.rpc('send_child_space_letter', {
      session_token_hash: tokenHash, target_local_date: body.data.date, target_text: text,
    });
  } else {
    const text = normalizeSpaceNote(body.data.text);
    if (!text) return NextResponse.json({ error: 'Invalid space entry.' }, { status: 400 });
    result = await supabase.rpc('save_child_space_note', {
      session_token_hash: tokenHash, target_local_date: body.data.date, target_kind: body.data.kind,
      target_text: text, target_shared: body.data.shared === true,
    });
  }
  if (result.error) return NextResponse.json({ error: 'Space entry could not be saved.' }, { status: 503 });
  if (result.data?.status === 'session_invalid') return invalidSession();
  if (unavailable(result.data?.status)) return NextResponse.json({ error: 'Space entry is unavailable.' }, { status: 409 });
  if (result.data?.status !== 'saved') return NextResponse.json({ error: 'Space entry could not be saved.' }, { status: 503 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const body = deleteInput.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Invalid space entry.' }, { status: 400 });
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('delete_child_space_note', {
    session_token_hash: tokenHash, target_local_date: body.data.date, target_kind: body.data.kind,
  });
  if (error) return NextResponse.json({ error: 'Space entry could not be removed.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  return NextResponse.json({ ok: true });
}
