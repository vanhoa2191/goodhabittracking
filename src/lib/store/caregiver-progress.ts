import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';
import { loadCloudFamilySnapshot } from './cloud-family-sync';

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
  })),
  completionCounts: z.array(z.strictObject({
    child_id: z.string().uuid(),
    count: z.number().int().nonnegative(),
  })),
});

export type CaregiverProgress = z.infer<typeof caregiverProgressSchema>;

export async function loadCaregiverProgress(supabase = getSupabase()): Promise<CaregiverProgress> {
  if (!supabase) throw new Error('Supabase client is not configured.');
  const result = await supabase.rpc('caregiver_progress_snapshot');
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
