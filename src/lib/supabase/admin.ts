import 'server-only';

import { createClient } from '@supabase/supabase-js';

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

  if (!url.startsWith('https://') || !serviceRoleKey) {
    throw new Error('Supabase service role configuration is missing.');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
