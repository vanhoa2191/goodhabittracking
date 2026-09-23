import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { parseChildWishlist } from '@/lib/experience-state';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function sessionHash() {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  return token ? sha256Hex(token) : null;
}

function invalidSession() {
  const response = NextResponse.json({ error: 'Child device session expired or revoked.' }, { status: 401 });
  response.cookies.delete(CHILD_SESSION_COOKIE);
  return response;
}

function validWishlist(value: unknown) {
  if (value === null) return null;
  return parseChildWishlist(value);
}

export async function GET() {
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('read_child_wishlist', { session_token_hash: tokenHash });
  if (error) return NextResponse.json({ error: 'Goal could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status !== 'ready') return NextResponse.json({ error: 'Goal could not be loaded.' }, { status: 503 });
  try {
    return NextResponse.json({ wishlist: validWishlist(data.wishlist) });
  } catch {
    return NextResponse.json({ error: 'Goal could not be loaded.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const body = z.object({ rewardId: z.string().uuid() }).strict().safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: 'Invalid goal.' }, { status: 400 });

  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('choose_child_wishlist', {
    session_token_hash: tokenHash,
    target_reward_id: body.data.rewardId,
  });
  if (error) return NextResponse.json({ error: 'Goal could not be saved.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status === 'reward_unavailable') return NextResponse.json({ error: 'Reward is unavailable.' }, { status: 409 });
  if (data?.status !== 'saved') return NextResponse.json({ error: 'Goal could not be saved.' }, { status: 503 });
  try {
    return NextResponse.json({ wishlist: parseChildWishlist(data.wishlist) });
  } catch {
    return NextResponse.json({ error: 'Goal could not be saved.' }, { status: 503 });
  }
}
