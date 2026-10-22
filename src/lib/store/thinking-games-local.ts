import manifestJson from '../../../content/thinking-games/pilot/pilot-manifest-v1.json';
import { checkAnswer, parseManifest, toPublicPuzzle } from '@/lib/thinking-games';
import type { PublicPuzzle } from '@/lib/thinking-games/types';

const manifest = parseManifest(manifestJson);
const storageKey = 'kidhabit.thinking-games.local-practice.v1';

type LocalState = { attemptId: string; puzzle: PublicPuzzle; paused: boolean; slot: 'main' | 'bonus' };

function read(): LocalState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) as LocalState : null;
  } catch {
    return null;
  }
}

function write(state: LocalState | null): void {
  if (state) localStorage.setItem(storageKey, JSON.stringify(state));
  else localStorage.removeItem(storageKey);
  window.dispatchEvent(new StorageEvent('storage', { key: storageKey, newValue: state ? JSON.stringify(state) : null }));
}

export function getLocalThinkingGame(): LocalState | null {
  return read();
}

export function startLocalThinkingGame(slot: 'main' | 'bonus'): LocalState | null {
  const existing = read();
  if (existing) return existing;
  const dayIndex = ((new Date().getDate() - 1) % 7) + 1;
  const item = manifest.items.find((entry) =>
    entry.dayIndex === dayIndex
    && entry.slotType === slot
    && entry.ageTrack === 'age_6_8'
    && entry.locale === 'vi'
    && entry.contentVersion === 'pilot-2026-10-21');
  if (!item) return null;
  const state = { attemptId: crypto.randomUUID(), puzzle: toPublicPuzzle(item), paused: false, slot };
  write(state);
  return state;
}

export function pauseLocalThinkingGame(): LocalState | null {
  const state = read();
  if (!state) return null;
  const next = { ...state, paused: true };
  write(next);
  return next;
}

export function resumeLocalThinkingGame(): LocalState | null {
  const state = read();
  if (!state) return null;
  const next = { ...state, paused: false };
  write(next);
  return next;
}

export function finishLocalThinkingGame(answer: unknown): { state: LocalState | null; correct: boolean } {
  const state = read();
  if (!state) return { state: null, correct: false };
  const item = manifest.items.find((entry) => entry.id === state.puzzle.id);
  if (!item) return { state, correct: false };
  const result = checkAnswer(item, answer);
  return { state, correct: result.ok && result.correct };
}

export function clearLocalThinkingGame(): void {
  write(null);
}

export function subscribeLocalThinkingGame(listener: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === storageKey) listener();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
