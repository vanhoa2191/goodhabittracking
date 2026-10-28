'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgeTrack, PublicPuzzle, SlotType } from '@/lib/thinking-games/types';
import { displayReasoningEliminationExplanation } from '@/lib/thinking-games/display-order';
import { FlexibilityAlternativeGame } from './FlexibilityAlternativeGame';
import { FlexibilityClassifyGame } from './FlexibilityClassifyGame';
import { FlexibilityPerspectiveGame } from './FlexibilityPerspectiveGame';
import { MemoryChangeGame } from './MemoryChangeGame';
import { MemoryPositionGame } from './MemoryPositionGame';
import { MemorySequenceGame } from './MemorySequenceGame';
import { ObservationDifferenceGame } from './ObservationDifferenceGame';
import { ObservationImplausibleGame } from './ObservationImplausibleGame';
import { ObservationTwoTraitsGame } from './ObservationTwoTraitsGame';
import { PathPlanningGame } from './PathPlanningGame';
import { PlanningCommandOrderGame } from './PlanningCommandOrderGame';
import { PlanningFixStepGame } from './PlanningFixStepGame';
import { QuantityBalanceGame } from './QuantityBalanceGame';
import { QuantityGroupingGame } from './QuantityGroupingGame';
import { QuantityTargetGame } from './QuantityTargetGame';
import { ReasoningEliminationGame } from './ReasoningEliminationGame';
import { ReasoningIfThenGame } from './ReasoningIfThenGame';
import { ReasoningMissingInfoGame } from './ReasoningMissingInfoGame';
import { RuleErrorGame } from './RuleErrorGame';
import { RuleSequenceGame } from './RuleSequenceGame';
import { RuleTransformGame } from './RuleTransformGame';
import { SpatialRotationGame } from './SpatialRotationGame';
import { SpatialSilhouetteGame } from './SpatialSilhouetteGame';
import { SpatialSymmetryGame } from './SpatialSymmetryGame';
import {
  ThinkingGameFrame,
  type ThinkingGameState,
} from './ThinkingGameFrame';

export interface ThinkingGamePlayerProps {
  readonly puzzle: PublicPuzzle;
  readonly ageTrack?: AgeTrack;
  readonly slotType?: SlotType;
  readonly dayIndex?: number;
  readonly initialState?: ThinkingGameState;
  readonly onSubmitAnswer?: (
    answer: unknown
  ) => Promise<{ correct: boolean } | boolean> | { correct: boolean } | boolean;
  readonly onFinish?: () => void;
  readonly onExit?: () => void;
  readonly onPauseRequest?: () => Promise<boolean> | boolean;
  readonly onResumeRequest?: () => Promise<boolean> | boolean;
  readonly reducedMotion?: boolean;
  readonly muted?: boolean;
  readonly onMuteToggle?: () => void;
  readonly praiseType?: 'persistence' | 'strategy';
  readonly mascotName?: string;
  readonly explanationText?: string;
}

