'use client';

import { useState } from 'react';
import type {
  AgeTrack,
  FlexibilityAlternativeBoard,
  PathStep,
} from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface FlexibilityAlternativeGameProps {
  readonly board: FlexibilityAlternativeBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: PathStep[]) => void;
  readonly onReset?: () => void;
}

function pointKey(p: PathStep): string {
  return `${p.x},${p.y}`;
}

function samePath(a: readonly PathStep[], b: readonly PathStep[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((pt, idx) => pt.x === b[idx]?.x && pt.y === b[idx]?.y);
}

export function FlexibilityAlternativeGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: FlexibilityAlternativeGameProps) {
  const [currentPath, setCurrentPath] = useState<PathStep[]>([board.start]);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setCurrentPath([board.start]);
  }

  const minSize = getButtonMinSize(ageTrack);

  const knownSet = new Set(board.knownPath.map(pointKey));
  const currentSet = new Set(currentPath.map(pointKey));

  // Generate preset alternative paths
  const presetPaths: { name: string; path: PathStep[] }[] = [];
  const topThenRight: PathStep[] = [
    { x: 0, y: 0 },
    ...Array.from({ length: board.width - 1 }, (_, idx) => ({ x: idx + 1, y: 0 })),
    ...Array.from({ length: board.height - 1 }, (_, idx) => ({ x: board.width - 1, y: idx + 1 })),
  ];
  if (!samePath(topThenRight, board.knownPath)) {
    presetPaths.push({ name: 'Đi men theo mép trên rồi xuống', path: topThenRight });
  }

  const leftThenBottom: PathStep[] = [
    { x: 0, y: 0 },
    ...Array.from({ length: board.height - 1 }, (_, idx) => ({ x: 0, y: idx + 1 })),
    ...Array.from({ length: board.width - 1 }, (_, idx) => ({ x: idx + 1, y: board.height - 1 })),
  ];
  if (!samePath(leftThenBottom, board.knownPath)) {
    presetPaths.push({ name: 'Đi men theo mép trái rồi sang', path: leftThenBottom });
  }

  const handleCellClick = (x: number, y: number) => {
    if (disabled) return;
    const last = currentPath[currentPath.length - 1];
    if (!last) return;

    // Check if cell is the goal or adjacent
    const dist = Math.abs(last.x - x) + Math.abs(last.y - y);
    if (dist === 1) {
      // Add point
      setCurrentPath([...currentPath, { x, y }]);
    } else if (currentPath.length > 1 && last.x === x && last.y === y) {
      // Step back
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const handleApplyPreset = (preset: PathStep[]) => {
    if (disabled) return;
    setCurrentPath(preset);
  };

  const handleReset = () => {
    if (disabled) return;
    setCurrentPath([board.start]);
    onReset?.();
  };

  const lastPoint = currentPath[currentPath.length - 1];
  const reachedGoal = lastPoint?.x === board.goal.x && lastPoint?.y === board.goal.y;
  const isDuplicate = samePath(currentPath, board.knownPath);
  const isValidAlternative = reachedGoal && !isDuplicate;

  const handleSubmit = () => {
    if (disabled || !isValidAlternative) return;
    onSubmit(currentPath);
  };

  return (
    <div
      data-testid="flexibility-alternative-game"
      className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2"
    >
      {/* Instructions */}
      <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-3.5 text-center">
        <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          Tìm cách đi khác để từ 🟢 đến 🏁:
        </div>
        <div className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-white mt-0.5">
          Đường màu cam nét đứt là đường đã có. Hãy chọn đường đi mới không trùng lặp!
        </div>
      </div>

      {/* Preset shortcut buttons */}
      {presetPaths.length > 0 && (
        <div className="w-full flex flex-wrap gap-2 justify-center">
          {presetPaths.map((preset, idx) => (
            <button
              key={`preset-${idx}`}
              type="button"
              data-testid={`preset-path-btn-${idx}`}
              disabled={disabled}
              onClick={() => handleApplyPreset(preset.path)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 transition ${
                reducedMotion ? '' : 'active:scale-95'
              }`}
            >
              Gợi ý: {preset.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="w-full flex flex-col items-center">
        <div
          className="grid gap-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: board.height }).map((_, y) =>
            Array.from({ length: board.width }).map((_, x) => {
              const isStart = board.start.x === x && board.start.y === y;
              const isGoal = board.goal.x === x && board.goal.y === y;
              const isKnown = knownSet.has(`${x},${y}`);
              const isCurrent = currentSet.has(`${x},${y}`);
              const stepIndex = currentPath.findIndex((p) => p.x === x && p.y === y);

              return (
                <button
                  key={`cell-${x}-${y}`}
                  type="button"
                  data-testid={`path-cell-${x}-${y}`}
                  disabled={disabled}
                  onClick={() => handleCellClick(x, y)}
                  aria-label={`Ô (${x}, ${y})`}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm transition-all relative ${
                    isStart
                      ? 'bg-emerald-500 text-white shadow-md'
                      : isGoal
                      ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-300'
                      : isCurrent
                      ? 'bg-sky-500 text-white shadow-md ring-2 ring-sky-300'
                      : isKnown
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-2 border-dashed border-amber-300 text-amber-700'
                      : 'bg-white dark:bg-slate-700/60 text-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {isStart ? '🟢' : isGoal ? '🏁' : isCurrent ? `${stepIndex + 1}` : isKnown ? '·' : ''}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span>🟢 Bắt đầu</span>
          <span>🏁 Đích đến</span>
          <span className="text-amber-600 font-medium">· Đường cũ</span>
          <span className="text-sky-600 font-bold">1-N Đường mới của bạn</span>
        </div>
      </div>

      {/* Path state and controls */}
      <div className="w-full flex items-center justify-between text-xs sm:text-sm px-2">
        <div className="text-slate-600 dark:text-slate-400 font-medium">
          {reachedGoal
            ? isDuplicate
              ? '⚠️ Đây là đường cũ, bạn hãy thử đường khác!'
              : '✨ Đã tới đích bằng đường mới!'
            : `Đã đi được ${currentPath.length} bước...`}
        </div>
        {currentPath.length > 1 && !disabled && (
          <button
            type="button"
            data-testid="clear-selection-btn"
            onClick={handleReset}
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 underline font-medium"
          >
            Về điểm xuất phát
          </button>
        )}
      </div>

      {/* Submit button */}
      <div className="w-full pt-2 flex justify-center">
        <button
          type="button"
          data-testid="submit-answer-btn"
          disabled={disabled || !isValidAlternative}
          onClick={handleSubmit}
          style={{ minHeight: `${minSize}px` }}
          className={`px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all ${
            isValidAlternative && !disabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {isValidAlternative ? 'Xác nhận đường mới này' : 'Dẫn đường tới đích'}
        </button>
      </div>
    </div>
  );
}
