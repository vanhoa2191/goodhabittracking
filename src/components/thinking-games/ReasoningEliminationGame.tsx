'use client';

import { useState } from 'react';
import type { AgeTrack, ReasoningEliminationBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface ReasoningEliminationGameProps {
  readonly board: ReasoningEliminationBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

const CANDIDATE_AVATARS = ['🦊', '🐰', '🐻', '🐱', '🐼', '🐨'];

export function ReasoningEliminationGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: ReasoningEliminationGameProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [eliminatedSet, setEliminatedSet] = useState<Set<string>>(new Set());
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedCandidate(null);
    setEliminatedSet(new Set());
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  const handleSelect = (id: string) => {
    if (disabled) return;
    setSelectedCandidate(id);
  };

  const handleToggleEliminate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (disabled) return;
    setEliminatedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (disabled || !selectedCandidate) return;
    onSubmit(selectedCandidate);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedCandidate(null);
    setEliminatedSet(new Set());
    onReset?.();
  };

  return (
    <div
      data-testid="reasoning-elimination-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Đọc kỹ các manh mối để loại trừ và tìm ra bạn đúng nhất:
        </p>
      </div>

      {/* Clues Box */}
      <div
        role="region"
        aria-label="Các manh mối điều tra"
        className="w-full max-w-md rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900 dark:bg-zinc-900"
      >
        <span className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
          <span>🔍</span> Manh mối đã biết
        </span>
        <div className="mt-2.5 flex flex-wrap justify-center gap-2">
          {board.clues.map((clue, idx) => (
            <div
              key={`${clue.trait}-${clue.value}-${idx}`}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-2xs ${
                clue.negate
                  ? 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
              }`}
            >
              <span>{clue.negate ? '❌ Không phải' : '✅ Có đặc điểm:'}</span>
              <strong className="underline decoration-current underline-offset-2">
                {clue.trait}: {clue.value}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Cards */}
      <div className="w-full max-w-lg">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Các bạn ứng viên
        </h3>
        <div
          role="group"
          aria-label="Danh sách các ứng viên"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {board.candidates.map((cand, idx) => {
            const isSelected = selectedCandidate === cand.id;
            const isEliminated = eliminatedSet.has(cand.id);
            const avatar = CANDIDATE_AVATARS[idx % CANDIDATE_AVATARS.length];

            return (
              <div
                key={cand.id}
                className={`relative flex flex-col items-center justify-between rounded-2xl border-2 p-2.5 shadow-sm transition ${
                  isEliminated
                    ? 'border-slate-300 bg-slate-100 opacity-60 dark:border-zinc-800 dark:bg-zinc-850'
                    : isSelected
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-950 dark:text-white'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                {/* Main selection button */}
                <button
                  type="button"
                  data-testid={`option-button-${cand.id}`}
                  aria-pressed={isSelected}
                  aria-label={`Ứng viên ${idx + 1}: ${Object.entries(cand.traits)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(', ')}`}
                  disabled={disabled}
                  onClick={() => handleSelect(cand.id)}
                  style={{ minHeight: `${buttonMinSize}px` }}
                  className={`w-full flex flex-col items-center text-center p-1 rounded-xl transition ${
                    reducedMotion ? '' : 'transform-gpu active:scale-95'
                  } ${isEliminated ? 'line-through' : ''}`}
                >
                  <span aria-hidden="true" className="text-2xl">
                    {avatar}
                  </span>
                  <span className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Bạn #{idx + 1}
                  </span>

                  {/* Traits list */}
                  <div className="mt-2 flex w-full flex-col gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {Object.entries(cand.traits).map(([trait, val]) => (
                      <span
                        key={trait}
                        className="rounded bg-slate-100 px-1 py-0.5 font-medium dark:bg-zinc-700"
                      >
                        {trait}: <strong>{val}</strong>
                      </span>
                    ))}
                  </div>
                </button>

                {/* Quick Eliminate Toggle */}
                <button
                  type="button"
                  data-testid={`eliminate-btn-${cand.id}`}
                  title={isEliminated ? 'Bỏ gạch' : 'Gạch bớt'}
                  disabled={disabled}
                  onClick={(e) => handleToggleEliminate(e, cand.id)}
                  className="mt-2 w-full py-1 text-[11px] rounded-lg border border-dashed border-slate-300 dark:border-zinc-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
                >
                  {isEliminated ? '↩️ Bỏ gạch' : '❌ Gạch bớt'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {selectedCandidate && (
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
          disabled={disabled || !selectedCandidate}
          onClick={handleSubmit}
          className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
            selectedCandidate && !disabled
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
