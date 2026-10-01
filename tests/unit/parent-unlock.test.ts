import { NextRequest, NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearParentUnlock,
  hasParentUnlock,
  issueParentUnlock,
  PARENT_UNLOCK_COOKIE,
  requireParentUnlock,
} from '@/lib/security/parent-unlock';

const parent = { familyId: 'family-a', user: { id: 'user-a' } };
const now = Date.parse('2026-09-30T10:00:00.000Z');

async function issuedCookie(subject = parent, at = now): Promise<string> {
  const response = NextResponse.json({});
  await issueParentUnlock(response, subject, at);
  return response.cookies.get(PARENT_UNLOCK_COOKIE)!.value;
}

function requestWith(cookie?: string) {
  return new NextRequest('https://app.kidhabithero.com/api/x', {
    method: 'POST',
    headers: cookie ? { cookie: `${PARENT_UNLOCK_COOKIE}=${cookie}` } : {},
  });
}

describe('parent unlock cookie', () => {
  beforeEach(() => {
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', 'x'.repeat(40));
  });

  it('is HttpOnly, strict and expires after two hours', async () => {
    const response = NextResponse.json({});
    await issueParentUnlock(response, parent, now);
    const cookie = response.cookies.get(PARENT_UNLOCK_COOKIE)!;
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('strict');
    expect(cookie.maxAge).toBe(7200);
  });

  it('is accepted for the same parent and family within its lifetime', async () => {
    expect(await hasParentUnlock(requestWith(await issuedCookie()), parent, now + 60_000)).toBe(true);
  });

  it.each([
    ['another parent', { familyId: 'family-a', user: { id: 'user-b' } }],
    ['another family', { familyId: 'family-b', user: { id: 'user-a' } }],
  ])('is refused for %s', async (_label, other) => {
    expect(await hasParentUnlock(requestWith(await issuedCookie()), other, now + 60_000)).toBe(false);
  });

  it('expires', async () => {
    expect(await hasParentUnlock(requestWith(await issuedCookie()), parent, now + 7_201_000)).toBe(false);
  });

  it.each(['', 'garbage', '9999999999.', '9999999999.forged-signature', '1.2.3'])('rejects %j', async (value) => {
    expect(await hasParentUnlock(requestWith(value), parent, now)).toBe(false);
  });

  it('rejects a cookie signed with a different secret', async () => {
    const cookie = await issuedCookie();
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', 'y'.repeat(40));
    expect(await hasParentUnlock(requestWith(cookie), parent, now + 1000)).toBe(false);
  });

  it('is cleared on lock', () => {
    const response = NextResponse.json({});
    clearParentUnlock(response);
    expect(response.cookies.get(PARENT_UNLOCK_COOKIE)?.maxAge).toBe(0);
  });
});

describe('requireParentUnlock', () => {
  beforeEach(() => {
    vi.stubEnv('PAIRING_RATE_LIMIT_SECRET', 'x'.repeat(40));
  });

  const client = (result: { data: unknown; error: unknown }) => ({ rpc: vi.fn(async () => result) }) as never;

  it('lets a family without a PIN through', async () => {
    expect(await requireParentUnlock(requestWith(), parent, client({ data: { configured: false }, error: null }))).toBeNull();
  });

  it('refuses a family without a PIN when the action requires one', async () => {
    const response = await requireParentUnlock(requestWith(), parent, client({ data: { configured: false }, error: null }), { requirePin: true });
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({ code: 'parent_pin_not_set' });
  });

  it('lets a family with an entered PIN through an action that requires one', async () => {
    const cookie = await issuedCookie(parent, Date.now());
    expect(await requireParentUnlock(requestWith(cookie), parent, client({ data: { configured: true }, error: null }), { requirePin: true })).toBeNull();
  });

  it('refuses a family with a PIN when the PIN was not entered in this browser', async () => {
    const response = await requireParentUnlock(requestWith(), parent, client({ data: { configured: true }, error: null }));
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({ code: 'parent_pin_required' });
  });

  it('accepts a family with a PIN when the cookie is valid', async () => {
    const cookie = await issuedCookie(parent, Date.now());
    expect(await requireParentUnlock(requestWith(cookie), parent, client({ data: { configured: true }, error: null }))).toBeNull();
  });

  it('fails closed when the PIN state cannot be read', async () => {
    expect((await requireParentUnlock(requestWith(), parent, client({ data: null, error: { message: 'down' } })))?.status).toBe(503);
  });
});
