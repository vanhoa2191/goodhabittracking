'use client';

import { useState } from 'react';
import type { AgeTrack, QuantityGroupingBoard } from '@/lib/thinking-games/types';
import { displayQuantityGroupingOptions } from '@/lib/thinking-games/display-order';
import { getButtonMinSize } from './game-utils';

export interface QuantityGroupingGameProps {
  readonly board: QuantityGroupingBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: number) => void;
  readonly onReset?: () => void;
}

const MODE_QUESTIONS: Record<string, (total: number, size: number) => string> = {
  exact: (total, size) => `Chia đều ${total} đồ vật thành các nhóm, mỗi nhóm có ${size} đồ vật. Hỏi chia được mấy nhóm?`,
  remainder: (total, size) => `Xếp ${total} đồ vật vào các nhóm ${size} đồ vật. Hỏi còn dư lại bao nhiêu đồ vật?`,
  floor: (total, size) => `Có ${total} đồ vật, gom được tối đa bao nhiêu nhóm đủ ${size} đồ vật?`,
  needed: (total, size) => `Đang có ${total} đồ vật, cần thêm mấy đồ vật nữa để xếp đủ thành các nhóm ${size} đồ vật?`,
};

export function QuantityGroupingGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: QuantityGroupingGameProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedNumber(null);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);
  const displayedOptions = displayQuantityGroupingOptions(board);

  const question = MODE_QUESTIONS[board.mode]?.(board.total, board.groupSize) ??
    `Có ${board.total} đồ vật, chia nhóm ${board.groupSize} đồ vật:`;

  const handleSelect = (num: number) => {
    if (disabled) return;
    setSelectedNumber(num);
  };

  const handleSubmit = () => {
    if (disabled || selectedNumber === null) return;
    onSubmit(selectedNumber);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedNumber(null);
    onReset?.();
  };

  return (
    <div
      data-testid="quantity-grouping-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {question}
        </p>
      </div>

      {/* Visual Item Array Grouped into Baskets */}
      <div
        role="region"
        aria-label="Hình minh họa chia nhóm đồ vật"
        className="w-full max-w-md rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900 dark:bg-zinc-900"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
          {board.total} quả táo chia theo từng nhóm {board.groupSize} quả
        </span>

        {/* Visual Dots / Apples */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: Math.ceil(board.total / board.groupSize) }).map((_, groupIdx) => {
            const startIdx = groupIdx * board.groupSize;
            const itemsInThisGroup = Math.min(board.groupSize, board.total - startIdx);

            return (
              <div
                key={groupIdx}
                className="flex items-center gap-1 rounded-2xl border border-dashed border-indigo-300 bg-white p-2 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800"
              >
                {Array.from({ length: itemsInThisGroup }).map((_, i) => (
                  <span key={i} aria-hidden="true" className="text-lg">
                    🍎
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Options Tray */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Chọn số lượng đúng
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn số lượng"
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {displayedOptions.map((opt) => {
            const isSelected = selectedNumber === opt;
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
        {selectedNumber !== null && (
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
          disabled={disabled || selectedNumber === null}
          onClick={handleSubmit}
          className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
            selectedNumber !== null && !disabled
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
