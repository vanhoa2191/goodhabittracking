const TTL_MS = 10_000;
const answers = new Map<string, { readonly at: number; readonly value: boolean }>();

export function resetHealthCacheForTests() {
  answers.clear();
}

/**
 * Anyone can call the health endpoint, so a burst of requests must not become a burst of database
 * calls: the answer is reused for a few seconds inside the same worker.
 */
export async function remember(key: string, probe: () => Promise<boolean>, now = Date.now()): Promise<boolean> {
  const last = answers.get(key);
  if (last && now - last.at < TTL_MS) return last.value;
  const value = await probe();
  answers.set(key, { at: now, value });
  return value;
}
