import type * as React from 'react';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReferralClaimer } from '@/components/ReferralClaimer';

const hooks = vi.hoisted(() => ({
  effects: [] as Array<() => void>,
  attempted: { current: false },
  state: {
    currentUser: { id: 'user' } as { id: string } | null,
    familyId: 'family' as string | null,
    familyRole: 'owner' as string | null,
    isEntryReady: true,
  },
}));
vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof React>(),
  useRef: () => hooks.attempted,
  useEffect: (effect: () => void) => { hooks.effects.push(effect); },
}));
vi.mock('@/lib/store', () => ({ useAppStore: () => hooks.state }));

let cookieWrites: string[];
let fetchMock: Mock;

function renderEffects() {
  hooks.effects = [];
  ReferralClaimer();
  for (const effect of hooks.effects) effect();
}

beforeEach(() => {
  hooks.attempted.current = false;
  hooks.state = { currentUser: { id: 'user' }, familyId: 'family', familyRole: 'owner', isEntryReady: true };
  cookieWrites = [];
  vi.stubGlobal('window', { location: { search: '?ref=%20qrstuvwx%20' } });
  vi.stubGlobal('location', { protocol: 'https:' });
  vi.stubGlobal('document', {
    get cookie() { return 'other=value; kidhabit_ref=ABCDEFGH'; },
    set cookie(value: string) { cookieWrites.push(value); },
  });
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'claimed' })));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('ReferralClaimer attribution', () => {
  it.each([
    ['?ref=%20qrstuvwx%20', 'QRSTUVWX'],
    ['?ref=invalid', 'ABCDEFGH'],
    ['', 'ABCDEFGH'],
  ])('posts the latest valid URL code, falling back to the cookie (%s)', (search, code) => {
    window.location.search = search;
    renderEffects();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/referral/claim');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ code });
  });

  it.each(['owner', 'parent', 'guardian'])('allows a ready %s to claim', (role) => {
    hooks.state.familyRole = role;
    renderEffects();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    { currentUser: null },
    { familyId: null },
    { isEntryReady: false },
    { familyRole: 'caregiver' },
    { familyRole: null },
  ])('waits for a ready managing family before claiming (%j)', (guard) => {
    Object.assign(hooks.state, guard);
    renderEffects();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(hooks.attempted.current).toBe(false);
    hooks.state = { currentUser: { id: 'user' }, familyId: 'family', familyRole: 'owner', isEntryReady: true };
    renderEffects();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not post when neither source has a valid code', () => {
    window.location.search = '?ref=invalid';
    vi.stubGlobal('document', { cookie: 'kidhabit_ref=invalid' });
    renderEffects();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['claimed', 'invalid', 'self', 'expired', 'already_referred', 'disabled'])('clears referral cookies after the final answer %s without posting again', async (status) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ status })));
    renderEffects();
    await vi.waitFor(() => expect(cookieWrites).toHaveLength(2));
    for (const cookie of cookieWrites) {
      expect(cookie).toContain('kidhabit_ref=;');
      expect(cookie).toContain('Max-Age=0');
      expect(cookie).toContain('Path=/');
    }
    renderEffects();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
