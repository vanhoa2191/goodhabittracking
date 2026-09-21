import { describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import {
  startCloudIdentitySession,
  type CloudIdentitySource,
} from '@/lib/store/cloud-identity-session';

const user = {
  id: '22222222-2222-4222-8222-222222222222',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'parent@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-09-20T00:00:00.000Z',
} satisfies User;

function deferredUser() {
  let resolve: (value: User | null) => void = () => undefined;
  const promise = new Promise<User | null>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

describe('cloud identity session', () => {
  it('emits the current user and unsubscribes cleanly', async () => {
    const unsubscribe = vi.fn();
    const source: CloudIdentitySource = {
      readCurrentUser: async () => user,
      subscribe: () => unsubscribe,
    };
    const onUserChanged = vi.fn(async () => undefined);

    const stop = startCloudIdentitySession({ source, onUserChanged, onError: vi.fn() });
    await vi.waitFor(() => expect(onUserChanged).toHaveBeenCalledWith(user));
    stop();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('keeps a newer sign-out event when the initial user lookup resolves late', async () => {
    const initialUser = deferredUser();
    let emitUser: (nextUser: User | null) => void = () => undefined;
    const source: CloudIdentitySource = {
      readCurrentUser: () => initialUser.promise,
      subscribe: (listener) => {
        emitUser = listener;
        return () => undefined;
      },
    };
    const onUserChanged = vi.fn(async () => undefined);

    startCloudIdentitySession({ source, onUserChanged, onError: vi.fn() });
    emitUser(null);
    initialUser.resolve(user);
    await initialUser.promise;

    expect(onUserChanged).toHaveBeenCalledTimes(1);
    expect(onUserChanged).toHaveBeenCalledWith(null);
  });

  it('keeps local state when the initial lookup has no cloud user', async () => {
    const initialUser = deferredUser();
    const source: CloudIdentitySource = {
      readCurrentUser: () => initialUser.promise,
      subscribe: () => () => undefined,
    };
    const onUserChanged = vi.fn(async () => undefined);

    startCloudIdentitySession({ source, onUserChanged, onError: vi.fn() });
    initialUser.resolve(null);
    await initialUser.promise;
    await Promise.resolve();

    expect(onUserChanged).not.toHaveBeenCalled();
  });

  it('treats a missing auth session as signed out without reporting an error', async () => {
    const missingSession = new Error('Auth session missing!');
    missingSession.name = 'AuthSessionMissingError';
    const source: CloudIdentitySource = {
      readCurrentUser: async () => { throw missingSession; },
      subscribe: () => () => undefined,
    };
    const onError = vi.fn();

    startCloudIdentitySession({ source, onUserChanged: vi.fn(async () => undefined), onError });
    await Promise.resolve();
    await Promise.resolve();

    expect(onError).not.toHaveBeenCalled();
  });

  it('does not emit after the session watcher is stopped', async () => {
    const initialUser = deferredUser();
    let emitUser: (nextUser: User | null) => void = () => undefined;
    const source: CloudIdentitySource = {
      readCurrentUser: () => initialUser.promise,
      subscribe: (listener) => {
        emitUser = listener;
        return () => undefined;
      },
    };
    const onUserChanged = vi.fn(async () => undefined);

    const stop = startCloudIdentitySession({ source, onUserChanged, onError: vi.fn() });
    stop();
    emitUser(user);
    initialUser.resolve(user);
    await initialUser.promise;

    expect(onUserChanged).not.toHaveBeenCalled();
  });
});
