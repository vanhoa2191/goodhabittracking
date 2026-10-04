import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getParentContext } from '@/lib/auth/parent-context';
import { defaultExperienceFlags } from '@/lib/experience-flags';
import { createCorrelationId, logOperationalEvent } from '@/lib/observability/logger';
import { requireParentUnlock } from '@/lib/security/parent-unlock';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AI_LIMITS, AI_POLICY_VERSION, type AiKind } from './config';
import type { ChatMessage } from './prompts';
import { askModel } from './run';

type Handled<Input, Output> = {
  readonly kind: AiKind;
  readonly operation: string;
  readonly route: string;
  /** Turns the body into the narrow input the prompt needs, or null for a malformed body. */
  readonly readInput: (body: unknown) => Input | null;
  /** Last chance to narrow the input with what the server knows (for example, taking the children's names out). */
  readonly prepare?: (input: Input, context: { readonly supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>; readonly familyId: string }) => Promise<Input | null>;
  readonly buildMessages: (input: Input) => ChatMessage[] | null;
  readonly schema: object;
  readonly checkOutput: (reply: unknown, input: Input) => Output | null;
};

const code = (status: number, error: string, extra: Record<string, unknown> = {}) => NextResponse.json({ success: false, error, ...extra }, { status });

/**
 * One path for every AI suggestion, after the route has refused cross-site requests: signed-in parent, feature on, PIN, the parent's own
 * agreement, a free allowance left, then the model, then a strict check of what it said. Nothing the child or the
 * parent wrote is ever logged here; the logger keeps only codes.
 */
export async function handleAiRequest<Input, Output>(request: NextRequest, spec: Handled<Input, Output>): Promise<NextResponse> {
  const correlationId = createCorrelationId();
  const log = (level: 'info' | 'warn' | 'error', reasonCode: string, status: number) => logOperationalEvent(level, {
    operation: spec.operation, reasonCode, correlationId, route: spec.route, status,
  });

  const parent = await getParentContext();
  if (!parent) {
    log('warn', 'authentication_required', 401);
    return code(401, 'Authentication required.');
  }
  if (!defaultExperienceFlags.parentAi) return code(404, 'Not available.', { code: 'ai_disabled' });

  const input = spec.readInput(await request.json().catch(() => null));
  if (!input) return code(400, 'Invalid request.');

  const supabase = await createServerSupabaseClient();
  const locked = await requireParentUnlock(request, parent, supabase);
  if (locked) return locked as NextResponse;

  const readConsent = () => supabase.from('family_consents')
    .select('revoked_at')
    .eq('family_id', parent.familyId)
    .eq('user_id', parent.user.id)
    .eq('consent_type', 'parent_ai')
    .eq('policy_version', AI_POLICY_VERSION)
    .maybeSingle();
  const consent = await readConsent();
  if (consent.error) {
    log('error', 'consent_unavailable', 503);
    return code(503, 'Consent unavailable.', { code: 'ai_error' });
  }
  if (!consent.data || consent.data.revoked_at) return code(403, 'The AI suggestion needs the parent’s agreement.', { code: 'ai_consent_required' });

  const prepared = spec.prepare ? await spec.prepare(input, { supabase, familyId: parent.familyId }) : input;
  if (!prepared) return code(400, 'Invalid request.');
  const messages = spec.buildMessages(prepared);
  if (!messages) return code(400, 'Invalid request.');

  const quota = await supabase.rpc('consume_ai_quota', {
    per_day: AI_LIMITS.perFamilyPerDay,
    system_per_day: AI_LIMITS.systemPerDay,
    min_gap_seconds: AI_LIMITS.minSecondsBetweenCalls,
  });
  if (quota.error || !quota.data || typeof quota.data !== 'object') {
    log('error', 'quota_unavailable', 503);
    return code(503, 'Suggestion unavailable.', { code: 'ai_error' });
  }
  const verdict = quota.data as { allowed?: unknown; reason?: unknown; remainingToday?: unknown };
  if (verdict.allowed !== true) {
    log('info', `quota_${String(verdict.reason ?? 'refused').replace(/[^a-z_]/g, '')}`, 429);
    return code(429, 'No suggestions left for now.', { code: 'ai_quota', reason: verdict.reason });
  }

  // Withdrawing the agreement takes effect even for a request that was already waiting on the allowance.
  const again = await readConsent();
  if (again.error || !again.data || again.data.revoked_at) return code(403, 'The AI suggestion needs the parent’s agreement.', { code: 'ai_consent_required' });

  const reply = await askModel(messages, spec.schema);
  if (!reply.ok) {
    log(reply.reason === 'error' ? 'error' : 'warn', `model_${reply.reason}`, 503);
    const answer = reply.reason === 'disabled' ? 'ai_disabled' : reply.reason === 'timeout' ? 'ai_timeout' : reply.reason === 'quota' ? 'ai_quota' : 'ai_error';
    return code(503, 'Suggestion unavailable.', { code: answer });
  }
  const output = spec.checkOutput(reply.reply, prepared);
  if (!output) {
    log('warn', 'model_invalid_output', 503);
    return code(503, 'Suggestion unavailable.', { code: 'ai_invalid_output' });
  }
  log('info', 'suggestion_made', 200);
  return NextResponse.json({ success: true, result: output, remainingToday: typeof verdict.remainingToday === 'number' ? verdict.remainingToday : null });
}
