import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { normalizeJournalText, parseJournalEntry } from '@/lib/child-journal';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const journalInput = z.object({
  childId: z.string().uuid(),
  date: z.iso.date(),
  text: z.string(),
}).strict();

export async function PUT(request: NextRequest) {
  const parent = await getParentContext();
  if (!parent) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

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

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('save_parent_child_journal', {
    target_family_id: parent.familyId,
    target_child_id: parsed.data.childId,
    target_local_date: parsed.data.date,
    target_entry_text: text,
  });
  if (error) return NextResponse.json({ error: 'Journal could not be saved.' }, { status: 503 });
  if (data?.status === 'session_invalid') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
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
