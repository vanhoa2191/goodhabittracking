'use client';

import { useState } from 'react';
import type { AgeTrack, PathStep, SpatialSymmetryBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize, renderTokenVisual } from './game-utils';

export interface SpatialSymmetryGameProps {
  readonly board: SpatialSymmetryBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: PathStep) => void;
  readonly onReset?: () => void;
}

export function SpatialSymmetryGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: SpatialSymmetryGameProps) {
  const [selectedPoint, setSelectedPoint] = useState<PathStep | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedPoint(null);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  const numCols = board.grid[0]?.length ?? 4;

  const isOptionPoint = (x: number, y: number) => {
    return board.options.some((p) => p.x === x && p.y === y);
  };

  const isSelected = (x: number, y: number) => {
    return selectedPoint?.x === x && selectedPoint?.y === y;
  };

  const handleSelectPoint = (pt: PathStep) => {
    if (disabled) return;
    setSelectedPoint(pt);
  };

  const handleSubmit = () => {
    if (disabled || !selectedPoint) return;
    onSubmit(selectedPoint);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedPoint(null);
    onReset?.();
  };

  return (
    <div
      data-testid="spatial-symmetry-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {board.mode === 'fill'
            ? 'Tìm ô còn thiếu để bức tranh đối xứng hoàn hảo:'
            : 'Tìm ô đang phá vỡ trục đối xứng của hình:'}
        </p>
      </div>

      {/* Grid with prominent symmetry axis */}
      <div
        role="region"
        aria-label="Lưới hình đối xứng"
        className="relative mx-auto rounded-3xl border-2 border-slate-200 bg-white p-3 shadow-inner dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div
          className="relative grid gap-2"
          style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
        >
          {board.grid.map((row, y) =>
            row.map((cell, x) => {
              const isCand = isOptionPoint(x, y);
              const isSel = isSelected(x, y);

              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  data-testid={`symmetry-cell-${x}-${y}`}
                  aria-label={`Ô hàng ${y + 1} cột ${x + 1}: ${cell ?? 'Ô trống'}${
                    isCand ? ' (Có thể chọn)' : ''
                  }${isSel ? ' (Đang chọn)' : ''}`}
                  disabled={disabled || !isCand}
                  onClick={() => handleSelectPoint({ x, y })}
                  className={`relative flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 transition ${
                    reducedMotion ? '' : 'transform-gpu active:scale-95'
                  } ${
                    isSel
                      ? 'border-indigo-600 bg-indigo-100 ring-4 ring-indigo-400 dark:border-indigo-400 dark:bg-indigo-950 dark:ring-indigo-600'
                      : isCand
                      ? 'cursor-pointer border-dashed border-amber-400 bg-amber-50/70 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40'
                      : 'cursor-default border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800'
                  }`}
                >
                  {cell ? (
                    renderTokenVisual(cell)
                  ) : (
                    <span
                      aria-hidden="true"
                      className="text-lg font-black text-amber-600 dark:text-amber-400"
                    >
                      ?
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Visual Axis Indicator */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute ${
            board.axis === 'vertical'
              ? 'inset-y-2 left-1/2 -translate-x-1/2 border-r-2 border-dashed border-indigo-500/70 dark:border-indigo-400/70'
              : 'inset-x-2 top-1/2 -translate-y-1/2 border-b-2 border-dashed border-indigo-500/70 dark:border-indigo-400/70'
          }`}
        />
      </div>

      {/* Axis description badge */}
      <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-zinc-800 dark:text-slate-300">
        <span aria-hidden="true">🪞</span>
        <span>
          Trục đối xứng{' '}
          <strong>{board.axis === 'vertical' ? 'dọc (thẳng đứng)' : 'ngang'}</strong>
        </span>
      </div>

      {/* Alternative Option Buttons below grid for easy access */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Các ô gợi ý lựa chọn
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn vị trí"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {board.options.map((pt, idx) => {
            const isSel = isSelected(pt.x, pt.y);
            return (
              <button
                key={`${pt.x}-${pt.y}`}
                type="button"
                data-testid={`option-button-${pt.x}-${pt.y}`}
                aria-pressed={isSel}
                disabled={disabled}
                onClick={() => handleSelectPoint(pt)}
                className={`min-h-[44px] rounded-xl border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isSel
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200'
                }`}
              >
                Vị trí {idx + 1} (Cột {pt.x + 1}, Hàng {pt.y + 1})
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {selectedPoint && (
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
          disabled={disabled || !selectedPoint}
          onClick={handleSubmit}
          className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
            selectedPoint && !disabled
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
