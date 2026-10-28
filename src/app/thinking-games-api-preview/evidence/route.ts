import { notFound } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const { searchParams } = new URL(request.url);
  const attemptId = searchParams.get('attemptId');
  const entitlementId = searchParams.get('entitlementId');
  const childId = searchParams.get('childId');

  const admin = createAdminSupabaseClient();

  let attemptData = null;
  if (attemptId) {
    const { data } = await admin
      .from('thinking_game_attempts')
      .select('id, entitlement_id, child_id, family_id, state, result, started_at, finished_at')
      .eq('id', attemptId)
      .maybeSingle();
    attemptData = data;
  }

  let entitlementData = null;
  if (entitlementId) {
    const { data } = await admin
      .from('thinking_game_entitlements')
      .select('id, child_id, family_id, local_day, slot_type, journey_day_index, content_id, content_version, state')
      .eq('id', entitlementId)
      .maybeSingle();
    entitlementData = data;
  }

  let journeyData = null;
  if (childId) {
    const { data } = await admin
      .from('thinking_game_journeys')
      .select('child_id, family_id, next_day_index, last_main_started_local_day')
      .eq('child_id', childId)
      .maybeSingle();
    journeyData = data;
  }

  // Count total won attempts for this child
  let wonCount = 0;
  if (childId) {
    const { data: wonAttempts } = await admin
      .from('thinking_game_attempts')
      .select('id, result')
      .eq('child_id', childId);
    wonCount = (wonAttempts ?? []).filter(
      (a) => (a.result as { won?: boolean } | null)?.won === true
    ).length;
  }

  return NextResponse.json({
    ok: true,
    attempt: attemptData,
    entitlement: entitlementData,
    journey: journeyData,
    wonCount,
  });
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const body = (await request.json().catch(() => ({}))) as {
    resetChildId?: string;
    nextDayIndex?: number;
  };

  const admin = createAdminSupabaseClient();
  if (body.resetChildId) {
    await admin.from('thinking_game_attempts').delete().eq('child_id', body.resetChildId);
    await admin.from('thinking_game_entitlements').delete().eq('child_id', body.resetChildId);
    await admin.from('thinking_game_journeys').delete().eq('child_id', body.resetChildId);
    await admin.from('thinking_game_day_snapshots').delete().eq('child_id', body.resetChildId);

    if (body.nextDayIndex && body.nextDayIndex > 1) {
      const familyId =
        body.resetChildId === 'cccccccc-0000-4000-8000-00000000000b'
          ? '22222222-2222-4222-8222-222222222222'
          : '11111111-1111-4111-8111-111111111111';
      await admin.from('thinking_game_journeys').insert({
        child_id: body.resetChildId,
        family_id: familyId,
        next_day_index: body.nextDayIndex,
      });
    }

    return NextResponse.json({ ok: true, reset: body.resetChildId, nextDayIndex: body.nextDayIndex ?? 1 });
  }

  return NextResponse.json({ ok: false, error: 'missing_child_id' }, { status: 400 });
}
