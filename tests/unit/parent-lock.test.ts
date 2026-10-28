import { describe, expect, it, vi } from 'vitest';
import { requestParentLock } from '@/lib/security/parent-lock';

describe('requestParentLock', () => {
  it('resolves only after the server confirms cookie deletion', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 200 }));

    await expect(requestParentLock(fetcher)).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith('/api/parent-pin', { method: 'DELETE', cache: 'no-store' });
  });

  it.each([403, 503])('rejects an HTTP %s response', async (status) => {
    const fetcher = vi.fn(async () => new Response(null, { status }));

    await expect(requestParentLock(fetcher)).rejects.toThrow('parent_lock_failed');
  });

  it('rejects a network failure', async () => {
    const fetcher = vi.fn(async () => { throw new TypeError('offline'); });

    await expect(requestParentLock(fetcher)).rejects.toThrow('parent_lock_failed');
  });
});
