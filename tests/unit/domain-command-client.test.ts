import { describe, expect, it, vi } from 'vitest';
import {
  DomainCommandRequestError,
  requestDomainCommand,
  type DomainCommandRequester,
} from '@/lib/store/domain-command-client';

describe('domain command client', () => {
  it('posts a typed command and returns a parsed result', async () => {
    const requester: DomainCommandRequester = vi.fn(async () => new Response(JSON.stringify({
      success: true,
      result: { status: 'pending', redemptionId: '33333333-3333-4333-8333-333333333333' },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    const command = {
      type: 'redeemReward',
      rewardId: '11111111-1111-4111-8111-111111111111',
      childId: '22222222-2222-4222-8222-222222222222',
      commandId: '33333333-3333-4333-8333-333333333333',
    } as const;

    const result = await requestDomainCommand(command, requester);

    expect(result.status).toBe('pending');
    expect(requester).toHaveBeenCalledWith('/api/domain/commands', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(command),
    });
  });

  it('rejects a server-declared command failure', async () => {
    const requester: DomainCommandRequester = async () => new Response(JSON.stringify({
      success: false,
      error: 'The change could not be saved.',
    }), { status: 409, headers: { 'content-type': 'application/json' } });

    await expect(requestDomainCommand({
      type: 'undoHabit',
      logId: '11111111-1111-4111-8111-111111111111',
    }, requester)).rejects.toMatchObject({
      name: 'DomainCommandRequestError',
      message: 'The change could not be saved.',
      status: 409,
    });
  });

  it('rejects malformed success payloads before store hydration', async () => {
    const requester: DomainCommandRequester = async () => new Response(JSON.stringify({
      success: true,
      result: { accepted: true },
    }), { status: 200, headers: { 'content-type': 'application/json' } });

    const request = requestDomainCommand({
      type: 'reviewHabit',
      logId: '11111111-1111-4111-8111-111111111111',
      decision: 'approve',
    }, requester);

    await expect(request).rejects.toBeInstanceOf(DomainCommandRequestError);
  });
});
