import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeJournalText, parseJournalEntries, parseJournalEntry } from '@/lib/child-journal';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const journalInput = z.object({
  date: z.iso.date(),
  text: z.string(),
}).strict();

async function invalidSession() {
  (await cookies()).delete(CHILD_SESSION_COOKIE);
  return NextResponse.json({ error: 'Child device session expired or revoked.' }, { status: 401 });
}

async function sessionHash(): Promise<string | null> {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  return token ? sha256Hex(token) : null;
}

export async function GET() {
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('read_child_journal', { session_token_hash: tokenHash });
  if (error) return NextResponse.json({ error: 'Journal could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  const parsed = z.object({ status: z.literal('ready'), entries: z.unknown() }).safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Journal could not be loaded.' }, { status: 503 });
  try {
    return NextResponse.json({ entries: parseJournalEntries(parsed.data.entries) });
  } catch {
    return NextResponse.json({ error: 'Journal could not be loaded.' }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid journal entry.' }, { status: 400 });
  }
  const parsed = journalInput.safeParse(payload);
  const text = parsed.success ? normalizeJournalText(parsed.data.text) : null;
  if (!parsed.success || !text) return NextResponse.json({ error: 'Invalid journal entry.' }, { status: 400 });

  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('save_child_journal', {
    session_token_hash: tokenHash,
    target_local_date: parsed.data.date,
    target_entry_text: text,
  });
  if (error) return NextResponse.json({ error: 'Journal could not be saved.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status === 'date_unavailable' || data?.status === 'text_invalid' || data?.status === 'child_unavailable') {
    return NextResponse.json({ error: 'Journal entry is unavailable.' }, { status: 409 });
  }
  const saved = z.object({ status: z.literal('saved'), entry: z.unknown() }).safeParse(data);
  if (!saved.success) return NextResponse.json({ error: 'Journal could not be saved.' }, { status: 503 });
  try {
    return NextResponse.json({ entry: parseJournalEntry(saved.data.entry) });
  } catch {
    return NextResponse.json({ error: 'Journal could not be saved.' }, { status: 503 });
  }
}
