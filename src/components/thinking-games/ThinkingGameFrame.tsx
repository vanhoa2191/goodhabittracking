'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  HelpCircle,
  Lightbulb,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getThinkingGamesViCopy } from '@/lib/i18n/thinking-games-copy';
import { ThinkingGameStatus } from './ThinkingGameStatus';
import { useThinkingGameAudio } from './use-thinking-game-audio';

export type ThinkingGameState =
  | 'invitation'
  | 'tutorial'
  | 'playing'
  | 'paused'
  | 'hints'
  | 'wrong'
  | 'retry'
  | 'finish'
  | 'explanation'
  | 'exit'
  | 'loading'
  | 'error'
  | 'network_pending'
  | 'network pending'
  | 'approval_waiting'
  | 'approval waiting'
  | 'bonus_locked'
  | 'bedtime'
  | 'missing_content'
  | 'missing content';

export interface ThinkingGameFrameProps {
  /** Authoritative state passed by parent or game engine */
  readonly state: ThinkingGameState;
  /** Slot type: main daily challenge or bonus challenge */
  readonly slotType: 'main' | 'bonus';
  /** Game title */
  readonly title: string;
  /** Day index (1–365) */
  readonly dayIndex?: number;
  /** Age track target */
  readonly ageTrack?: 'age_6_8' | 'age_9_12';
  /** Invitation text override */
  readonly invitationText?: string;
  /** Tutorial guidance text override */
  readonly tutorialText?: string;
  /** Explanation text override */
  readonly explanationText?: string;
  /** Available hint texts (max 2) */
  readonly hints?: readonly [string, string] | readonly string[];
  /** Current active hint level (0 = none, 1 = level 1, 2 = level 2) */
  readonly activeHintLevel?: 0 | 1 | 2;
  /** Error code (from contracts §14) */
  readonly errorCode?: string;
  /** Custom error or status message */
  readonly statusMessage?: string;
  /** Praise type on completion */
  readonly praiseType?: 'persistence' | 'strategy';
  /** Companion mascot name (optional) */
  readonly mascotName?: string;
  /** External mute override */
  readonly isMuted?: boolean;

  /** Callbacks */
  readonly onStart?: () => void;
  readonly onResume?: () => void;
  readonly onPause?: () => void;
  readonly onRequestHint?: () => void;
  readonly onRetry?: () => void;
  readonly onExit?: () => void;
  readonly onFinishAcknowledge?: () => void;
  readonly onToggleMute?: (muted: boolean) => void;
  readonly onViewTasks?: () => void;

  /** Interactive puzzle board and gameplay controls slot */
  readonly children?: ReactNode;
}

