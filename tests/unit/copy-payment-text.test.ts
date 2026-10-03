import { describe, expect, it, vi } from 'vitest';
import { copyPaymentText } from '@/lib/billing/copy-payment-text';

describe('copy payment text', () => {
  it('waits for the clipboard write before reporting success', async () => {
    let finish!: () => void;
    const write = new Promise<void>((resolve) => { finish = resolve; });
    const clipboard = { writeText: vi.fn(() => write) };
    const settled = vi.fn();
    const result = copyPaymentText('123456', clipboard).then(settled);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();
    finish();
    await result;
    expect(clipboard.writeText).toHaveBeenCalledWith('123456');
    expect(settled).toHaveBeenCalledWith(true);
  });

  it('reports failure when clipboard write rejects', async () => {
    await expect(copyPaymentText('123456', { writeText: async () => { throw new Error('Denied'); } })).resolves.toBe(false);
  });

  it('reports failure when clipboard write throws synchronously', async () => {
    await expect(copyPaymentText('123456', { writeText: () => { throw new Error('Unavailable'); } })).resolves.toBe(false);
  });

  it('reports failure when the clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    try {
      await expect(copyPaymentText('123456')).resolves.toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
