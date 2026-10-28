import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { limitThinkingGameRequest, readThinkingGameBody } from '@/lib/thinking-games/server/request-guards';
import { thinkingGameBonusAvailable } from '@/lib/thinking-games/server/availability';
import type { SupabaseClient } from '@supabase/supabase-js';

let minute = 0;
describe('thinking-games bounded request admission', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(1_000_000 + ++minute * 60_000); });
  afterEach(() => { vi.useRealTimers(); });

  it('limits the IP before DB work even if cookies rotate', () => {
    for (let i = 0; i < 60; i++) {
      expect(limitThinkingGameRequest(new Request('http://localhost', { headers: { cookie: `child=${i}` } }))).toBeNull();
    }
    const blocked = limitThinkingGameRequest(new Request('http://localhost'));
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get('Retry-After')).toBe('60');
    vi.advanceTimersByTime(60_000);
    expect(limitThinkingGameRequest(new Request('http://localhost'))).toBeNull();
  });

  it('limits a session across IP changes', () => {
    for (let i = 0; i < 60; i++) expect(limitThinkingGameRequest(new Request('http://localhost'), 'same-session')).toBeNull();
    expect(limitThinkingGameRequest(new Request('http://localhost', { headers: { 'cf-connecting-ip': '2.2.2.2' } }), 'same-session')?.status).toBe(429);
  });

  it('bounds memory and fails closed when the bucket capacity is exhausted', () => {
    for (let i = 0; i < 2048; i++) expect(limitThinkingGameRequest(new Request('http://localhost'), `actor-${i}`)).toBeNull();
    expect(limitThinkingGameRequest(new Request('http://localhost'), 'another-actor')?.status).toBe(429);
  });

  it('rejects oversized declared and streamed bodies without relying on Content-Length', async () => {
    for (const headers of [new Headers({ 'content-length': '20000' }), new Headers()]) {
      const result = await readThinkingGameBody(new Request('http://localhost', { method: 'POST', headers, body: JSON.stringify({ answer: 'a'.repeat(20_000) }) }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.response.status).toBe(413);
    }
  });

  it('accepts bounded JSON and refuses malformed JSON for schema validation', async () => {
    expect(await readThinkingGameBody(new Request('http://localhost', { method: 'POST', body: '{"answer":["a","b"]}' })))
      .toEqual({ ok: true, value: { answer: ['a', 'b'] } });
    expect(await readThinkingGameBody(new Request('http://localhost', { method: 'POST', body: '{' })))
      .toEqual({ ok: true, value: null });
  });
});

describe('thinking-games server bonus availability', () => {
  it.each([
    ['granted', false, true], ['started', false, true], ['granted', true, false],
    ['revoked_unused', false, false], ['revoked_after_use', false, false], ['finished', false, false],
  ])('bonus %s, main won=%s -> available=%s', async (bonusState, won, expected) => {
    const eq = vi.fn();
    eq.mockReturnValueOnce({ eq }).mockResolvedValueOnce({ data: [
      { slot_type: 'main', state: 'started', thinking_game_attempts: { result: { won } } },
      { slot_type: 'bonus', state: bonusState, thinking_game_attempts: null },
    ], error: null });
    const admin = { from: vi.fn(() => ({ select: vi.fn(() => ({ eq })) })) } as unknown as SupabaseClient;
    expect(await thinkingGameBonusAvailable(admin, 'child-a', '2026-10-28')).toBe(expected);
    expect(eq).toHaveBeenCalledWith('child_id', 'child-a');
    expect(eq).toHaveBeenCalledWith('local_day', '2026-10-28');
  });

  it('fails closed without a main attempt, a grant, or on DB failure', async () => {
    for (const data of [null, [], [{ slot_type: 'bonus', state: 'granted' }]]) {
      const eq = vi.fn();
      eq.mockReturnValueOnce({ eq }).mockResolvedValueOnce({ data, error: data === null ? {} : null });
      const admin = { from: () => ({ select: () => ({ eq }) }) } as unknown as SupabaseClient;
      expect(await thinkingGameBonusAvailable(admin, 'child-a', '2026-10-28')).toBe(false);
    }
  });
});
