import { getCloudflareContext } from '@opennextjs/cloudflare';

export type AiBinding = {
  run: (model: string, input: unknown, options?: unknown) => Promise<unknown>;
};

/** The Workers AI binding, or null where it does not exist (a local run, or a build without the binding). */
export function getAiBinding(): AiBinding | null {
  try {
    const env = getCloudflareContext().env as { AI?: AiBinding };
    return env.AI && typeof env.AI.run === 'function' ? env.AI : null;
  } catch {
    return null;
  }
}
