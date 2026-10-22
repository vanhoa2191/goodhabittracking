'use client';

import { useState } from 'react';
import type { AgeTrack, RuleTransformBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface RuleTransformGameProps {
  readonly board: RuleTransformBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

export function RuleTransformGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: RuleTransformGameProps) {
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

  return (
    <div
      data-testid="rule-transform-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Quan sát máy biến đổi hoạt động và tìm kết quả cho số mới:
        </p>
      </div>

      {/* Transform Machine Visual Container */}
      <div
        role="region"
        aria-label="Máy biến đổi và các ví dụ"
        className="w-full max-w-md rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900 dark:bg-zinc-900"
      >
        <div className="mb-2 flex items-center justify-between border-b border-indigo-200/80 pb-2 dark:border-zinc-800">
          <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
            <span>⚙️</span> Máy biến đổi
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Quy luật đã cho
          </span>
        </div>

        {/* Examples List */}
        <div className="flex flex-col gap-2 py-1">
          {board.examples.map((ex, idx) => (
            <div
              key={`${ex.input}-${idx}`}
              className="flex items-center justify-center gap-3 rounded-xl bg-white px-3 py-1.5 shadow-xs dark:bg-zinc-800"
            >
              <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">
                {ex.input}
              </span>
              <span aria-hidden="true" className="text-xs text-indigo-500 font-black">
                ➔
              </span>
              <span className="font-mono text-sm font-bold text-indigo-700 dark:text-indigo-400">
                {ex.output}
              </span>
            </div>
          ))}
        </div>

        {/* Query Row */}
        <div className="mt-3 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-indigo-400 bg-white p-2.5 shadow-sm dark:bg-zinc-850">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Đầu vào</span>
            <span className="font-mono text-base font-extrabold text-slate-900 dark:text-slate-100">
              {board.query}
            </span>
          </div>

          <span aria-hidden="true" className="text-base font-black text-indigo-600">
            ➔
          </span>

          <div
            data-testid="target-slot"
            className="flex min-h-[44px] min-w-[72px] flex-col items-center justify-center rounded-xl bg-indigo-100/70 px-3 py-1 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-200"
          >
            <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300">
              Đầu ra
            </span>
            <span className="font-mono text-base font-black">
              {selectedOption ?? '?'}
            </span>
          </div>
        </div>
      </div>

      {/* Options Tray */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Chọn kết quả đúng
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn đáp án biến đổi"
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
                className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 px-5 py-2 font-mono text-base font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 ${
                  reducedMotion ? '' : 'transform-gpu active:scale-95'
                } ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-100/90 text-indigo-950 ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-900/60 dark:text-white'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                {option}
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
