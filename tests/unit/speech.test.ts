import { describe, expect, it, vi } from 'vitest';
import { canSpeak, speak, stopSpeaking } from '@/lib/speech';
import { getReadAloudCopy } from '@/lib/i18n/read-aloud-copy';
import type { Language } from '@/types';

class FakeUtterance {
  lang = '';
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly text: string) {}
}

function fakeHost() {
  const speechSynthesis = { cancel: vi.fn(), speak: vi.fn() };
  return { speechSynthesis, SpeechSynthesisUtterance: FakeUtterance } as never as Parameters<typeof speak>[2] & {
    speechSynthesis: typeof speechSynthesis;
  };
}

describe('read aloud', () => {
  it('is unavailable without the browser voices', () => {
    expect(canSpeak(null)).toBe(false);
    expect(canSpeak({ speechSynthesis: undefined } as never)).toBe(false);
    expect(speak('Đánh răng', 'vi', null)).toBe(false);
  });

  it('reads in the app language, slowly, replacing anything already being read', () => {
    const target = fakeHost()!;
    expect(speak('Đánh răng. Hai phút.', 'vi', target)).toBe(true);
    const synth = (target as unknown as { speechSynthesis: { cancel: ReturnType<typeof vi.fn>; speak: ReturnType<typeof vi.fn> } }).speechSynthesis;
    expect(synth.cancel).toHaveBeenCalledBefore(synth.speak);
    const utterance = synth.speak.mock.calls[0]![0] as FakeUtterance;
    expect(utterance.text).toBe('Đánh răng. Hai phút.');
    expect(utterance.lang).toBe('vi-VN');
    expect(utterance.rate).toBeLessThan(1);
  });

  it('reports when the reading ends or fails so the button resets', () => {
    const target = fakeHost()!;
    const onEnd = vi.fn();
    speak('Brush teeth', 'en', target, onEnd);
    const synth = (target as unknown as { speechSynthesis: { speak: ReturnType<typeof vi.fn> } }).speechSynthesis;
    const utterance = synth.speak.mock.calls[0]![0] as FakeUtterance;
    utterance.onend?.();
    utterance.onerror?.();
    expect(onEnd).toHaveBeenCalledTimes(2);
  });

  it('does nothing for empty text and stops on request', () => {
    const target = fakeHost()!;
    expect(speak('   ', 'en', target)).toBe(false);
    stopSpeaking(target);
    expect((target as unknown as { speechSynthesis: { cancel: ReturnType<typeof vi.fn> } }).speechSynthesis.cancel).toHaveBeenCalled();
  });

  it.each(['vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'it', 'es'] as const satisfies readonly Language[])('has labels in %s', (language) => {
    const copy = getReadAloudCopy(language);
    expect(copy.read.length).toBeGreaterThan(2);
    expect(copy.stop.length).toBeGreaterThan(2);
  });
});
