'use client';

import { useState } from 'react';
import type { AgeTrack, MemoryChangeBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize, renderTokenVisual } from './game-utils';

export interface MemoryChangeGameProps {
  readonly board: MemoryChangeBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

const CHANGE_TITLES: Record<string, string> = {
  removed: 'Chi tiết nào đã biến mất?',
  added: 'Chi tiết nào mới xuất hiện thêm?',
  swapped: 'Chi tiết nào đã bị đổi vị trí?',
  property: 'Chi tiết nào đã bị thay đổi?',
};

export function MemoryChangeGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: MemoryChangeGameProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedOption(null);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  const handleSelect = (option: string) => {
    if (disabled) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (disabled || !selectedOption) return;
    onSubmit(selectedOption);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedOption(null);
    onReset?.();
  };

  const questionTitle = CHANGE_TITLES[board.change] ?? 'Tìm điểm thay đổi giữa hai cảnh:';

  return (
    <div
      data-testid="memory-change-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {questionTitle}
        </p>
      </div>

      {/* Before and After Scene Comparison Panels */}
      <div
        role="region"
        aria-label="So sánh cảnh ban đầu và cảnh sau đó"
        className="grid w-full max-w-lg grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {/* Before Scene */}
        <div className="flex flex-col items-center rounded-3xl border-2 border-slate-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Cảnh ban đầu
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {board.before.map((token, idx) => (
              <div
                key={`${token}-${idx}`}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-slate-100 px-2.5 py-1.5 shadow-2xs dark:bg-zinc-800"
              >
                {renderTokenVisual(token)}
              </div>
            ))}
          </div>
        </div>

        {/* After Scene */}
        <div className="flex flex-col items-center rounded-3xl border-2 border-indigo-200 bg-indigo-50/40 p-3 shadow-xs dark:border-indigo-900 dark:bg-zinc-900">
          <span className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            2. Cảnh sau đó
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {board.after.map((token, idx) => (
              <div
                key={`${token}-${idx}`}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white px-2.5 py-1.5 shadow-2xs dark:bg-zinc-800"
              >
                {renderTokenVisual(token)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Options Tray */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Chọn chi tiết đã thay đổi
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn thay đổi"
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {board.options.map((option) => {
            const isSelected = selectedOption === option;
            return (
              <button
                key={option}
                type="button"
                data-testid={`option-button-${option}`}
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => handleSelect(option)}
                className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 px-4 py-2 shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 ${
                  reducedMotion ? '' : 'transform-gpu active:scale-95'
                } ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-100/90 text-indigo-950 ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-900/60 dark:text-white'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                {renderTokenVisual(option)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {selectedOption && (
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
          disabled={disabled || !selectedOption}
          onClick={handleSubmit}
          className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
            selectedOption && !disabled
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
