import { getBrowserSupabase, isSupabaseConfigured } from '@/lib/supabase/browser';
import { isPaidPlanId, type PaidPlanId } from '@/lib/billing/plan-catalog';

export { isSupabaseConfigured };

export function getSupabase() {
  return getBrowserSupabase();
}

// ==============================================================================
// GOOGLE OAUTH AUTHENTICATION HELPERS
// ==============================================================================
export type PaidPlan = PaidPlanId;

export function parseCheckoutPlan(value: string | null): PaidPlan | null {
  return isPaidPlanId(value) ? value : null;
}

function sanitizeReturnPath(returnPath?: string): string {
  if (!returnPath || !returnPath.startsWith('/') || returnPath.startsWith('//')) return '/';

  let decoded: string;
  try {
    decoded = decodeURIComponent(returnPath);
  } catch {
    return '/';
  }

  if (decoded.startsWith('//') || decoded.includes('\\') || /[\r\n\0]/u.test(decoded)) return '/';

  try {
    const origin = window.location.origin;
    const candidate = new URL(returnPath, origin);
    if (candidate.origin !== origin) return '/';
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return '/';
  }
}

export async function signInWithGoogle(returnPath?: string): Promise<{ error: Error | null }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: new Error('Supabase client chưa được cấu hình.') };
  }

  try {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}${sanitizeReturnPath(returnPath)}`
      : undefined;
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