export function ThinkingGamePlayer({
  puzzle,
  ageTrack: propAgeTrack,
  slotType: propSlotType,
  dayIndex: propDayIndex,
  initialState = 'invitation',
  onSubmitAnswer,
  onFinish,
  onExit,
  onPauseRequest,
  onResumeRequest,
  reducedMotion = false,
  muted,
  onMuteToggle,
  praiseType = 'persistence',
  mascotName = 'Gấu Chăm Chỉ',
  explanationText: propExplanationText,
}: ThinkingGamePlayerProps) {
  const effectiveAgeTrack = propAgeTrack ?? puzzle.ageTrack;
  const effectiveSlotType = propSlotType ?? puzzle.slotType;
  const effectiveDayIndex = propDayIndex ?? puzzle.dayIndex;

  const [gameState, setGameState] = useState<ThinkingGameState>(initialState);
  const [activeHintLevel, setActiveHintLevel] = useState<0 | 1 | 2>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevPuzzleKey, setPrevPuzzleKey] = useState(`${puzzle.id}-${effectiveAgeTrack}-${effectiveSlotType}-${effectiveDayIndex}`);

  // Reset local state during render when puzzle identity changes
  const currentPuzzleKey = `${puzzle.id}-${effectiveAgeTrack}-${effectiveSlotType}-${effectiveDayIndex}`;
  if (prevPuzzleKey !== currentPuzzleKey) {
    setPrevPuzzleKey(currentPuzzleKey);
    setGameState(initialState);
    setActiveHintLevel(0);
    setIsSubmitting(false);
  }

  const gameStateRef = useRef(gameState);
  const contextEpochRef = useRef(0);
  const pausePendingRef = useRef(false);
  const resumePendingRef = useRef(false);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    contextEpochRef.current += 1;
    pausePendingRef.current = false;
    resumePendingRef.current = false;
    return () => {
      contextEpochRef.current += 1;
    };
  }, [currentPuzzleKey]);

  const handleStart = useCallback(() => {
    setGameState('playing');
  }, []);

  const handlePause = useCallback(async () => {
    if (!['playing', 'hints'].includes(gameStateRef.current) || pausePendingRef.current) return;
    const epoch = contextEpochRef.current;
    pausePendingRef.current = true;
    let accepted = true;
    try {
      accepted = (await onPauseRequest?.()) ?? true;
    } catch {
      accepted = false;
    }
    pausePendingRef.current = false;
    if (epoch !== contextEpochRef.current || !accepted || !['playing', 'hints'].includes(gameStateRef.current)) return;
    setGameState('paused');
  }, [onPauseRequest]);

  const handleResume = useCallback(async () => {
    if (gameStateRef.current !== 'paused' || resumePendingRef.current) return;
    const epoch = contextEpochRef.current;
    resumePendingRef.current = true;
    let accepted = true;
    try {
      accepted = (await onResumeRequest?.()) ?? true;
    } catch {
      accepted = false;
    }
    resumePendingRef.current = false;
    if (epoch !== contextEpochRef.current || !accepted || gameStateRef.current !== 'paused') return;
    setGameState('playing');
  }, [onResumeRequest]);

  const handleRequestHint = useCallback(() => {
    setActiveHintLevel((prev) => {
      const next = ((prev % 2) + 1) as 1 | 2;
      return next;
    });
    setGameState('hints');
  }, []);

  const handleRetry = useCallback(() => {
    setGameState('playing');
  }, []);

  const handleFinishAcknowledge = useCallback(() => {
    onFinish?.();
  }, [onFinish]);

  const handleSubmitAnswer = async (answer: unknown) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (onSubmitAnswer) {
        const result = await onSubmitAnswer(answer);
        const isCorrect = typeof result === 'boolean' ? result : Boolean(result?.correct);
        if (isCorrect) {
          setGameState('finish');
        } else {
          setGameState('wrong');
        }
      } else {
        // Fallback: If no server callback is provided, the renderer does not mint victory
        setGameState('finish');
      }
    } catch {
      setGameState('wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render appropriate game mechanic board
  const renderGameRenderer = () => {
    const { gameTypeId, boardData } = puzzle;

    const isBoardDisabled = isSubmitting || (gameState !== 'playing' && gameState !== 'hints');

    if (gameTypeId === 'g01-t1' && boardData.kind === 'rule-sequence') {
      return (
        <RuleSequenceGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g01-t2' && boardData.kind === 'rule-error') {
      return (
        <RuleErrorGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g01-t3' && boardData.kind === 'rule-transform') {
      return (
        <RuleTransformGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g02-t1' && boardData.kind === 'spatial-silhouette') {
      return (
        <SpatialSilhouetteGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g02-t2' && boardData.kind === 'spatial-rotation') {
      return (
        <SpatialRotationGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g02-t3' && boardData.kind === 'spatial-symmetry') {
      return (
        <SpatialSymmetryGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g03-t1' && boardData.kind === 'memory-sequence') {
      return (
        <MemorySequenceGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g03-t2' && boardData.kind === 'memory-position') {
      return (
        <MemoryPositionGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g03-t3' && boardData.kind === 'memory-change') {
      return (
        <MemoryChangeGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g04-t1' && boardData.kind === 'reasoning-elimination') {
      return (
        <ReasoningEliminationGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g04-t2' && boardData.kind === 'reasoning-if-then') {
      return (
        <ReasoningIfThenGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g04-t3' && boardData.kind === 'reasoning-missing-info') {
      return (
        <ReasoningMissingInfoGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g05-t1' && boardData.kind === 'quantity-balance') {
      return (
        <QuantityBalanceGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g05-t2' && boardData.kind === 'quantity-grouping') {
      return (
        <QuantityGroupingGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g05-t3' && boardData.kind === 'quantity-target') {
      return (
        <QuantityTargetGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g06-t1' && boardData.kind === 'path-planning') {
      return (
        <PathPlanningGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g06-t2' && boardData.kind === 'planning-command-order') {
      return (
        <PlanningCommandOrderGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g06-t3' && boardData.kind === 'planning-fix-step') {
      return (
        <PlanningFixStepGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g07-t1' && boardData.kind === 'flexibility-classify') {
      return (
        <FlexibilityClassifyGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g07-t2' && boardData.kind === 'flexibility-perspective') {
      return (
        <FlexibilityPerspectiveGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g07-t3' && boardData.kind === 'flexibility-alternative') {
      return (
        <FlexibilityAlternativeGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g08-t1' && boardData.kind === 'observation-difference') {
      return (
        <ObservationDifferenceGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g08-t2' && boardData.kind === 'observation-two-traits') {
      return (
        <ObservationTwoTraitsGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    if (gameTypeId === 'g08-t3' && boardData.kind === 'observation-implausible') {
      return (
        <ObservationImplausibleGame
          board={boardData}
          ageTrack={effectiveAgeTrack}
          reducedMotion={reducedMotion}
          disabled={isBoardDisabled}
          onSubmit={handleSubmitAnswer}
        />
      );
    }

    // Explicit format unavailable for remaining 21 mechanics
    return (
      <div
        data-testid="format-unavailable-banner"
        role="region"
        aria-label="Định dạng chưa khả dụng"
        className="my-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-zinc-900"
      >
        <span aria-hidden="true" className="text-3xl">🧩</span>
        <h3 className="mt-2 text-base font-bold text-amber-950 dark:text-amber-200">
          Trò chơi này đang được chuẩn bị
        </h3>
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
          Định dạng <code className="font-mono">{gameTypeId}</code> chưa mở trong đợt thử nghiệm này. Bạn hãy quay lại sau nhé!
        </p>
      </div>
    );
  };

  return (
    <ThinkingGameFrame
      state={gameState}
      slotType={effectiveSlotType}
      title={puzzle.title}
      dayIndex={effectiveDayIndex}
      ageTrack={effectiveAgeTrack}
      activeHintLevel={activeHintLevel}
      praiseType={praiseType}
      mascotName={mascotName}
      invitationText={puzzle.invitation}
      tutorialText={puzzle.tutorial}
      explanationText={(puzzle.gameTypeId === 'g04-t1' && puzzle.boardData.kind === 'reasoning-elimination'
        ? displayReasoningEliminationExplanation(puzzle.boardData, propExplanationText)
        : propExplanationText) ?? 'Quan sát các quy luật và thử nhiều cách để tìm lời giải!'}
      hints={puzzle.hints}
      isMuted={muted}
      onToggleMute={onMuteToggle}
      onStart={handleStart}
      onPause={handlePause}
      onResume={handleResume}
      onRequestHint={handleRequestHint}
      onRetry={handleRetry}
      onExit={onExit}
      onFinishAcknowledge={handleFinishAcknowledge}
    >
      {renderGameRenderer()}
    </ThinkingGameFrame>
  );
}
