'use client';

import { useState } from 'react';
import type { AgeTrack, MemoryPositionBoard, PathStep } from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface MemoryPositionGameProps {
  readonly board: MemoryPositionBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: PathStep[]) => void;
  readonly onReset?: () => void;
}

export function MemoryPositionGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: MemoryPositionGameProps) {
  // Phase management: 'view' (initial study) | 'recall' (selecting positions)
  const [phase, setPhase] = useState<'view' | 'recall'>('view');
  const [selectedPoints, setSelectedPoints] = useState<PathStep[]>([]);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setPhase('view');
    setSelectedPoints([]);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  const isPointSelected = (x: number, y: number) => {
    return selectedPoints.some((p) => p.x === x && p.y === y);
  };

  const isTarget = (x: number, y: number) => {
    return board.targets.some((p) => p.x === x && p.y === y);
  };

  const isRevealed = (x: number, y: number) => {
    return board.revealed.some((p) => p.x === x && p.y === y);
  };

  const isOptionPoint = (x: number, y: number) => {
    return board.options.some((p) => p.x === x && p.y === y);
  };

  const togglePoint = (point: PathStep) => {
    if (disabled || phase !== 'recall') return;
    if (isPointSelected(point.x, point.y)) {
      setSelectedPoints((prev) => prev.filter((p) => !(p.x === point.x && p.y === point.y)));
    } else {
      setSelectedPoints((prev) => [...prev, point]);
    }
  };

  const handleSubmit = () => {
    if (disabled || selectedPoints.length === 0) return;
    onSubmit(selectedPoints);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedPoints([]);
    onReset?.();
  };

  return (
    <div
      data-testid="memory-position-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      {/* Phase 1: View Phase */}
      {phase === 'view' ? (
        <div
          data-testid="memory-view-phase"
          className="flex flex-col items-center gap-4"
        >
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nhìn kỹ các vị trí phát sáng trên lưới:
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 font-medium">
              Bạn có thể nhìn kỹ bao lâu tùy thích. Khi nào sẵn sàng thì bấm nút bên dưới nhé!
            </p>
          </div>

          {/* Grid showing illuminated target cells */}
          <div
            role="region"
            aria-label="Lưới ghi nhớ vị trí"
            className="mx-auto rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-3 shadow-inner dark:border-indigo-900 dark:bg-zinc-900"
          >
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: board.height }).map((_, y) =>
                Array.from({ length: board.width }).map((_, x) => {
                  const isTargetCell = isTarget(x, y);
                  return (
                    <div
                      key={`${x}-${y}`}
                      data-testid={`view-cell-${x}-${y}`}
                      aria-label={`Ô (${x + 1}, ${y + 1})${isTargetCell ? ', Có ngôi sao cần nhớ' : ''}`}
                      className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 transition ${
                        isTargetCell
                          ? 'border-amber-400 bg-amber-300 text-amber-950 shadow-md ring-2 ring-amber-400 dark:border-amber-500 dark:bg-amber-400 dark:text-slate-900'
                          : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-800'
                      }`}
                    >
                      {isTargetCell && (
                        <span aria-hidden="true" className="text-xl">
                          ⭐
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            data-testid="start-recall-btn"
            disabled={disabled}
            onClick={() => setPhase('recall')}
            className="min-h-[52px] rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400"
          >
            Sẵn sàng nhớ lại
          </button>
        </div>
      ) : (
        /* Phase 2: Recall Phase */
        <div
          data-testid="memory-recall-phase"
          className="flex flex-col items-center gap-4 w-full"
        >
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Chọn lại đúng những vị trí ngôi sao đã xuất hiện:
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Đã chọn: {selectedPoints.length} / {board.targets.length} vị trí
            </p>
          </div>

          {/* Interactive Recall Grid */}
          <div
            role="region"
            aria-label="Lưới chọn lại vị trí"
            className="mx-auto rounded-3xl border-2 border-slate-200 bg-white p-3 shadow-inner dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: board.height }).map((_, y) =>
                Array.from({ length: board.width }).map((_, x) => {
                  const isSel = isPointSelected(x, y);
                  const isRev = isRevealed(x, y);
                  const isOption = isOptionPoint(x, y);

                  return (
                    <button
                      key={`${x}-${y}`}
                      type="button"
                      data-testid={`recall-cell-${x}-${y}`}
                      aria-label={`Ô (${x + 1}, ${y + 1})${isSel ? ', Đã chọn' : ''}`}
                      aria-pressed={isSel}
                      disabled={disabled || isRev}
                      onClick={() => togglePoint({ x, y })}
                      className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        reducedMotion ? '' : 'transform-gpu active:scale-95'
                      } ${
                        isSel
                          ? 'border-indigo-600 bg-indigo-500 text-white shadow-md ring-2 ring-indigo-300'
                          : isOption
                          ? 'border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750'
                          : 'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-850'
                      }`}
                    >
                      {isSel && (
                        <span aria-hidden="true" className="text-xl">
                          ⭐
                        </span>
                      )}
                      {isRev && !isSel && (
                        <span aria-hidden="true" className="text-sm opacity-50">
                          👁️
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Controls: Peek, Reset, Submit */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-testid="peek-memory-btn"
              disabled={disabled}
              onClick={() => setPhase('view')}
              className="min-h-[44px] rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-indigo-300"
            >
              👁️ Xem lại vị trí mẫu
            </button>

            {selectedPoints.length > 0 && (
              <button
                type="button"
                data-testid="clear-selection-btn"
                disabled={disabled}
                onClick={handleClear}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300"
              >
                Chọn lại
              </button>
            )}

            <button
              type="button"
              data-testid="submit-answer-btn"
              disabled={disabled || selectedPoints.length === 0}
              onClick={handleSubmit}
              className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
                selectedPoints.length > 0 && !disabled
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'cursor-not-allowed bg-slate-300 opacity-60 dark:bg-zinc-700'
              }`}
            >
              Kiểm tra đáp án
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
