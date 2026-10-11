import { AI_TIMEOUT_MS } from '../config';
import type { AiProvider } from './index';

type Settings = { readonly apiKey: string; readonly baseUrl?: string; readonly model?: string; readonly fetch?: typeof fetch };

/**
 * DeepSeek through its OpenAI-compatible chat endpoint. It is prepared but off: `selectProvider` only builds it when
 * `AI_PROVIDER=deepseek` and a key is set. Turning it on sends the parent's text to a new foreign processor, so first
 * update the CTIA record, the privacy notice and `AI_POLICY_VERSION`.
 */
export function createDeepSeekProvider(settings: Settings): AiProvider {
  const base = (settings.baseUrl || 'https://api.deepseek.com').replace(/\/+$/, '');
  const model = settings.model || 'deepseek-chat';
  const send = settings.fetch ?? fetch;
  return {
    name: 'deepseek',
    async ask(messages, { timeoutMs }) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs ?? AI_TIMEOUT_MS);
      try {
        const response = await send(`${base}/chat/completions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${settings.apiKey}` },
          body: JSON.stringify({ model, messages, max_tokens: 400, temperature: 0.4, response_format: { type: 'json_object' } }),
          signal: controller.signal,
        });
        if (response.status === 402 || response.status === 429) return { ok: false, reason: 'quota' };
        if (!response.ok) return { ok: false, reason: 'error' };
        const body = await response.json().catch(() => null) as { choices?: { message?: { content?: unknown } }[] } | null;
        const content = body?.choices?.[0]?.message?.content;
        return typeof content === 'string' ? { ok: true, reply: content } : { ok: false, reason: 'error' };
      } catch (error) {
        return { ok: false, reason: controller.signal.aborted || (error instanceof Error && error.name === 'AbortError') ? 'timeout' : 'error' };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
