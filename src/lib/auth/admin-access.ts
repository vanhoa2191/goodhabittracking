import type { User } from '@supabase/supabase-js';

export function isAdminUser(user: User | null, configuredEmails = process.env.ADMIN_EMAILS ?? ''): boolean {
  const email = user?.email?.trim().toLowerCase();
  if (!email) return false;
  return configuredEmails.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean).includes(email);
}
