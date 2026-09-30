const TTL_MS = 10_000;
let last: { readonly key: string; readonly at: number; readonly value: boolean } | null = null;

export function resetHealthCacheForTests() {
  last = null;
}

/**
 * Anyone can call the health endpoint, so a burst of requests must not become a burst of database
 * calls: the answer is reused for a few seconds inside the same worker.
 */
export async function remember(key: string, probe: () => Promise<boolean>, now = Date.now()): Promise<boolean> {
  if (last && last.key === key && now - last.at < TTL_MS) return last.value;
  const value = await probe();
  last = { key, at: now, value };
  return value;
}
