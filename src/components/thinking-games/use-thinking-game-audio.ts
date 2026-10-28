'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { sounds } from '@/lib/sound';
import { canSpeak, speak, stopSpeaking } from '@/lib/speech';

export interface UseThinkingGameAudioResult {
  /** Whether Web Speech API voices are available */
  readonly isVoiceAvailable: boolean;
  /** Whether the frame is currently reading aloud */
  readonly isReading: boolean;
  /** Whether audio effects are muted */
  readonly isMuted: boolean;
  /** Toggle mute on or off */
  readonly toggleMute: () => void;
  /** Toggle TTS reading for a given text */
  readonly toggleReadAloud: (text: string) => void;
  /** Stop any ongoing TTS reading */
  readonly stopReadAloud: () => void;
  /** Play click sound effect */
  readonly playClick: () => void;
  /** Play victory fanfare sound effect */
  readonly playCelebration: () => void;
}

export function useThinkingGameAudio(): UseThinkingGameAudioResult {
  const isVoiceAvailable = useSyncExternalStore(
    () => () => undefined,
    () => canSpeak(),
    () => false
  );

  const [isReading, setIsReading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Synchronize client-side audio mute preference from storage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMuted(!sounds.enabled);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Stop speaking when unmounting
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const toggleMute = useCallback(() => {
    const updatedEnabled = sounds.toggleSound();
    setIsMuted(!updatedEnabled);
  }, []);

  const stopReadAloud = useCallback(() => {
    stopSpeaking();
    setIsReading(false);
  }, []);

  const toggleReadAloud = useCallback(
    (text: string) => {
      if (isReading) {
        stopReadAloud();
        return;
      }
      if (!isVoiceAvailable || text.trim().length === 0) return;

      const started = speak(text, 'vi', undefined, () => {
        setIsReading(false);
      });
      setIsReading(started);
    },
    [isReading, isVoiceAvailable, stopReadAloud]
  );

  const playClick = useCallback(() => {
    if (!isMuted) {
      sounds.playClick();
    }
  }, [isMuted]);

  const playCelebration = useCallback(() => {
    if (!isMuted) {
      sounds.playFanfare();
    }
  }, [isMuted]);

  return {
    isVoiceAvailable,
    isReading,
    isMuted,
    toggleMute,
    toggleReadAloud,
    stopReadAloud,
    playClick,
    playCelebration,
  };
}
