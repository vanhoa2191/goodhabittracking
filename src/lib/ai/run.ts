import { AI_MODEL, AI_TIMEOUT_MS, AI_USES_JSON_MODE } from './config';
import { getAiBinding } from './binding';
import type { ChatMessage } from './prompts';

export type AiFailure = 'disabled' | 'timeout' | 'quota' | 'error';
export type ModelReply = { readonly ok: true; readonly reply: unknown } | { readonly ok: false; readonly reason: AiFailure };

type Dependencies = {
  readonly binding?: ReturnType<typeof getAiBinding>;
  readonly timeoutMs?: number;
};

function isAccountLimit(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /\b3036\b|daily free allocation|neurons/i.test(text);
}

/**
 * Asks the model once. No retry (a retry spends the shared daily allowance), an eight second limit, and the
 * messages are never logged or kept. The kill switch is a Worker variable, so it works without a new build.
 */
export async function askModel(
  messages: readonly ChatMessage[],
  schema: object,
  dependencies: Dependencies = {},
): Promise<ModelReply> {
  if (process.env.AI_KILL_SWITCH === 'true') return { ok: false, reason: 'disabled' };
  const binding = dependencies.binding === undefined ? getAiBinding() : dependencies.binding;
  if (!binding) return { ok: false, reason: 'disabled' };

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const request = binding.run(AI_MODEL, {
      messages,
      max_tokens: 400,
      temperature: 0.4,
      ...(AI_USES_JSON_MODE ? { response_format: { type: 'json_schema', json_schema: schema } } : {}),
    });
    const timeout = new Promise<'timeout'>((resolve) => {
      timer = setTimeout(() => resolve('timeout'), dependencies.timeoutMs ?? AI_TIMEOUT_MS);
    });
    const outcome = await Promise.race([request, timeout]);
    if (outcome === 'timeout') return { ok: false, reason: 'timeout' };
    const reply = outcome && typeof outcome === 'object' && 'response' in outcome ? (outcome as { response: unknown }).response : outcome;
    return { ok: true, reply };
  } catch (error) {
    return { ok: false, reason: isAccountLimit(error) ? 'quota' : 'error' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
