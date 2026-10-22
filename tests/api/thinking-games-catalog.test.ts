import { describe, expect, it } from 'vitest';
import {
  finishThinkingGameForParent,
  getThinkingGameParentState,
  pauseThinkingGameForParent,
  startThinkingGameForParent,
} from '@/lib/store/thinking-games-client';

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const requester = (body: unknown) => async () => response(body);
const childId = '11111111-1111-4111-8111-111111111111';
const attemptId = '22222222-2222-4222-8222-222222222222';
const commandId = '33333333-3333-4333-8333-333333333333';

describe('thinking-games catalog gameplay boundary', () => {
  it('uses explicit parent routes and never sends a child session token', async () => {
    const calls: string[] = [];
    const capture = async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return response({ ok: true, schemaVersion: 'v1', status: 'available', data: {} });
    };
    await getThinkingGameParentState({ childId, expectedLocalDay: '2026-10-21' }, capture);
    await startThinkingGameForParent({ childId, slot: 'main', expectedLocalDay: '2026-10-21', commandId }, capture);
    await pauseThinkingGameForParent({ childId, attemptId, commandId }, capture);
    await finishThinkingGameForParent({ childId, attemptId, answer: 'x', commandId }, capture);
    expect(calls[0]).toContain('/api/domain/thinking-games/state');
    expect(calls[1]).toContain('/api/domain/thinking-games/start');
    expect(calls[2]).toContain('/api/domain/thinking-games/pause');
    expect(calls[3]).toContain('/api/domain/thinking-games/finish');
    expect(calls.join(' ')).not.toContain('session');
  });

  it('rejects malformed gameplay envelopes instead of treating them as playable', async () => {
    await expect(startThinkingGameForParent({
      childId, slot: 'main', expectedLocalDay: '2026-10-21', commandId,
    }, requester({ ok: true, status: 'started' }))).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
