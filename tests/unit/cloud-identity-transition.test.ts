import { describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { applyCloudIdentityChange, shouldApplyCloudSnapshot } from '@/lib/store/use-cloud-family-identity';

const user = (id: string) => ({
  id,
  aud: 'authenticated',
  role: 'authenticated',
  email: `${id}@example.test`,
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-09-20T00:00:00.000Z',
}) satisfies User;

describe('cloud identity transition', () => {
  it('rejects a late snapshot from an account that is no longer active', () => {
    expect(shouldApplyCloudSnapshot('account-a', 'account-b')).toBe(false);
    expect(shouldApplyCloudSnapshot('account-b', 'account-b')).toBe(true);
    expect(shouldApplyCloudSnapshot('account-b', null)).toBe(false);
  });

  it('clears the previous family before waiting for the next account snapshot', async () => {
    let finishSync: () => void = () => undefined;
    const syncCloudFamily = vi.fn(() => new Promise<boolean>((resolve) => {
      finishSync = () => resolve(true);
    }));
    const resetFamilyScope = vi.fn();

    const transition = applyCloudIdentityChange({
      previousUserId: 'account-a',
      user: user('account-b'),
      resetFamilyScope,
      setCurrentUser: vi.fn(),
      onIdentityStart: vi.fn(),
      onIdentityUser: vi.fn(),
      syncCloudFamily,
    });

    expect(resetFamilyScope).toHaveBeenCalledOnce();
    expect(syncCloudFamily).toHaveBeenCalledWith(expect.objectContaining({ id: 'account-b' }));
    finishSync();
    await expect(transition).resolves.toBe('account-b');
  });

  it('clears family state once when the account signs out', async () => {
    const resetFamilyScope = vi.fn();
    await expect(applyCloudIdentityChange({
      previousUserId: 'account-a',
      user: null,
      resetFamilyScope,
      setCurrentUser: vi.fn(),
      onIdentityStart: vi.fn(),
      onIdentityUser: vi.fn(),
      syncCloudFamily: vi.fn(),
    })).resolves.toBeNull();
    expect(resetFamilyScope).toHaveBeenCalledOnce();
  });
});
