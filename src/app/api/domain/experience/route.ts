import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { parseExperienceState } from '@/lib/experience-state';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const commandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('chooseWishlist'), childId: z.string().uuid(), rewardId: z.string().uuid() }),
  z.object({ type: z.literal('pauseFamily') }),
  z.object({ type: z.literal('resumeFamily') }),
]);

export async function GET() {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const [children, settings, letters, quests, wishlists] = await Promise.all([
    supabase.from('child_engagement_profiles').select('*').eq('family_id', parent.familyId),
    supabase.from('family_engagement_settings').select('*').eq('family_id', parent.familyId).maybeSingle(),
    supabase.from('daily_mascot_letters').select('*').eq('family_id', parent.familyId),
    supabase.from('secret_quests').select('*').eq('family_id', parent.familyId),
    supabase.from('child_wishlists').select('*').eq('family_id', parent.familyId),
  ]);
  if ([children, settings, letters, quests, wishlists].some((result) => result.error)) {
    return NextResponse.json({ error: 'Experience state could not be loaded.' }, { status: 503 });
  }

  const parsed = parseExperienceState({
    children: children.data ?? [],
    settings: settings.data,
    letters: letters.data ?? [],
    quests: quests.data ?? [],
    wishlists: wishlists.data ?? [],
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
  const now = new Date().toISOString();
  const command = parsed.data;
  switch (command.type) {
    case 'chooseWishlist': {
      const { error } = await supabase.from('child_wishlists').upsert({
        family_id: parent.familyId,
        child_id: command.childId,
        reward_id: command.rewardId,
        chosen_at: now,
        updated_at: now,
      });
      if (error) return NextResponse.json({ error: 'Wishlist could not be saved.' }, { status: 409 });
      break;
    }
    case 'pauseFamily':
    case 'resumeFamily': {
      const { error } = await supabase.from('family_engagement_settings').upsert({
        family_id: parent.familyId,
        paused_at: command.type === 'pauseFamily' ? now : null,
        pause_reason: null,
        updated_at: now,
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
