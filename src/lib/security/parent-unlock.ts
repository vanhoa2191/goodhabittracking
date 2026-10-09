import { NextResponse, type NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPairingSecret } from '@/lib/pairing/crypto';

export const PARENT_UNLOCK_COOKIE = 'kidhabit_parent_unlock';
const UNLOCK_SECONDS = 2 * 60 * 60;
const encoder = new TextEncoder();

type UnlockSubject = { readonly familyId: string; readonly user: { readonly id: string } };

/**
 * `PARENT_UNLOCK_SECRET` keeps this cookie apart from pairing and is required in production. Elsewhere
 * the pairing secret signs it when no dedicated secret is set.
 */
export function parentUnlockConfigReady(): boolean {
  return process.env.NODE_ENV !== 'production' || (process.env.PARENT_UNLOCK_SECRET?.trim().length ?? 0) >= 32;
}

function signingSecret(): string {
  const dedicated = process.env.PARENT_UNLOCK_SECRET?.trim() ?? '';
  if (dedicated.length >= 32) return dedicated;
  if (!parentUnlockConfigReady()) {
    throw new Error('PARENT_UNLOCK_SECRET must be at least 32 characters in production.');
  }
  return getPairingSecret() ?? 'local-development-parent-unlock-secret';
}

/** The PIN version from `get_parent_pin_status`; it changes whenever the PIN is set or changed. */
export function parentPinVersion(status: unknown): string {
  const version = status && typeof status === 'object' ? (status as { version?: unknown }).version : null;
  return typeof version === 'string' ? version : '';
}

async function sign(userId: string, familyId: string, pinVersion: string, expiresAt: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`parent-unlock:v2:${userId}:${familyId}:${pinVersion}:${expiresAt}`));
  return Buffer.from(signature).toString('base64url');
}

function sameText(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function hasParentUnlock(
  request: NextRequest,
  parent: UnlockSubject,
  pinVersion: string,
  now = Date.now(),
): Promise<boolean> {
  const value = request.cookies.get(PARENT_UNLOCK_COOKIE)?.value ?? '';
  const [expiry, signature, ...rest] = value.split('.');
  const expiresAt = Number(expiry);
  if (!signature || rest.length > 0 || !Number.isInteger(expiresAt) || expiresAt * 1000 <= now) return false;
  return sameText(signature, await sign(parent.user.id, parent.familyId, pinVersion, expiresAt));
}

/**
 * Marks this browser as having entered the parent PIN. The cookie is bound to the parent, the family and
 * the current PIN version, so changing the PIN anywhere ends every earlier unlock.
 */
export async function issueParentUnlock(
  response: NextResponse,
  parent: UnlockSubject,
  pinVersion: string,
  now = Date.now(),
): Promise<void> {
  const expiresAt = Math.floor(now / 1000) + UNLOCK_SECONDS;
  response.cookies.set(PARENT_UNLOCK_COOKIE, `${expiresAt}.${await sign(parent.user.id, parent.familyId, pinVersion, expiresAt)}`, {
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
 * set a PIN has nothing to unlock unless the action asks for `requirePin`. When the PIN state cannot be read the request is refused.
 */
export async function requireParentUnlock(
  request: NextRequest,
  parent: UnlockSubject,
  supabase: Pick<SupabaseClient, 'rpc'>,
  options: { readonly requirePin?: boolean } = {},
): Promise<NextResponse | null> {
  const { data, error } = await supabase.rpc('get_parent_pin_status', { target_family_id: parent.familyId });
  if (error || !data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Could not check the parent PIN.' }, { status: 503 });
  }
  if ((data as { configured?: unknown }).configured !== true) {
    // Actions that move money are not left open for a family that never chose a PIN.
    return options.requirePin
      ? NextResponse.json({ error: 'Set a parent PIN first.', code: 'parent_pin_not_set' }, { status: 403 })
      : null;
  }
  if (await hasParentUnlock(request, parent, parentPinVersion(data))) return null;
  return NextResponse.json({ error: 'Parent PIN required.', code: 'parent_pin_required' }, { status: 403 });
}
