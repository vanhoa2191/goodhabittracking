import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('kidhabit_supabase_url');
    const customKey = localStorage.getItem('kidhabit_supabase_anon_key');
    if (customUrl && customKey) {
      return { url: customUrl.trim(), anonKey: customKey.trim() };
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url: envUrl.trim(), anonKey: envKey.trim() };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http') && !url.includes('your-project'));
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || !url.startsWith('http') || url.includes('your-project')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !anonKey) {
      return { success: false, message: 'URL and Anon Key are required.' };
    }
    const client = createClient(url, anonKey);
    const { error } = await client.from('child_profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      if (error.message?.includes('relation "child_profiles" does not exist')) {
        return {
          success: true,
          message: 'Đã kết nối Supabase! (Cần chạy supabase/schema.sql trên SQL Editor để khởi tạo bảng).',
        };
      }
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Kết nối thành công tới cơ sở dữ liệu Supabase!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: errorMsg };
  }
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
