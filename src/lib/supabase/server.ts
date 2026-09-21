import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function readPublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

  if (!url.startsWith('https://') || !anonKey) {
    throw new Error('Supabase server configuration is missing.');
  }

  return { url, anonKey };
}

export async function createServerSupabaseClient() {
  const { url, anonKey } = readPublicConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          return;
        }
      },
    },
  });
}
