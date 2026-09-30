import type { Language } from '@/types';

const VOICE_LANGUAGE: Readonly<Record<Language, string>> = {
  vi: 'vi-VN',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  es: 'es-ES',
};

type SpeechHost = Pick<Window, 'speechSynthesis'> & { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance };

function host(): SpeechHost | null {
  return typeof window === 'undefined' ? null : (window as unknown as SpeechHost);
}

/** Reading a task aloud helps children who cannot read yet; it needs the browser's own voices. */
export function canSpeak(target: SpeechHost | null = host()): boolean {
  return Boolean(target?.speechSynthesis && target.SpeechSynthesisUtterance);
}

export function speak(text: string, language: Language, target: SpeechHost | null = host(), onEnd?: () => void): boolean {
  if (!target || !canSpeak(target) || text.trim().length === 0) return false;
  const utterance = new target.SpeechSynthesisUtterance!(text);
  utterance.lang = VOICE_LANGUAGE[language];
  utterance.rate = 0.9;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  target.speechSynthesis.cancel();
  target.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(target: SpeechHost | null = host()): void {
  target?.speechSynthesis?.cancel();
}
