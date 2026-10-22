'use client';

import { useState } from 'react';
import type { AgeTrack, ReasoningIfThenBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize, renderTokenVisual } from './game-utils';

export interface ReasoningIfThenGameProps {
  readonly board: ReasoningIfThenBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

export function ReasoningIfThenGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: ReasoningIfThenGameProps) {
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
      data-testid="reasoning-if-then-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Dùng các điều đã biết và luật Nếu - Thì để tìm ra kết luận mới:
        </p>
      </div>

      {/* Facts & Rules Box */}
      <div
        role="region"
        aria-label="Các dữ kiện và luật nếu thì"
        className="w-full max-w-md rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900 dark:bg-zinc-900"
      >
        {/* Known Facts */}
        <div className="mb-3 border-b border-indigo-200/80 pb-2.5 dark:border-zinc-800">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
            📌 Điều ta đã biết chắc chắn
          </span>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {board.facts.map((fact, idx) => (
              <span
                key={`${fact}-${idx}`}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 py-1.5 text-xs font-black text-indigo-900 shadow-2xs dark:border-indigo-700 dark:bg-zinc-800 dark:text-indigo-200"
              >
                {renderTokenVisual(fact)}
              </span>
            ))}
          </div>
        </div>

        {/* If-Then Rules */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            ⚡ Luật suy luận
          </span>
          <div className="mt-2 flex flex-col gap-2">
            {board.rules.map((rule, idx) => (
              <div
                key={`${rule.if}-${rule.then}-${idx}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold shadow-2xs dark:bg-zinc-800"
              >
                <span className="text-slate-500">Nếu có</span>
                <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
                  {renderTokenVisual(rule.if)}
                </span>
                <span aria-hidden="true" className="text-indigo-600 font-black">
                  ➔
                </span>
                <span className="text-slate-500">Thì có</span>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                  {renderTokenVisual(rule.then)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Options Tray */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Kết luận suy ra là gì?
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn kết luận"
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
