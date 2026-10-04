import { NextRequest } from 'next/server';
import { rejectCrossSiteRequest } from '@/lib/security/request-origin';
import { z } from 'zod';
import { handleAiRequest } from '@/lib/ai/handler';
import { parseSummary } from '@/lib/ai/output-check';
import { buildSummaryMessages, SUMMARY_SCHEMA, type SummaryInput } from '@/lib/ai/prompts';

export const runtime = 'nodejs';

const count = z.number().int().min(0).max(999);
const body = z.strictObject({
  language: z.enum(['vi', 'en']),
  weeks: z.array(z.strictObject({ alone: count, prompted: count, together: count, unknown: count, missed: count })).min(1).max(6),
  habitsBuilding: count,
  habitsNeedingHelp: count,
  habitsSteady: count,
});

/** A few sentences about the week from counts alone. No habit names, no child name, nothing written by anyone. */
export async function POST(request: NextRequest) {
  const crossSite = rejectCrossSiteRequest(request);
  if (crossSite) return crossSite;
  return handleAiRequest<SummaryInput, ReturnType<typeof parseSummary>>(request, {
    kind: 'summary',
    operation: 'ai_weekly_summary',
    route: '/api/ai/weekly-summary',
    readInput: (raw) => {
      const parsed = body.safeParse(raw);
      return parsed.success ? parsed.data : null;
    },
    buildMessages: buildSummaryMessages,
    schema: SUMMARY_SCHEMA,
    checkOutput: (reply) => parseSummary(reply),
  });
}
