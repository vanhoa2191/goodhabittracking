'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

function readPublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = readPublicConfig();
  return Boolean(url.startsWith('https://') && anonKey);
}

export function getBrowserSupabase(): SupabaseClient | null {
  if (browserClient) return browserClient;

  const { url, anonKey } = readPublicConfig();
  if (!url.startsWith('https://') || !anonKey) return null;

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
