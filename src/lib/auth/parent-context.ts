import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type ParentContext = {
  familyId: string;
  role: 'owner' | 'parent' | 'guardian';
  user: User;
};

export async function getParentContext(): Promise<ParentContext | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: membership, error: membershipError } = await supabase
    .from('family_memberships')
    .select('family_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) return null;
  if (!['owner', 'parent', 'guardian'].includes(membership.role)) return null;

  return {
    familyId: membership.family_id,
    role: membership.role as ParentContext['role'],
    user,
  };
}
