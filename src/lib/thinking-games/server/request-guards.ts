import 'server-only';

import { NextResponse } from 'next/server';
import { failure } from './response';

const MAX_BODY_BYTES = 16 * 1024;
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
const MAX_BUCKETS = 2048;
const buckets = new Map<string, { expiresAt: number; count: number }>();

// A bounded, per-isolate guard before authentication/DB work. Deployment-wide
// quotas still belong at the edge; rotating an untrusted cookie cannot bypass IP limits.
export function limitThinkingGameRequest(request: Request, actorKey?: string) {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.expiresAt <= now) buckets.delete(key);
  }
  const key = actorKey ? `actor:${actorKey}` : `ip:${request.headers.get('cf-connecting-ip') ?? 'unknown'}`;
  const bucket = buckets.get(key);
  if ((!bucket && buckets.size >= MAX_BUCKETS) || (bucket && bucket.count >= MAX_REQUESTS)) {
    return NextResponse.json(failure('rate_limited'), { status: 429, headers: { 'Retry-After': '60' } });
  }
  if (bucket) bucket.count += 1;
  else buckets.set(key, { expiresAt: now + WINDOW_MS, count: 1 });
  return null;
}

export async function readThinkingGameBody(request: Request): Promise<
  { ok: true; value: unknown } | { ok: false; response: NextResponse }
> {
  const tooLarge = () => ({ ok: false as const, response: NextResponse.json(failure('payload_too_large'), { status: 413 }) });
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return tooLarge();
  const reader = request.body?.getReader();
  if (!reader) return { ok: true, value: null };
  let total = 0;
  let body = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => undefined);
        return tooLarge();
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return { ok: true, value: null };
  } finally {
    reader.releaseLock();
  }
}
