import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearLocalThinkingGame,
  finishLocalThinkingGame,
  getLocalThinkingGame,
  pauseLocalThinkingGame,
  resumeLocalThinkingGame,
  startLocalThinkingGame,
  subscribeLocalThinkingGame,
} from '@/lib/store/thinking-games-local';

type PilotItem = { id: string; solution: unknown; dayIndex: number; slotType: string; ageTrack: string; locale: string; contentVersion: string };
const pilot = JSON.parse(readFileSync(join(process.cwd(), 'content/thinking-games/pilot/pilot-manifest-v1.json'), 'utf8')) as { items: PilotItem[] };
const item = pilot.items.find((entry) =>
  entry.dayIndex === 1 && entry.slotType === 'main' && entry.ageTrack === 'age_6_8'
  && entry.locale === 'vi' && entry.contentVersion === 'pilot-2026-10-21');
if (!item) throw new Error('local pilot fixture missing');

class FakeStorageEvent {
  readonly type = 'storage';
  constructor(
    _type: string,
    readonly init: { key?: string | null; newValue?: string | null } = {},
  ) {}
  get key() { return this.init.key ?? null; }
  get newValue() { return this.init.newValue ?? null; }
}

function installLocalBrowser() {
  const store = new Map<string, string>();
  const listeners = new Set<(event: FakeStorageEvent) => void>();
  const localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  };
  const window = {
    addEventListener: (type: string, listener: (event: FakeStorageEvent) => void) => {
      if (type === 'storage') listeners.add(listener);
    },
    removeEventListener: (type: string, listener: (event: FakeStorageEvent) => void) => {
      if (type === 'storage') listeners.delete(listener);
    },
    dispatchEvent: (event: FakeStorageEvent) => {
      for (const listener of listeners) listener(event);
      return true;
    },
  };
  vi.stubGlobal('localStorage', localStorage);
  vi.stubGlobal('window', window);
  vi.stubGlobal('StorageEvent', FakeStorageEvent);
  return { store, listeners };
}

describe('thinking-games local practice adapter', () => {
  beforeEach(() => {
    installLocalBrowser();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T12:00:00+07:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('persists a practice attempt and notifies same-tab/other-tab subscribers', () => {
    const { store, listeners } = installLocalBrowser();
    const listener = vi.fn();
    const unsubscribe = subscribeLocalThinkingGame(listener);
    const state = startLocalThinkingGame('main');
    expect(state?.puzzle.id).toBe(item.id);
    expect(getLocalThinkingGame()?.attemptId).toBe(state?.attemptId);
    expect(store.has('kidhabit.thinking-games.local-practice.v1')).toBe(true);
    expect(listeners.size).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);

    pauseLocalThinkingGame();
    expect(getLocalThinkingGame()?.paused).toBe(true);
    expect(listener).toHaveBeenCalledTimes(2);

    resumeLocalThinkingGame();
    expect(getLocalThinkingGame()?.paused).toBe(false);
    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
    expect(listeners.size).toBe(0);
  });

  it('grades correct and wrong answers through the local checker only', () => {
    startLocalThinkingGame('main');
    expect(finishLocalThinkingGame(item.solution)).toMatchObject({ correct: true });
    expect(finishLocalThinkingGame('wrong')).toMatchObject({ correct: false });
  });

  it('clears practice and broadcasts the removal to another tab', () => {
    startLocalThinkingGame('main');
    const listener = vi.fn();
    const unsubscribe = subscribeLocalThinkingGame(listener);
    clearLocalThinkingGame();
    expect(getLocalThinkingGame()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('reuses an existing practice attempt rather than minting a second one', () => {
    const first = startLocalThinkingGame('main');
    const second = startLocalThinkingGame('main');
    expect(second?.attemptId).toBe(first?.attemptId);
  });
});
