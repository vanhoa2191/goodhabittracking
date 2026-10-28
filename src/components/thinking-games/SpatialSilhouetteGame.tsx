'use client';

import { useState } from 'react';
import type { AgeTrack, SpatialSilhouetteBoard } from '@/lib/thinking-games/types';
import { describeCellGrid, getButtonMinSize, MiniCellGrid } from './game-utils';

export interface SpatialSilhouetteGameProps {
  readonly board: SpatialSilhouetteBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

export function SpatialSilhouetteGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: SpatialSilhouetteGameProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedId(null);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  // Compute bounding box for grids
  const maxX = Math.max(
    ...board.target.map((c) => c.x),
    ...board.options.flatMap((o) => o.cells.map((c) => c.x)),
    3
  );
  const maxY = Math.max(
    ...board.target.map((c) => c.y),
    ...board.options.flatMap((o) => o.cells.map((c) => c.y)),
    3
  );
  const gridWidth = maxX + 1;
  const gridHeight = maxY + 1;

  const handleSelect = (id: string) => {
    if (disabled) return;
    setSelectedId(id);
  };

  const handleSubmit = () => {
    if (disabled || !selectedId) return;
    onSubmit(selectedId);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedId(null);
    onReset?.();
  };

  return (
    <div
      data-testid="spatial-silhouette-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Chọn hình bóng có đúng các ô giống với hình mẫu:
        </p>
      </div>

      {/* Target Silhouette */}
      <div
        role="region"
        aria-label="Hình bóng mẫu cần ghép"
        className="flex flex-col items-center gap-2 rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900 dark:bg-zinc-900"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
          Hình mẫu mục tiêu
        </span>
        <MiniCellGrid
          cells={board.target}
          width={gridWidth}
          height={gridHeight}
          sizeClass="h-7 w-7"
          highlightClass="bg-slate-900 dark:bg-slate-100"
          className="border-2 border-slate-300 dark:border-zinc-700"
        />
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          ({board.target.length} ô tô đậm)
        </span>
      </div>

      {/* Candidate Silhouette Options */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Các hình lựa chọn
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn hình bóng"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {board.options.map((opt, index) => {
            const isSelected = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`option-button-${opt.id}`}
                aria-label={`Lựa chọn ${index + 1}: ${describeCellGrid(opt.cells, gridWidth, gridHeight)}`}
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => handleSelect(opt.id)}
                className={`flex flex-col ${buttonMinSize} items-center justify-center rounded-2xl border-2 p-3 shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  reducedMotion ? '' : 'transform-gpu active:scale-95'
                } ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-950/60 dark:text-white'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <MiniCellGrid
                  cells={opt.cells}
                  width={gridWidth}
                  height={gridHeight}
                  sizeClass="h-4 w-4"
                  highlightClass={
                    isSelected
                      ? 'bg-indigo-600 dark:bg-indigo-400'
                      : 'bg-slate-800 dark:bg-slate-200'
                  }
                />
                <span className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  Hình {String.fromCharCode(65 + index)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {selectedId && (
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
          disabled={disabled || !selectedId}
          onClick={handleSubmit}
          className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
            selectedId && !disabled
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'cursor-not-allowed bg-slate-300 opacity-60 dark:bg-zinc-700'
          }`}
        >
          Kiểm tra đáp án
        </button>
      </div>
    </div>
  );
}
