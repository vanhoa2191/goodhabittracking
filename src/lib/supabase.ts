import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase/browser';

export { isSupabaseConfigured };

export function getSupabase() {
  return getBrowserSupabase();
}

// ==============================================================================
// GOOGLE OAUTH AUTHENTICATION HELPERS
// ==============================================================================
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: new Error('Supabase client chưa được cấu hình.') };
  }

  try {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error: error as Error | null };
  } catch (err) {
    return { error: err as Error };
  }
}

export async function signOutUser(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}
