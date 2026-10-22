'use client';

import { useState } from 'react';
import type { AgeTrack, ReasoningMissingInfoBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface ReasoningMissingInfoGameProps {
  readonly board: ReasoningMissingInfoBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

const CANDIDATE_ICONS = ['⭐', '🌟', '✨', '💫'];

export function ReasoningMissingInfoGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: ReasoningMissingInfoGameProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedOptionId(null);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  const handleSelect = (id: string) => {
    if (disabled) return;
    setSelectedOptionId(id);
  };

  const handleSubmit = () => {
    if (disabled || !selectedOptionId) return;
    onSubmit(selectedOptionId);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedOptionId(null);
    onReset?.();
  };

  return (
    <div
      data-testid="reasoning-missing-info-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Chọn dữ kiện còn thiếu để biết chắc chắn bạn cần tìm:
        </p>
        {board.scenario && (
          <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-400 font-medium">
            {board.scenario}
          </p>
        )}
      </div>

      {/* Candidates Box with known traits */}
      <div
        role="region"
        aria-label="Các bạn ứng viên và thông tin đã biết"
        className="w-full max-w-lg rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900 dark:bg-zinc-900"
      >
        <div className="mb-2 flex items-center justify-between border-b border-indigo-200/80 pb-2 dark:border-zinc-800">
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
            Thông tin đã biết:
          </span>
          <div className="flex gap-2">
            {board.known.map((k, idx) => (
              <span
                key={`${k.trait}-${idx}`}
                className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
              >
                {k.trait}: {k.value}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {board.candidates.map((cand, idx) => {
            const isTarget = cand.id === board.targetId;
            return (
              <div
                key={cand.id}
                className={`flex flex-col items-center rounded-2xl border p-2.5 shadow-2xs ${
                  isTarget
                    ? 'border-indigo-400 bg-white ring-2 ring-indigo-300 dark:border-indigo-700 dark:bg-zinc-800'
                    : 'border-slate-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-850'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span aria-hidden="true">{CANDIDATE_ICONS[idx % CANDIDATE_ICONS.length]}</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {cand.id}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {Object.entries(cand.traits).map(([t, val]) => (
                    <span
                      key={t}
                      className={t === board.questionTrait ? 'font-bold text-amber-700 dark:text-amber-400' : ''}
                    >
                      {t}: {val}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Options Tray: Missing Facts */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Dữ kiện cần thêm
        </h3>
        <div
          role="group"
          aria-label="Các lựa chọn dữ kiện còn thiếu"
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {board.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                data-testid={`option-button-${opt.id}`}
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => handleSelect(opt.id)}
                className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 px-4 py-2.5 text-xs font-bold shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 ${
                  reducedMotion ? '' : 'transform-gpu active:scale-95'
                } ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-100/90 text-indigo-950 ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-900/60 dark:text-white'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <span>{opt.trait}: </span>
                <strong className="ml-1 text-sm underline decoration-current underline-offset-2">
                  {opt.value}
                </strong>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {selectedOptionId && (
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
          disabled={disabled || !selectedOptionId}
          onClick={handleSubmit}
          className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
            selectedOptionId && !disabled
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
