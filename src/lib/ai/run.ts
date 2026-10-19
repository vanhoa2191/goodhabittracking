import type { getAiBinding } from './binding';
import type { ChatMessage } from './prompts';
import { selectProvider, type AiFailure, type AiProvider, type AiResult } from './providers';

export type { AiFailure };
export type ModelReply = AiResult;

type Dependencies = {
  readonly binding?: ReturnType<typeof getAiBinding>;
  readonly provider?: AiProvider;
  readonly timeoutMs?: number;
};

/**
 * Asks the model once, through the provider `AI_PROVIDER` chooses (Workers AI unless set otherwise). No retry, a time
 * limit, and the messages are never logged or kept. The kill switch is a Worker variable, so it works without a new build.
 */
export async function askModel(
  messages: readonly ChatMessage[],
  schema: object,
  dependencies: Dependencies = {},
): Promise<ModelReply> {
  if (/^(?:true|1)$/i.test(String(process.env.AI_KILL_SWITCH ?? '').trim())) return { ok: false, reason: 'disabled' };
  const provider = dependencies.provider ?? selectProvider(process.env, { binding: dependencies.binding });
  return provider.ask(messages, { schema, timeoutMs: dependencies.timeoutMs });
}
