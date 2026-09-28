import 'server-only';

import type { SupabaseClient, User } from '@supabase/supabase-js';

const PAGE_SIZE = 1000;
const MAX_PAGES = 100;

export async function findAuthUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<{ readonly user: User | null; readonly error: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) return { user: null, error: true };
    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail);
    if (match) return { user: match, error: false };
    if (data.users.length < PAGE_SIZE) return { user: null, error: false };
  }
  return { user: null, error: true };
}

export async function listAllAuthUsers(
  admin: SupabaseClient,
): Promise<{ readonly users: readonly User[]; readonly error: boolean }> {
  const users: User[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (error) return { users: [], error: true };
    users.push(...data.users);
    if (data.users.length < PAGE_SIZE) return { users, error: false };
  }
  return { users: [], error: true };
}
