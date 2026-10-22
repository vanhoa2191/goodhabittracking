import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    signOut?: boolean;
  };

  const supabase = await createServerSupabaseClient();

  if (body.signOut) {
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true, signedOut: true });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ ok: false, error: 'missing_credentials' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? 'sign_in_failed' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    },
  });
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({
    ok: true,
    authenticated: Boolean(user),
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      : null,
  });
}
