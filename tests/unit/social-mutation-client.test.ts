import { describe, expect, it, vi } from 'vitest';
import {
  requestSocialMutation,
  SocialMutationRequestError,
} from '@/lib/store/social-mutation-client';

const childId = '11111111-1111-4111-8111-111111111111';

describe('social mutation client', () => {
  it('posts a parsed mutation and returns its entity id', async () => {
    const requester = vi.fn(async () => new Response(JSON.stringify({
      success: true,
      entityId: '22222222-2222-4222-8222-222222222222',
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await expect(requestSocialMutation({
      type: 'sendKudo',
      fromChildId: childId,
      toChildId: '33333333-3333-4333-8333-333333333333',
      emoji: '👏',
    }, requester)).resolves.toEqual({
      entityId: '22222222-2222-4222-8222-222222222222',
    });
    expect(requester).toHaveBeenCalledWith('/api/domain/social', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('rejects malformed success responses', async () => {
    const requester = vi.fn(async () => new Response(JSON.stringify({ success: true, entityId: 7 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(requestSocialMutation({
      type: 'joinGroup',
      inviteCode: 'ABC23456',
      childId,
    }, requester)).rejects.toBeInstanceOf(SocialMutationRequestError);
  });

  it('surfaces typed server failures', async () => {
    const requester = vi.fn(async () => new Response(JSON.stringify({
      success: false,
      error: 'The group could not be joined.',
    }), { status: 409, headers: { 'content-type': 'application/json' } }));

    await expect(requestSocialMutation({
      type: 'joinGroup',
      inviteCode: 'ABC23456',
      childId,
    }, requester)).rejects.toMatchObject({
      name: 'SocialMutationRequestError',
      status: 409,
    });
  });
});