export function ThinkingGameFrame({
  state,
  slotType,
  title,
  dayIndex = 1,
  ageTrack = 'age_6_8',
  invitationText,
  tutorialText,
  explanationText,
  hints,
  activeHintLevel = 0,
  errorCode,
  statusMessage,
  praiseType = 'persistence',
  mascotName,
  isMuted: externalMuted,
  onStart,
  onResume,
  onPause,
  onRequestHint,
  onRetry,
  onExit,
  onFinishAcknowledge,
  onToggleMute,
  onViewTasks,
  children,
}: ThinkingGameFrameProps) {
  const copy = getThinkingGamesViCopy();
  const audio = useThinkingGameAudio();

  const isMuted = externalMuted !== undefined ? externalMuted : audio.isMuted;
  const handleToggleMute = () => {
    if (onToggleMute) {
      onToggleMute(!isMuted);
    } else {
      audio.toggleMute();
    }
  };

  // Internal dialog state for explanation viewed from finish screen
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [overrideHintLevel, setOverrideHintLevel] = useState<0 | 1 | 2 | null>(null);

  // Play celebration once when transitioning to finish
  const hasCelebratedRef = useRef(false);
  useEffect(() => {
    if (state === 'finish' && !hasCelebratedRef.current) {
      hasCelebratedRef.current = true;
      audio.playCelebration();
    } else if (state !== 'finish') {
      hasCelebratedRef.current = false;
    }
  }, [state, audio]);

  // Normalize state name (handle spaces)
  const normalizedKey = state.replace(/\s+/g, '_');

  // Handle keyboard Escape for quick pause / exit
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // If an interactive modal dialog is open, let the modal handler manage Escape
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }
      if (event.key === 'Escape') {
        if (normalizedKey === 'playing') {
          if (onPause) {
            audio.playClick();
            onPause();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [normalizedKey, onPause, audio]);

  // Compute hints remaining
  const effectiveHintLevel = overrideHintLevel !== null ? overrideHintLevel : activeHintLevel;
  const availableHints = hints ?? [copy.hints.defaultHint1, copy.hints.defaultHint2];
  const maxHints = availableHints.length;
  const currentHintIndex = effectiveHintLevel > 0 ? effectiveHintLevel - 1 : 0;
  const activeHintText = availableHints[currentHintIndex] ?? '';
  const canRequestMoreHints = effectiveHintLevel < maxHints;

  const handleHintClick = () => {
    audio.playClick();
    if (canRequestMoreHints) {
      const nextLevel = (effectiveHintLevel + 1) as 1 | 2;
      setOverrideHintLevel(nextLevel);
      if (onRequestHint) {
        onRequestHint();
      }
    }
  };

  const handleCloseHint = () => {
    audio.playClick();
    setOverrideHintLevel(0);
  };

  // Determine button size scaling based on age track
  const isYoung = ageTrack === 'age_6_8';
  const primaryButtonMinHeight = isYoung ? 'min-h-[56px] text-lg' : 'min-h-[48px] text-base';

  return (
    <div
      className="relative mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-sand-200 bg-sand-50 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-950"
      role="region"
      aria-label={`${title} - ${slotType === 'bonus' ? copy.labels.bonusSlotBadge : copy.labels.mainSlotBadge}`}
    >
      {/* Header bar */}
      <header className="flex items-center justify-between border-b border-sand-200/80 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        {/* Left: Exit button */}
        <button
          type="button"
          onClick={() => {
            audio.playClick();
            if (onExit) onExit();
          }}
          aria-label={copy.labels.close}
          title={copy.labels.close}
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Center: Title & badges */}
        <div className="flex flex-col items-center px-2 text-center">
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              {copy.labels.dayBadge(dayIndex)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                slotType === 'bonus'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300'
                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
              }`}
            >
              {slotType === 'bonus' ? copy.labels.bonusSlotBadge : copy.labels.mainSlotBadge}
            </span>
          </div>
          <h1 className="mt-0.5 truncate text-sm font-extrabold text-slate-900 dark:text-slate-100 sm:text-base">
            {title}
          </h1>
        </div>

        {/* Right: Sound toggle and Pause buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={copy.labels.muteButtonAria(isMuted)}
            aria-pressed={isMuted}
            title={copy.labels.muteButtonAria(isMuted)}
            className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700"
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-rose-500" aria-hidden="true" />
            ) : (
              <Volume2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            )}
          </button>

          {normalizedKey === 'playing' && onPause && (
            <button
              type="button"
              onClick={() => {
                audio.playClick();
                onPause();
              }}
              aria-label={copy.playing.pauseAction}
              title={copy.playing.pauseAction}
              className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-700"
            >
              <Pause className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* Main body area */}
      <main className="flex-1 p-4 sm:p-6">
        {/* State 1: Invitation */}
        {normalizedKey === 'invitation' && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-600 shadow-inner dark:bg-amber-950/60 dark:text-amber-300">
              <Sparkles className="h-10 w-10" aria-hidden="true" />
            </div>
            {mascotName && (
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {copy.labels.companionAria(mascotName)}
              </p>
            )}
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {slotType === 'bonus' ? copy.invitation.bonusTitle : copy.invitation.mainTitle}
            </h2>
            <p className="mt-3 max-w-sm text-base text-slate-700 dark:text-slate-300">
              {invitationText || (slotType === 'bonus' ? copy.invitation.bonusBody : copy.invitation.mainBody)}
            </p>
            <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
              {onStart && (
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    onStart();
                  }}
                  className={`flex w-full items-center justify-center rounded-2xl bg-indigo-700 px-6 font-bold text-white shadow-md transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 ${primaryButtonMinHeight}`}
                >
                  {copy.invitation.startAction}
                </button>
              )}
              {onExit && (
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    onExit();
                  }}
                  className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
                >
                  {copy.invitation.laterAction}
                </button>
              )}
            </div>
          </div>
        )}

        {/* State 2: Tutorial */}
        {normalizedKey === 'tutorial' && (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <HelpCircle className="h-8 w-8" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{copy.tutorial.title}</h2>
            <div className="mt-4 w-full rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-left dark:border-indigo-900/40 dark:bg-indigo-950/30">
              <p className="text-base font-medium text-slate-800 dark:text-slate-200">
                {tutorialText || copy.tutorial.defaultGuidance}
              </p>
            </div>

            {/* Read Aloud button */}
            {audio.isVoiceAvailable && (
              <button
                type="button"
                onClick={() => audio.toggleReadAloud(tutorialText || copy.tutorial.defaultGuidance)}
                aria-pressed={audio.isReading}
                className="mt-3 inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-indigo-800 dark:bg-zinc-800 dark:text-indigo-300"
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                {audio.isReading ? copy.tutorial.stopReadAloudAction : copy.tutorial.readAloudAction}
              </button>
            )}

            {/* Interactive preview / renderer if provided */}
            {children && <div className="mt-5 w-full">{children}</div>}

            <div className="mt-8 flex w-full max-w-xs justify-center">
              {onStart && (
                <button
                  type="button"
                  onClick={() => {
                    audio.stopReadAloud();
                    audio.playClick();
                    onStart();
                  }}
                  className={`flex w-full items-center justify-center rounded-2xl bg-indigo-700 px-6 font-bold text-white shadow-md transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 ${primaryButtonMinHeight}`}
                >
                  {copy.tutorial.understandAction}
                </button>
              )}
            </div>
          </div>
        )}

        {/* States: Playing, Hints, Wrong, Retry, plus Paused and Exit overlays */}
        {(normalizedKey === 'playing' ||
          normalizedKey === 'hints' ||
          normalizedKey === 'wrong' ||
          normalizedKey === 'retry' ||
          normalizedKey === 'paused' ||
          normalizedKey === 'exit') && (
          <div className="flex flex-col gap-4">
            {/* Action strip: Hints toggle and Reset */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleHintClick}
                disabled={!canRequestMoreHints && effectiveHintLevel > 0}
                aria-label={copy.labels.hintButtonAria(effectiveHintLevel, maxHints)}
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500 ${
                  effectiveHintLevel > 0
                    ? 'border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200'
                }`}
              >
                <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <span>{copy.playing.hintAction}</span>
                <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-xs font-black dark:bg-amber-900/60">
                  {effectiveHintLevel}/{maxHints}
                </span>
              </button>

              {onRetry && (
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    onRetry();
                  }}
                  aria-label={copy.retry.confirmAction}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>{copy.retry.confirmAction}</span>
                </button>
              )}
            </div>

            {/* Active Hint display callout */}
            {effectiveHintLevel > 0 && activeHintText && (
              <div
                role="region"
                aria-label={effectiveHintLevel === 1 ? copy.hints.level1Title : copy.hints.level2Title}
                className="relative rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                    <Lightbulb className="h-5 w-5 text-amber-600" aria-hidden="true" />
                    <h3 className="text-sm font-extrabold">
                      {effectiveHintLevel === 1 ? copy.hints.level1Title : copy.hints.level2Title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseHint}
                    aria-label={copy.labels.close}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-800 hover:bg-amber-200/60 dark:text-amber-300"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-2 text-sm font-medium text-amber-950 dark:text-amber-100">{activeHintText}</p>
                {canRequestMoreHints && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleHintClick}
                      className="min-h-[44px] rounded-xl bg-amber-200 px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100"
                    >
                      {copy.hints.nextHintAction}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Wrong notice if state is wrong */}
            {normalizedKey === 'wrong' && (
              <ThinkingGameStatus type="wrong" onRetry={onRetry} />
            )}

            {/* Gameplay Renderer Children */}
            <div className="w-full rounded-2xl border border-sand-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {children}
            </div>
          </div>
        )}

        {/* Modal / Dialog States */}
        {normalizedKey === 'paused' && (
          <ThinkingGameStatus
            type="paused"
            onResume={() => {
              audio.playClick();
              if (onResume) onResume();
            }}
            onExit={() => {
              audio.playClick();
              if (onExit) onExit();
            }}
          />
        )}

        {normalizedKey === 'exit' && (
          <ThinkingGameStatus
            type="exit"
            onDismiss={() => {
              audio.playClick();
              if (onResume) onResume();
            }}
            onExit={() => {
              audio.playClick();
              if (onExit) onExit();
            }}
          />
        )}

        {normalizedKey === 'finish' && (
          <ThinkingGameStatus
            type="finish"
            praiseType={praiseType}
            onShowExplanation={() => setShowExplanationModal(true)}
            onExit={() => {
              audio.playClick();
              if (onFinishAcknowledge) onFinishAcknowledge();
              else if (onExit) onExit();
            }}
          />
        )}

        {normalizedKey === 'explanation' && (
          <ThinkingGameStatus
            type="explanation"
            explanationText={explanationText}
            onDismiss={() => {
              audio.playClick();
              if (onFinishAcknowledge) onFinishAcknowledge();
              else if (onExit) onExit();
            }}
          />
        )}

        {normalizedKey === 'loading' && <ThinkingGameStatus type="loading" />}

        {normalizedKey === 'error' && (
          <ThinkingGameStatus
            type="error"
            errorCode={errorCode}
            customMessage={statusMessage}
            onRetry={onRetry}
            onDismiss={onExit}
          />
        )}

        {normalizedKey === 'network_pending' && (
          <ThinkingGameStatus
            type="network_pending"
            onRetry={onRetry}
            onExit={onExit}
          />
        )}

        {normalizedKey === 'approval_waiting' && (
          <ThinkingGameStatus type="approval_waiting" onDismiss={onExit} />
        )}

        {normalizedKey === 'bonus_locked' && (
          <ThinkingGameStatus
            type="bonus_locked"
            onViewTasks={onViewTasks}
            onDismiss={onExit}
          />
        )}

        {normalizedKey === 'bedtime' && (
          <ThinkingGameStatus type="bedtime" onDismiss={onExit} />
        )}

        {normalizedKey === 'missing_content' && (
          <ThinkingGameStatus type="missing_content" onDismiss={onExit} />
        )}

        {/* Secondary explanation modal if opened from finish view */}
        {showExplanationModal && (
          <ThinkingGameStatus
            type="explanation"
            explanationText={explanationText}
            onDismiss={() => setShowExplanationModal(false)}
          />
        )}
      </main>
    </div>
  );
}
