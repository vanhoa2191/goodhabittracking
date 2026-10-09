import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { clearParentUnlock, issueParentUnlock, parentPinVersion } from '@/lib/security/parent-unlock';

export const runtime = 'nodejs';

const pinSchema = z.string().regex(/^\d{4}$/);
const verifySchema = z.object({ pin: pinSchema }).strict();
const changeSchema = z.object({ currentPin: pinSchema.optional(), newPin: pinSchema }).strict();

type ParentClient = NonNullable<Awaited<ReturnType<typeof parentClient>>>;

/** Sign only the version verified/changed under the RPC row lock. */
async function unlockedResponse(context: ParentClient, data: unknown, status: number): Promise<NextResponse> {
  const version = parentPinVersion(data);
  if (!version) return NextResponse.json({ error: 'Could not verify PIN.' }, { status: 503 });
  const response = NextResponse.json(data, { status });
  await issueParentUnlock(response, context.parent, version);
  return response;
}

async function parentClient() {
  const parent = await getParentContext();
  if (!parent) return null;
  return { parent, supabase: await createServerSupabaseClient() };
}

export async function GET() {
  const context = await parentClient();
  if (!context) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data, error } = await context.supabase.rpc('get_parent_pin_status', {
    target_family_id: context.parent.familyId,
  });
  if (error || !data) return NextResponse.json({ error: 'Could not load PIN status.' }, { status: 503 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: 'invalid' }, { status: 400 });
  const context = await parentClient();
  if (!context) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data, error } = await context.supabase.rpc('verify_parent_pin', {
    target_family_id: context.parent.familyId,
    candidate_pin: parsed.data.pin,
  });
  if (error || !data) return NextResponse.json({ error: 'Could not verify PIN.' }, { status: 503 });
  const status = typeof data === 'object' && data && 'status' in data ? data.status : null;
  if (status === 'verified') return unlockedResponse(context, data, 200);
  return NextResponse.json(data, { status: status === 'locked' ? 429 : 409 });
}

export async function DELETE(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const response = NextResponse.json({ status: 'locked_again' });
  clearParentUnlock(response);
  return response;
}

export async function PUT(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  const parsed = changeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: 'invalid_format' }, { status: 400 });
  const context = await parentClient();
  if (!context) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const { data, error } = await context.supabase.rpc('set_parent_pin', {
    target_family_id: context.parent.familyId,
    current_pin: parsed.data.currentPin ?? null,
    new_pin: parsed.data.newPin,
  });
  if (error || !data) return NextResponse.json({ error: 'Could not update PIN.' }, { status: 503 });
  const status = typeof data === 'object' && data && 'status' in data ? data.status : null;
  if (status === 'updated') return unlockedResponse(context, data, 200);
  return NextResponse.json(data, { status: status === 'invalid_format' ? 400 : status === 'locked' ? 429 : 409 });
}
