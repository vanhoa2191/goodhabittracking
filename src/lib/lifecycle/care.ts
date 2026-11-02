import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { evaluateMoodAlert, type MoodAlert, type SpaceMood } from '@/lib/child-space';

export function isCareEmailsEnabled(): boolean {
  return process.env.LIFECYCLE_CARE_EMAILS_ENABLED === 'true';
}

type MoodRow = { readonly family_id: string; readonly child_id: string; readonly local_date: string; readonly mood: SpaceMood };

/** Strongest alert level per family across its children. */
export function familyAlertLevels(rows: readonly MoodRow[], today: string): Map<string, Exclude<MoodAlert['level'], 'none'>> {
  const byChild = new Map<string, { family: string; moods: MoodRow[] }>();
  for (const row of rows) {
    const entry = byChild.get(row.child_id) ?? { family: row.family_id, moods: [] };
    entry.moods.push(row);
    byChild.set(row.child_id, entry);
  }
  const result = new Map<string, Exclude<MoodAlert['level'], 'none'>>();
  for (const { family, moods } of byChild.values()) {
    const { level } = evaluateMoodAlert(moods, today);
    if (level === 'none') continue;
    if (level === 'concern' || !result.has(family)) result.set(family, level);
  }
  return result;
}

function vietnamToday(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/**
 * Queues care emails. A failure here must never stop transactional dispatch, so it reports instead of throwing.
 * The mood alert goes first: the database allows one care message per family per 7 days, so it outranks the rest.
 */
export async function scheduleCareMessages(admin: Pick<SupabaseClient, 'rpc'>, now = new Date()): Promise<{ ok: boolean }> {
  let ok = true;
  try {
    const { data, error } = await admin.rpc('care_space_mood_snapshot');
    if (error) ok = false;
    else {
      const levels = familyAlertLevels((data ?? []) as MoodRow[], vietnamToday(now));
      for (const [familyId, level] of levels) {
        const { error: enqueueError } = await admin.rpc('enqueue_care_message', {
          target_family_id: familyId,
          target_template_key: 'care_space_alert',
          target_payload: { status: level },
        });
        if (enqueueError) ok = false;
      }
    }
  } catch { ok = false; }
  try {
    const { error } = await admin.rpc('schedule_care_messages');
    if (error) ok = false;
  } catch { ok = false; }
  return { ok };
}
