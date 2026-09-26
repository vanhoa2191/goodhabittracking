import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { parseDeferredTask, parseExperienceState } from '@/lib/experience-state';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('chooseWishlist'), childId: z.string().uuid(), rewardId: z.string().uuid() }),
  z.object({
    type: z.literal('setTaskDeferred'),
    childId: z.string().uuid(),
    activityId: z.string().uuid(),
    date: z.iso.date(),
    deferred: z.boolean(),
  }).strict(),
  z.object({ type: z.literal('pauseFamily') }),
  z.object({ type: z.literal('resumeFamily') }),
]);

export async function GET() {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const [children, settings, letters, quests, wishlists, deferredTasks, journalEntries, cityPurchases] = await Promise.all([
    supabase.from('child_engagement_profiles').select('*').eq('family_id', parent.familyId),
    supabase.from('family_engagement_settings').select('*').eq('family_id', parent.familyId).maybeSingle(),
    supabase.from('daily_mascot_letters').select('*').eq('family_id', parent.familyId),
    supabase.from('secret_quests').select('*').eq('family_id', parent.familyId),
    supabase.from('child_wishlists').select('*').eq('family_id', parent.familyId),
    supabase.from('child_task_deferrals').select('*').eq('family_id', parent.familyId),
    defaultExperienceFlags.dailyJournal
      ? supabase.from('child_journal_entries').select('*').eq('family_id', parent.familyId)
      : Promise.resolve({ data: [], error: null }),
    defaultExperienceFlags.dreamCity
      ? supabase.from('child_city_purchases').select('*').eq('family_id', parent.familyId)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if ([children, settings, letters, quests, wishlists, deferredTasks, journalEntries, cityPurchases].some((result) => result.error)) {
    return NextResponse.json({ error: 'Experience state could not be loaded.' }, { status: 503 });
  }

  const parsed = parseExperienceState({
    children: children.data ?? [],
    settings: settings.data,
    letters: letters.data ?? [],
    quests: quests.data ?? [],
    wishlists: wishlists.data ?? [],
    deferredTasks: deferredTasks.data ?? [],
    journalEntries: journalEntries.data ?? [],
    cityPurchases: cityPurchases.data ?? [],
  }, parent.familyId);
  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid command.' }, { status: 400 });
  }
  const parsed = commandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid command.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const command = parsed.data;
  switch (command.type) {
    case 'chooseWishlist': {
      const { data, error } = await supabase.rpc('choose_parent_wishlist', {
        target_family_id: parent.familyId,
        target_child_id: command.childId,
        target_reward_id: command.rewardId,
      });
      if (error) return NextResponse.json({ error: 'Wishlist could not be saved.' }, { status: 503 });
      if (data?.status === 'session_invalid') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      if (data?.status === 'child_unavailable' || data?.status === 'reward_unavailable') {
        return NextResponse.json({ error: 'Child or reward is unavailable.' }, { status: 409 });
      }
      const saved = z.object({ status: z.literal('saved'), changed: z.boolean() }).safeParse(data);
      if (!saved.success) return NextResponse.json({ error: 'Wishlist could not be saved.' }, { status: 503 });
      return NextResponse.json({ success: true, changed: saved.data.changed });
    }
    case 'setTaskDeferred': {
      const { data, error } = await supabase.rpc('set_parent_task_deferral', {
        target_family_id: parent.familyId,
        target_child_id: command.childId,
        target_activity_id: command.activityId,
        target_local_date: command.date,
        should_defer: command.deferred,
      });
      if (error) return NextResponse.json({ error: 'Task could not be saved.' }, { status: 503 });
      if (data?.status === 'session_invalid') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      if (data?.status === 'task_unavailable' || data?.status === 'already_complete') {
        return NextResponse.json({ error: 'Task is unavailable.' }, { status: 409 });
      }
      const saved = z.object({ status: z.enum(['saved', 'restored']), changed: z.boolean(), deferredTask: z.unknown().nullable() }).safeParse(data);
      if (!saved.success) return NextResponse.json({ error: 'Task could not be saved.' }, { status: 503 });
      try {
        const deferredTask = saved.data.deferredTask === null ? null : parseDeferredTask(saved.data.deferredTask);
        if (command.deferred !== (deferredTask !== null)
          || (deferredTask && (deferredTask.family_id !== parent.familyId
            || deferredTask.child_id !== command.childId
            || deferredTask.activity_id !== command.activityId
            || deferredTask.local_date !== command.date))) {
          return NextResponse.json({ error: 'Task could not be saved.' }, { status: 503 });
        }
        return NextResponse.json({ success: true, changed: saved.data.changed, deferredTask });
      } catch {
        return NextResponse.json({ error: 'Task could not be saved.' }, { status: 503 });
      }
    }
    case 'pauseFamily':
    case 'resumeFamily': {
      const { error } = await supabase.rpc('set_family_pause_state', {
        target_family_id: parent.familyId,
        should_pause: command.type === 'pauseFamily',
      });
      if (error) return NextResponse.json({ error: 'Family setting could not be saved.' }, { status: 409 });
      break;
    }
    default: {
      const exhaustive: never = command;
      return exhaustive;
    }
  }
  return NextResponse.json({ success: true });
}
