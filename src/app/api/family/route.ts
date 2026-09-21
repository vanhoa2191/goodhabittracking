import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getParentContext } from '@/lib/auth/parent-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const deleteSchema = z.object({ confirmation: z.literal('DELETE FAMILY') }).strict();

export async function DELETE(request: NextRequest) {
  const parent = await getParentContext();
  if (!parent || parent.role !== 'owner') {
    return NextResponse.json({ success: false, error: 'Family owner authentication required.' }, { status: 403 });
  }
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Confirmation phrase is required.' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('delete_owned_family', { confirmation: parsed.data.confirmation });
  if (error) return NextResponse.json({ success: false, error: 'Family deletion failed.' }, { status: 409 });
  return NextResponse.json({ success: true });
}
