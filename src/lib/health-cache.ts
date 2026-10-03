const TTL_MS = 10_000;
const answers = new Map<string, { readonly at: number; readonly value: unknown }>();

export function resetHealthCacheForTests() {
  answers.clear();
}

/**
 * Anyone can call the health endpoint, so a burst of requests must not become a burst of database
 * calls: the answer is reused for a few seconds inside the same worker. The cached value is whatever the probe
 * returned, so any detail about the answer (such as a failure reason) stays with it. Concurrent cold requests
 * each run their own probe and each keeps the value its own probe produced.
 */
export async function remember<T>(key: string, probe: () => Promise<T>, now = Date.now()): Promise<T> {
  const last = answers.get(key);
  if (last && now - last.at < TTL_MS) return last.value as T;
  const value = await probe();
  answers.set(key, { at: now, value });
  return value;
}
