'use client';

import { useState } from 'react';
import type { AgeTrack, RuleErrorBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize, renderTokenVisual } from './game-utils';

export interface RuleErrorGameProps {
  readonly board: RuleErrorBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: number) => void;
  readonly onReset?: () => void;
}

export function RuleErrorGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: RuleErrorGameProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedIndex(null);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  const handleSelect = (index: number) => {
    if (disabled) return;
    setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (disabled || selectedIndex === null) return;
    onSubmit(selectedIndex);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedIndex(null);
    onReset?.();
  };

  return (
    <div
      data-testid="rule-error-game"
      className="flex flex-col items-center gap-6 py-4 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Tìm một vị trí đang làm vỡ nhịp của chuỗi:
        </p>
      </div>

      {/* Sequence tiles with position markers */}
      <div
        role="region"
        aria-label="Chuỗi cần tìm vị trí sai"
        className="flex max-w-full flex-wrap items-center justify-center gap-3 px-2"
      >
        {board.sequence.map((token, index) => {
          const isSelected = selectedIndex === index;
          return (
            <button
              key={`${token}-${index}`}
              type="button"
              data-testid={`sequence-index-${index}`}
              aria-label={`Vị trí ${index + 1}: ${token}${isSelected ? ', Đang chọn' : ''}`}
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => handleSelect(index)}
              className={`flex flex-col ${buttonMinSize} items-center justify-center rounded-2xl border-2 px-3 py-2 shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                reducedMotion ? '' : 'transform-gpu active:scale-95'
              } ${
                isSelected
                  ? 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-400 dark:border-rose-400 dark:bg-rose-950/60 dark:text-white'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                #{index + 1}
              </span>
              <div className="mt-0.5">{renderTokenVisual(token)}</div>
            </button>
          );
        })}
      </div>

      {/* Selected callout & Actions */}
      <div className="flex flex-col items-center gap-3">
        {selectedIndex !== null ? (
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
            Bạn đang chọn vị trí #{selectedIndex + 1} ({board.sequence[selectedIndex]}) là phần bị sai.
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bấm chọn ô mà bạn nghĩ không đúng quy luật nhé.
          </p>
        )}

        <div className="flex items-center gap-3">
          {selectedIndex !== null && (
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
            disabled={disabled || selectedIndex === null}
            onClick={handleSubmit}
            className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
              selectedIndex !== null && !disabled
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'cursor-not-allowed bg-slate-300 opacity-60 dark:bg-zinc-700'
            }`}
          >
            Kiểm tra đáp án
          </button>
        </div>
      </div>
    </div>
  );
}
