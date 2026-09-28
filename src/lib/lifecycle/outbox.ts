import 'server-only';

import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export async function enqueueLifecycleMessage(input: {
  readonly userId: string;
  readonly familyId: string | null;
  readonly templateKey: 'welcome_setup' | 'trial_ending' | 'payment_receipt' | 'support_status' | 'refund_status' | 'subscription_cancelled';
  readonly category?: 'transactional' | 'marketing';
  readonly locale?: string;
  readonly payload?: Record<string, string | number>;
  readonly dedupeKey: string;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.rpc('enqueue_lifecycle_message', {
    target_user_id: input.userId,
    target_family_id: input.familyId,
    target_template_key: input.templateKey,
    target_category: input.category ?? 'transactional',
    target_locale: input.locale ?? 'vi',
    target_payload: input.payload ?? {},
    target_dedupe_key: input.dedupeKey,
  });
  if (error) throw error;
}
