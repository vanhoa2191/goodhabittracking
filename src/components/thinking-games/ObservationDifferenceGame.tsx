'use client';

import { useState } from 'react';
import type {
  AgeTrack,
  ObservationDifferenceBoard,
  PathStep,
} from '@/lib/thinking-games/types';
import { TOKEN_ICONS, getButtonMinSize } from './game-utils';

export interface ObservationDifferenceGameProps {
  readonly board: ObservationDifferenceBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: PathStep[]) => void;
  readonly onReset?: () => void;
}

function pointKey(p: PathStep): string {
  return `${p.x},${p.y}`;
}

export function ObservationDifferenceGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: ObservationDifferenceGameProps) {
  const [selectedPoints, setSelectedPoints] = useState<PathStep[]>([]);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedPoints([]);
  }

  const minSize = getButtonMinSize(ageTrack);
  const selectedKeySet = new Set(selectedPoints.map(pointKey));

  const handleTogglePoint = (p: PathStep) => {
    if (disabled) return;
    const key = pointKey(p);
    if (selectedKeySet.has(key)) {
      setSelectedPoints(selectedPoints.filter((pt) => pointKey(pt) !== key));
    } else {
      setSelectedPoints([...selectedPoints, p]);
    }
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedPoints([]);
    onReset?.();
  };

  const handleSubmit = () => {
    if (disabled || selectedPoints.length === 0) return;
    onSubmit(selectedPoints);
  };

  const width = board.left[0]?.length ?? 4;

  return (
    <div
      data-testid="observation-difference-game"
      className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2"
    >
      {/* Instructions */}
      <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-3.5 text-center">
        <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">
          Quan sát tinh mắt:
        </div>
        <div className="text-sm font-bold text-amber-950 dark:text-white mt-0.5">
          Tìm ô khác nhau giữa Hình A và Hình B (chạm vào ô thay đổi ở Hình B):
        </div>
      </div>

      {/* Comparison grids */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left Grid: Picture A */}
        <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
            Hình A (Gốc)
          </div>
          <div
            className="grid gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl"
            style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
          >
            {board.left.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`left-${x}-${y}`}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shadow-xs"
                >
                  {TOKEN_ICONS[cell] ?? cell}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Grid: Picture B (Interactive) */}
        <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-bold text-sky-700 dark:text-sky-300 mb-2 uppercase tracking-wide">
            Hình B (Chạm ô khác biệt)
          </div>
          <div
            className="grid gap-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl"
            style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
          >
            {board.right.map((row, y) =>
              row.map((cell, x) => {
                const key = `${x},${y}`;
                const isSelected = selectedKeySet.has(key);

                return (
                  <button
                    key={`right-${x}-${y}`}
                    type="button"
                    data-testid={`diff-cell-${x}-${y}`}
                    disabled={disabled}
                    onClick={() => handleTogglePoint({ x, y })}
                    aria-label={`Ô (${x + 1}, ${y + 1})`}
                    aria-pressed={isSelected}
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-xl transition-all relative ${
                      reducedMotion ? '' : 'active:scale-95'
                    } ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-950 border-2 border-amber-500 ring-2 ring-amber-400 shadow-md'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    {TOKEN_ICONS[cell] ?? cell}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Selected count and controls */}
      <div className="w-full flex items-center justify-between text-xs sm:text-sm px-2">
        <div className="text-slate-600 dark:text-slate-400 font-medium">
          Đã chọn: <span className="font-bold text-sky-700 dark:text-sky-300">{selectedPoints.length}</span> ô khác nhau
        </div>
        {selectedPoints.length > 0 && !disabled && (
          <button
            type="button"
            data-testid="clear-selection-btn"
            onClick={handleReset}
            className="text-sky-600 hover:text-sky-700 dark:text-sky-400 underline font-medium"
          >
            Bỏ chọn tất cả
          </button>
        )}
      </div>

      {/* Submit button */}
      <div className="w-full pt-2 flex justify-center">
        <button
          type="button"
          data-testid="submit-answer-btn"
          disabled={disabled || selectedPoints.length === 0}
          onClick={handleSubmit}
          style={{ minHeight: `${minSize}px` }}
          className={`px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all ${
            selectedPoints.length > 0 && !disabled
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200 active:scale-95 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {selectedPoints.length > 0
            ? `Xác nhận ${selectedPoints.length} điểm khác nhau`
            : 'Chọn điểm khác biệt'}
        </button>
      </div>
    </div>
  );
}
