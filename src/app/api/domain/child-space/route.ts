import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { spaceSnapshotSchema } from '@/lib/child-space';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const query = z.object({ childId: z.string().uuid() });

/** What a family manager may see: the mood trend and only the notes the child chose to share. */
export async function GET(request: NextRequest) {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const parsed = query.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('read_parent_child_space', {
    target_family_id: parent.familyId, target_child_id: parsed.data.childId,
  });
  if (error) return NextResponse.json({ error: 'Space could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (data?.status === 'child_unavailable') return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
  const snapshot = spaceSnapshotSchema.safeParse(data);
  if (data?.status !== 'ready' || !snapshot.success) return NextResponse.json({ error: 'Space could not be loaded.' }, { status: 503 });
  return NextResponse.json(snapshot.data);
}
