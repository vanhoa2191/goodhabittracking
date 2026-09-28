import { describe, expect, it, vi } from 'vitest';

import { changeParentPin, readParentPinStatus, verifyParentPin } from '@/lib/store/parent-pin-client';

describe('parent PIN client', () => {
  it('reads whether the family has configured a PIN', async () => {
    const requester = vi.fn(async () => new Response(JSON.stringify({
      configured: true,
      lockedUntil: null,
    }), { status: 200 }));

    await expect(readParentPinStatus(requester)).resolves.toEqual({ configured: true, lockedUntil: null });
  });

  it('returns a lock result without exposing server internals', async () => {
    const requester = vi.fn(async () => new Response(JSON.stringify({
      status: 'locked',
      retryAfterSeconds: 120,
    }), { status: 429 }));

    await expect(verifyParentPin('9876', requester)).resolves.toEqual({
      status: 'locked',
      retryAfterSeconds: 120,
    });
  });

  it('requires the current PIN when replacing a configured PIN', async () => {
    const requester = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({ currentPin: '2468', newPin: '1357' });
      return new Response(JSON.stringify({ status: 'updated' }), { status: 200 });
    });

    await expect(changeParentPin({ currentPin: '2468', newPin: '1357' }, requester))
      .resolves.toEqual({ status: 'updated' });
  });

  it('preserves an authoritative lock result when changing a PIN', async () => {
    const requester = vi.fn(async () => new Response(JSON.stringify({
      status: 'locked',
      retryAfterSeconds: 900,
    }), { status: 429 }));

    await expect(changeParentPin({ currentPin: '0000', newPin: '1357' }, requester))
      .resolves.toEqual({ status: 'locked', retryAfterSeconds: 900 });
  });
});
