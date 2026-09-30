import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPairingSecret } from '@/lib/pairing/crypto';

export const PARENT_UNLOCK_COOKIE = 'kidhabit_parent_unlock';
const UNLOCK_SECONDS = 2 * 60 * 60;
const encoder = new TextEncoder();

type UnlockSubject = { readonly familyId: string; readonly user: { readonly id: string } };

function signingSecret(): string {
  const configured = getPairingSecret();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PAIRING_RATE_LIMIT_SECRET must be at least 32 characters in production.');
  }
  return 'local-development-parent-unlock-secret';
}

async function sign(userId: string, familyId: string, expiresAt: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`parent-unlock:v1:${userId}:${familyId}:${expiresAt}`));
  return Buffer.from(signature).toString('base64url');
}

function sameText(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function hasParentUnlock(request: NextRequest, parent: UnlockSubject, now = Date.now()): Promise<boolean> {
  const value = request.cookies.get(PARENT_UNLOCK_COOKIE)?.value ?? '';
  const [expiry, signature, ...rest] = value.split('.');
  const expiresAt = Number(expiry);
  if (!signature || rest.length > 0 || !Number.isInteger(expiresAt) || expiresAt * 1000 <= now) return false;
  return sameText(signature, await sign(parent.user.id, parent.familyId, expiresAt));
}

/** Marks this browser as having entered the parent PIN; the cookie is bound to the parent and the family. */
export async function issueParentUnlock(response: NextResponse, parent: UnlockSubject, now = Date.now()): Promise<void> {
  const expiresAt = Math.floor(now / 1000) + UNLOCK_SECONDS;
  response.cookies.set(PARENT_UNLOCK_COOKIE, `${expiresAt}.${await sign(parent.user.id, parent.familyId, expiresAt)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: UNLOCK_SECONDS,
  });
}

export function clearParentUnlock(response: NextResponse): void {
  response.cookies.set(PARENT_UNLOCK_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Sensitive parent actions need the PIN to have been entered in this browser. A family that never
 * set a PIN has nothing to unlock. When the PIN state cannot be read the request is refused.
 */
export async function requireParentUnlock(
  request: NextRequest,
  parent: UnlockSubject,
  supabase: Pick<SupabaseClient, 'rpc'>,
): Promise<NextResponse | null> {
  const { data, error } = await supabase.rpc('get_parent_pin_status', { target_family_id: parent.familyId });
  if (error || !data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Could not check the parent PIN.' }, { status: 503 });
  }
  if ((data as { configured?: unknown }).configured !== true) return null;
  if (await hasParentUnlock(request, parent)) return null;
  return NextResponse.json({ error: 'Parent PIN required.', code: 'parent_pin_required' }, { status: 403 });
}
