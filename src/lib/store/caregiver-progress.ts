import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';
import { localDayKey } from '@/lib/habit-fire';
import { loadCloudFamilySnapshot } from './cloud-family-sync';

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * The recurrence fields and the daily window arrive only from a database that has the daily-progress
 * migration. A database without it answers in the older shape, which stays valid: the screen then hides
 * the part it cannot compute instead of failing.
 */
const caregiverProgressSchema = z.strictObject({
  familyId: z.string().uuid(),
  familyRole: z.literal('caregiver'),
  profiles: z.array(z.strictObject({
    id: z.string().uuid(),
    name: z.string(),
    avatar: z.string(),
    theme_color: z.string(),
  })),
  activities: z.array(z.strictObject({
    id: z.string().uuid(),
    child_id: z.string().uuid().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    recurrence_type: z.enum(['daily', 'weekdays', 'weekends', 'custom']).optional(),
    recurrence_days: z.array(z.number().int().min(0).max(6)).nullable().optional(),
    created_on: dayKey.optional(),
  })),
  completionCounts: z.array(z.strictObject({
    child_id: z.string().uuid(),
    count: z.number().int().nonnegative(),
  })),
  daily: z.strictObject({
    from: dayKey,
    to: dayKey,
    /** Completed or approved logs per child per day. Days with none are absent. */
    counts: z.array(z.strictObject({
      child_id: z.string().uuid(),
      day: dayKey,
      count: z.number().int().nonnegative(),
    })),
  }).optional(),
}).refine(
  (value) => value.daily === undefined || value.activities.every((activity) => activity.recurrence_type !== undefined),
  { message: 'Daily progress needs the recurrence of every habit.' },
);

export type CaregiverProgress = z.infer<typeof caregiverProgressSchema>;

export async function loadCaregiverProgress(supabase = getSupabase()): Promise<CaregiverProgress> {
  if (!supabase) throw new Error('Supabase client is not configured.');
  let result = await supabase.rpc('caregiver_progress_snapshot', { local_today: localDayKey() });
  // A database without the daily-progress migration has no function taking the day. The call without it
  // reaches the earlier projection, which returns less; nothing broader is ever requested.
  if (result.error && (result.error.code === 'PGRST202' || result.error.code === '42883')) {
    result = await supabase.rpc('caregiver_progress_snapshot');
  }
  if (result.error) throw result.error;
  return caregiverProgressSchema.parse(result.data);
}

/**
 * Managers load the whole family in one round trip. The snapshot already names the caller's role, so only
 * a caregiver, whose snapshot comes back empty under row level security, makes a second call for progress.
 */
export async function loadCloudIdentitySnapshot(userId: string, supabase = getSupabase()) {
  const snapshot = await loadCloudFamilySnapshot(userId);
  if (snapshot.familyRole !== 'caregiver') return { familyRole: 'manager' as const, snapshot };
  const progress = await loadCaregiverProgress(supabase);
  if (progress.familyId !== snapshot.familyId) throw new Error('Family membership changed while loading progress.');
  return { familyRole: 'caregiver' as const, progress };
}
