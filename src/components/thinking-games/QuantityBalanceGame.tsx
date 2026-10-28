'use client';

import { useState } from 'react';
import type { AgeTrack, QuantityBalanceBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface QuantityBalanceGameProps {
  readonly board: QuantityBalanceBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: number) => void;
  readonly onReset?: () => void;
}

export function QuantityBalanceGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: QuantityBalanceGameProps) {
  const [selectedWeight, setSelectedWeight] = useState<number | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedWeight(null);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  const leftSum = board.left.reduce((sum, item) => sum + item.weight, 0);
  const rightSum = board.right.reduce((sum, item) => sum + item.weight, 0);

  const isReplaceLeft = board.mode === 'replace' && board.left.some((it) => it.id === board.replaceId);
  const isReplaceRight = board.mode === 'replace' && board.right.some((it) => it.id === board.replaceId);

  const effectiveLeftSum = isReplaceLeft && selectedWeight !== null
    ? board.left.reduce((sum, it) => sum + (it.id === board.replaceId ? selectedWeight : it.weight), 0)
    : leftSum;

  const effectiveRightSum = isReplaceRight && selectedWeight !== null
    ? board.right.reduce((sum, it) => sum + (it.id === board.replaceId ? selectedWeight : it.weight), 0)
    : rightSum;

  const handleSelect = (weight: number) => {
    if (disabled) return;
    setSelectedWeight(weight);
  };

  const handleSubmit = () => {
    if (disabled || selectedWeight === null) return;
    onSubmit(selectedWeight);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedWeight(null);
    onReset?.();
  };

  return (
    <div
      data-testid="quantity-balance-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {board.mode === 'replace'
            ? 'Tìm quả cân thay thế quả được đánh dấu để hai đĩa cân thăng bằng:'
            : 'Tìm quả cân phù hợp để hai đĩa cân thăng bằng:'}
        </p>
      </div>

      {/* Two Pan Balance Visual Scale */}
      <div
        role="region"
        aria-label="Cán cân hai đĩa"
        className="w-full max-w-md rounded-3xl border-2 border-amber-200 bg-amber-50/50 p-4 shadow-sm dark:border-amber-900 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-center gap-2 text-2xl font-black text-amber-900 dark:text-amber-200">
          <span>⚖️</span>
          <span className="text-xs uppercase tracking-wider font-bold">Cân hai đĩa</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {/* Left Pan */}
          <div className="flex flex-col items-center rounded-2xl border-2 border-slate-300 bg-white p-3 shadow-xs dark:border-zinc-700 dark:bg-zinc-800">
            <span className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              Đĩa cân Trái
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {board.left.map((item) => {
                const isTarget = board.mode === 'replace' && item.id === board.replaceId;
                if (isTarget) {
                  return (
                    <div
                      key={item.id}
                      data-testid="replace-target-slot-left"
                      className="flex flex-col items-center"
                    >
                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400">
                        Cần thay
                      </span>
                      <span
                        className={`flex h-10 min-w-10 items-center justify-center rounded-xl border-2 px-2 font-mono text-sm font-black shadow-xs ${
                          selectedWeight !== null
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-400 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200'
                            : 'border-dashed border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-200'
                        }`}
                      >
                        {selectedWeight !== null ? `${selectedWeight}` : `${item.weight} 🔄`}
                      </span>
                    </div>
                  );
                }
                return (
                  <span
                    key={item.id}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 font-mono text-sm font-black text-indigo-900 shadow-2xs dark:bg-indigo-950 dark:text-indigo-200"
                  >
                    {item.weight}
                  </span>
                );
              })}
              {board.unknownSide === 'left' && (
                <span
                  data-testid="unknown-slot-left"
                  className="flex h-10 min-w-10 items-center justify-center rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 px-2 font-mono text-sm font-black text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                >
                  {selectedWeight !== null ? selectedWeight : '?'}
                </span>
              )}
            </div>
            <span className="mt-2 text-[11px] font-semibold text-slate-400">
              Tổng hiện có: {leftSum}
              {selectedWeight !== null && effectiveLeftSum !== leftSum && (
                <span className="ml-1 font-bold text-indigo-600 dark:text-indigo-400">→ {effectiveLeftSum}</span>
              )}
            </span>
          </div>

          {/* Right Pan */}
          <div className="flex flex-col items-center rounded-2xl border-2 border-slate-300 bg-white p-3 shadow-xs dark:border-zinc-700 dark:bg-zinc-800">
            <span className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              Đĩa cân Phải
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {board.right.map((item) => {
                const isTarget = board.mode === 'replace' && item.id === board.replaceId;
                if (isTarget) {
                  return (
                    <div
                      key={item.id}
                      data-testid="replace-target-slot-right"
                      className="flex flex-col items-center"
                    >
                      <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400">
                        Cần thay
                      </span>
                      <span
                        className={`flex h-10 min-w-10 items-center justify-center rounded-xl border-2 px-2 font-mono text-sm font-black shadow-xs ${
                          selectedWeight !== null
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-400 dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-200'
                            : 'border-dashed border-amber-500 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-200'
                        }`}
                      >
                        {selectedWeight !== null ? `${selectedWeight}` : `${item.weight} 🔄`}
                      </span>
                    </div>
                  );
                }
                return (
                  <span
                    key={item.id}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 font-mono text-sm font-black text-indigo-900 shadow-2xs dark:bg-indigo-950 dark:text-indigo-200"
                  >
                    {item.weight}
                  </span>
                );
              })}
              {board.unknownSide === 'right' && (
                <span
                  data-testid="unknown-slot-right"
                  className="flex h-10 min-w-10 items-center justify-center rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 px-2 font-mono text-sm font-black text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                >
                  {selectedWeight !== null ? selectedWeight : '?'}
                </span>
              )}
            </div>
            <span className="mt-2 text-[11px] font-semibold text-slate-400">
              Tổng hiện có: {rightSum}
              {selectedWeight !== null && effectiveRightSum !== rightSum && (
                <span className="ml-1 font-bold text-indigo-600 dark:text-indigo-400">→ {effectiveRightSum}</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Options Tray */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Chọn quả cân
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn quả cân"
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {board.options.map((opt) => {
            const isSelected = selectedWeight === opt;
            return (
              <button
                key={opt}
                type="button"
                data-testid={`option-button-${opt}`}
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => handleSelect(opt)}
                className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 px-5 py-2 font-mono text-base font-extrabold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  reducedMotion ? '' : 'transform-gpu active:scale-95'
                } ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-100/90 text-indigo-950 ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-900/60 dark:text-white'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {selectedWeight !== null && (
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
          disabled={disabled || selectedWeight === null}
          onClick={handleSubmit}
          className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
            selectedWeight !== null && !disabled
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
