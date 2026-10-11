import { AI_MODEL, AI_TIMEOUT_MS, AI_USES_JSON_MODE } from '../config';
import type { AiBinding } from '../binding';
import type { AiProvider } from './index';

function isAccountLimit(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /\b3036\b|daily free allocation|neurons/i.test(text);
}

/** Workers AI: no retry (a retry spends the shared daily allowance), a time limit, and the messages are never logged or kept. */
export function createWorkersProvider(binding: AiBinding): AiProvider {
  return {
    name: 'workers',
    async ask(messages, { schema, timeoutMs }) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const request = binding.run(AI_MODEL, {
          messages,
          max_tokens: 400,
          temperature: 0.4,
          ...(AI_USES_JSON_MODE ? { response_format: { type: 'json_schema', json_schema: schema } } : {}),
        });
        const timeout = new Promise<'timeout'>((resolve) => {
          timer = setTimeout(() => resolve('timeout'), timeoutMs ?? AI_TIMEOUT_MS);
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
    },
  };
}
