import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { settleWithin } from '@/lib/habit-programs/settle-within';

describe('waiting for a save without waiting forever', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('passes the answer through when it arrives in time', async () => {
    await expect(settleWithin(Promise.resolve(true), 1000)).resolves.toBe(true);
    await expect(settleWithin(Promise.resolve(false), 1000)).resolves.toBe(false);
  });

  it('gives up with false when the save never answers', async () => {
    const pending = settleWithin(new Promise<boolean>(() => undefined), 1000);
    await vi.advanceTimersByTimeAsync(1000);
    await expect(pending).resolves.toBe(false);
  });

  it('treats a rejected save as not saved', async () => {
    await expect(settleWithin(Promise.reject(new Error('network')), 1000)).resolves.toBe(false);
  });

  it('ignores a late answer after giving up', async () => {
    let resolveLate: (value: boolean) => void = () => undefined;
    const pending = settleWithin(new Promise<boolean>((resolve) => { resolveLate = resolve; }), 1000);
    await vi.advanceTimersByTimeAsync(1000);
    resolveLate(true);
    await expect(pending).resolves.toBe(false);
  });
});
