import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { CHILD_SESSION_COOKIE } from '@/lib/pairing/crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    clear?: boolean;
  };
  const cookieStore = await cookies();

  if (body.clear) {
    cookieStore.delete(CHILD_SESSION_COOKIE);
    return NextResponse.json({ ok: true, cleared: true });
  }

  if (typeof body.token === 'string') {
    cookieStore.set(CHILD_SESSION_COOKIE, body.token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 86400 * 7,
    });
    return NextResponse.json({ ok: true, tokenSet: true });
  }

  return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_SESSION_COOKIE)?.value ?? null;
  return NextResponse.json({ ok: true, hasToken: Boolean(token) });
}
