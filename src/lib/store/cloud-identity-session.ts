import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';

export interface CloudIdentitySource {
  readonly readCurrentUser: () => Promise<User | null>;
  readonly subscribe: (listener: (user: User | null) => void) => () => void;
}

interface CloudIdentitySessionOptions {
  readonly source?: CloudIdentitySource;
  readonly onUserChanged: (user: User | null) => Promise<void>;
  readonly onError: (error: unknown) => void;
  readonly onReady?: () => void;
}

function createSupabaseIdentitySource(): CloudIdentitySource | null {
  const supabase = getSupabase();
  if (!supabase) return null;

  return {
    readCurrentUser: async () => {
      const result = await supabase.auth.getUser();
      if (result.error) throw result.error;
      return result.data.user;
    },
    subscribe: (listener) => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          listener(session.user);
          return;
        }
        if (event === 'SIGNED_OUT') listener(null);
      });
      return () => subscription.unsubscribe();
    },
  };
}

export function startCloudIdentitySession(options: CloudIdentitySessionOptions): () => void {
  const source = options.source ?? createSupabaseIdentitySource();
  if (!source) {
    queueMicrotask(() => options.onReady?.());
    return () => undefined;
  }

  let active = true;
  let authRevision = 0;

  const notify = (user: User | null) => {
    void options.onUserChanged(user).catch((error: unknown) => {
      if (active) options.onError(error);
    }).finally(() => {
      if (active) options.onReady?.();
    });
  };

  const initialRevision = authRevision;
  const currentUserPromise = source.readCurrentUser();
  const unsubscribe = source.subscribe((user) => {
    authRevision += 1;
    if (active) notify(user);
  });

  void currentUserPromise
    .then((user) => {
      if (active && authRevision === initialRevision) {
        if (user) notify(user);
        else options.onReady?.();
      }
    })
    .catch((error: unknown) => {
      if (!active) return;
      if (!(error instanceof Error && error.name === 'AuthSessionMissingError')) options.onError(error);
      options.onReady?.();
    });

  return () => {
    active = false;
    unsubscribe();
  };
}
