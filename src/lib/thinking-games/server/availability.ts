import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

export async function thinkingGameBonusAvailable(admin: SupabaseClient, childId: string, localDay: string) {
  const { data, error } = await admin.from('thinking_game_entitlements')
    .select('slot_type,state,thinking_game_attempts(result)')
    .eq('child_id', childId).eq('local_day', localDay);
  if (error || !data) return false;
  const main = data.find((entry) => entry.slot_type === 'main');
  const bonus = data.find((entry) => entry.slot_type === 'bonus');
  const relation = main?.thinking_game_attempts;
  const attempts = Array.isArray(relation) ? relation : relation ? [relation] : [];
  return Boolean(main && ['started', 'finished'].includes(main.state)
    && !attempts.some((attempt: { result: { won?: boolean } | null }) => attempt.result?.won === true)
    && bonus && ['granted', 'started'].includes(bonus.state));
}

/** Whether today's slot has already been played to the end; a finished slot is never replayed. */
export async function thinkingGameSlotFinished(admin: SupabaseClient, childId: string, localDay: string, slot: 'main' | 'bonus') {
  const { data, error } = await admin.from('thinking_game_entitlements')
    .select('state').eq('child_id', childId).eq('local_day', localDay).eq('slot_type', slot).maybeSingle();
  return !error && data?.state === 'finished';
}

export async function thinkingGameDayStatus(admin: SupabaseClient, childId: string, localDay: string) {
  const [bonusAvailable, mainPlayed, bonusPlayed] = await Promise.all([
    thinkingGameBonusAvailable(admin, childId, localDay),
    thinkingGameSlotFinished(admin, childId, localDay, 'main'),
    thinkingGameSlotFinished(admin, childId, localDay, 'bonus'),
  ]);
  return { bonusAvailable, mainPlayed, bonusPlayed };
}
