import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const selectionSchema = z.object({
  avatar: z.enum([
    'mascot:leo', 'mascot:bunny', 'mascot:panda',
    'mascot:fox', 'mascot:turtle', 'mascot:bee',
  ]),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
}).strict();

async function sessionHash() {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  return token ? sha256Hex(token) : null;
}

function invalidSession() {
  const response = NextResponse.json({ error: 'Child device session expired or revoked.' }, { status: 401 });
  response.cookies.delete(CHILD_SESSION_COOKIE);
  return response;
}

export async function GET() {
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('read_child_mascot_selection', {
    session_token_hash: tokenHash,
  });
  if (error) return NextResponse.json({ error: 'Mascot status could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status !== 'ready') return NextResponse.json({ error: 'Mascot status could not be loaded.' }, { status: 503 });
  return NextResponse.json({ mascot_selected_at: data.mascot_selected_at ?? null });
}

export async function POST(request: NextRequest) {
  const parsed = selectionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid mascot selection.' }, { status: 400 });

  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('update_child_mascot_command', {
    session_token_hash: tokenHash,
    target_avatar: parsed.data.avatar,
    target_theme_color: parsed.data.themeColor,
  });
  if (error) return NextResponse.json({ error: 'Mascot choice could not be saved.' }, { status: 409 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status !== 'saved') return NextResponse.json({ error: 'Mascot choice could not be saved.' }, { status: 409 });
  return NextResponse.json({ success: true });
}
