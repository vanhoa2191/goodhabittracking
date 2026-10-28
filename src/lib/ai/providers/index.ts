import { getAiBinding, type AiBinding } from '../binding';
import type { ChatMessage } from '../prompts';
import { createDeepSeekProvider } from './deepseek';
import { createWorkersProvider } from './workers';

export type AiFailure = 'disabled' | 'timeout' | 'quota' | 'error';
export type AiResult = { readonly ok: true; readonly reply: unknown } | { readonly ok: false; readonly reason: AiFailure };
export type AskOptions = { readonly schema: object; readonly timeoutMs?: number };
export type AiProvider = {
  readonly name: 'workers' | 'deepseek';
  ask(messages: readonly ChatMessage[], opts: AskOptions): Promise<AiResult>;
};

export type ProviderEnv = Readonly<Record<string, string | undefined>>;
type Dependencies = { readonly binding?: AiBinding | null; readonly fetch?: typeof fetch };

/** Stands in for a provider that is switched off: it answers `disabled` and never reaches any other provider. */
const disabled: AiProvider = { name: 'workers', ask: async () => ({ ok: false, reason: 'disabled' }) };

/**
 * `AI_PROVIDER` is `workers` (default) or `deepseek`. DeepSeek runs only when it is chosen and has a key; otherwise it
 * fails closed and nothing falls back to Workers. Before enabling it: update the CTIA record (a new foreign
 * processor), the privacy notice and `AI_POLICY_VERSION`, so the parent's agreement covers it.
 */
export function resolveProvider(env: ProviderEnv, dependencies: Dependencies = {}): { readonly provider: AiProvider; readonly available: boolean } {
  if (/^(?:true|1)$/i.test(String(env.AI_KILL_SWITCH ?? '').trim())) return { provider: disabled, available: false };
  if (env.AI_PROVIDER === 'deepseek') {
    const provider: AiProvider = env.DEEPSEEK_API_KEY
      ? createDeepSeekProvider({ apiKey: env.DEEPSEEK_API_KEY, baseUrl: env.DEEPSEEK_BASE_URL, model: env.DEEPSEEK_MODEL, fetch: dependencies.fetch })
      : { ...disabled, name: 'deepseek' };
    return { provider, available: Boolean(env.DEEPSEEK_API_KEY) };
  }
  const binding = dependencies.binding === undefined ? getAiBinding() : dependencies.binding;
  return { provider: binding ? createWorkersProvider(binding) : disabled, available: Boolean(binding) };
}

export function selectProvider(env: ProviderEnv, dependencies: Dependencies = {}): AiProvider {
  return resolveProvider(env, dependencies).provider;
}
