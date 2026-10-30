'use client';

import { useState } from 'react';
import type { AgeTrack, RuleSequenceBoard } from '@/lib/thinking-games/types';
import { getButtonMinHeight, getButtonMinSize } from './game-utils';

export interface RuleSequenceGameProps {
  readonly board: RuleSequenceBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

const TOKEN_ICONS: Record<string, string> = {
  'lá': '🍃',
  'hoa': '🌸',
  'quả': '🍎',
  'nắng': '☀️',
  'mây': '☁️',
  'sao': '⭐',
};

export function RuleSequenceGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: RuleSequenceGameProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  // Reset local selection during render when board changes
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

  const renderTokenVisual = (token: string) => {
    const icon = TOKEN_ICONS[token];
    return (
      <span className="flex items-center justify-center gap-1.5 font-bold">
        {icon && <span aria-hidden="true" className="text-xl">{icon}</span>}
        <span className="text-base sm:text-lg">{token}</span>
      </span>
    );
  };

  return (
    <div
      data-testid="rule-sequence-game"
      className="flex flex-col items-center gap-6 py-4 text-center"
    >
      {/* Question prompt */}
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Hình hoặc số nào sẽ là phần tiếp theo trong chuỗi?
        </p>
      </div>

      {/* Sequence row */}
      <div
        role="region"
        aria-label="Chuỗi hình mẫu"
        className="flex max-w-full flex-wrap items-center justify-center gap-2.5 px-2"
      >
        {board.sequence.map((token, index) => (
          <div
            key={`${token}-${index}`}
            data-testid={`sequence-item-${index}`}
            className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-3.5 py-2 shadow-sm transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100 ${
              reducedMotion ? '' : 'transform-gpu'
            }`}
          >
            {renderTokenVisual(token)}
          </div>
        ))}

        {/* Target missing slot */}
        <div
          data-testid="target-slot"
          className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 border-dashed border-indigo-500 bg-indigo-50/70 px-3.5 py-2 text-indigo-900 shadow-inner transition dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-200 ${
            selectedOption ? 'font-bold ring-2 ring-indigo-400 dark:ring-indigo-500' : ''
          }`}
        >
          <span className="sr-only">Ô trống cần điền</span>
          {selectedOption ? (
            renderTokenVisual(selectedOption)
          ) : (
            <span aria-hidden="true" className="text-xl font-black text-indigo-500 dark:text-indigo-400">
              ?
            </span>
          )}
        </div>
      </div>

      {/* Options choices */}
      <div className="w-full max-w-md">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Chọn phần tiếp theo
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn đáp án"
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
                className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 px-4 py-2.5 text-slate-900 shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-100/90 text-indigo-950 ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-900/60 dark:text-white'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600'
                }`}
              >
                {renderTokenVisual(option)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action controls */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          data-testid="submit-answer-btn"
          disabled={disabled || !selectedOption}
          onClick={handleSubmit}
          className={`flex ${
            getButtonMinHeight(ageTrack)
          } items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600`}
        >
          Kiểm tra đáp án
        </button>

        {selectedOption && (
          <button
            type="button"
            data-testid="reset-answer-btn"
            disabled={disabled}
            onClick={handleClear}
            className="min-h-[44px] text-xs font-semibold text-slate-500 underline transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Chọn lại
          </button>
        )}
      </div>
    </div>
  );
}
