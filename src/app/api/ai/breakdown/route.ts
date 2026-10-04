import { NextRequest } from 'next/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { z } from 'zod';
import { handleAiRequest } from '@/lib/ai/handler';
import { parseBreakdown } from '@/lib/ai/output-check';
import { ageBandOf, BREAKDOWN_SCHEMA, buildBreakdownMessages, type BreakdownInput } from '@/lib/ai/prompts';
import { cleanHabitTitle, removeChildNames } from '@/lib/ai/sanitize';

export const runtime = 'nodejs';

const body = z.strictObject({
  title: z.string().max(400),
  ageYears: z.number().int().min(0).max(18),
  language: z.enum(['vi', 'en']),
});

/** Splits a habit the parent typed into three small steps. Only the cleaned title and an age band reach the model. */
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  return handleAiRequest<BreakdownInput, ReturnType<typeof parseBreakdown>>(request, {
    kind: 'breakdown',
    operation: 'ai_breakdown',
    route: '/api/ai/breakdown',
    readInput: (raw) => {
      const parsed = body.safeParse(raw);
      const title = parsed.success ? cleanHabitTitle(parsed.data.title) : null;
      return parsed.success && title ? { title, ageBand: ageBandOf(parsed.data.ageYears), language: parsed.data.language } : null;
    },
    prepare: async (input, { supabase, familyId }) => {
      const { data, error } = await supabase.from('child_profiles').select('name,nickname').eq('family_id', familyId);
      if (error) return null;
      const names = (data ?? []).flatMap((row: { name: string | null; nickname: string | null }) => [row.name, row.nickname].filter((value): value is string => Boolean(value)));
      const title = removeChildNames(input.title, names);
      return title ? { ...input, title } : null;
    },
    buildMessages: buildBreakdownMessages,
    schema: BREAKDOWN_SCHEMA,
    checkOutput: (reply, input) => parseBreakdown(reply, input.ageBand),
  });
}
