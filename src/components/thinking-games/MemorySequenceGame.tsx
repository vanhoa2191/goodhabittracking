'use client';

import { useState } from 'react';
import { Eye, RotateCcw, Undo2 } from 'lucide-react';
import type { AgeTrack, MemorySequenceBoard } from '@/lib/thinking-games/types';
import { memorySequenceAnswerLength, memorySequenceSlots } from '@/lib/thinking-games';

export interface MemorySequenceGameProps {
  readonly board: MemorySequenceBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: readonly string[]) => void;
  readonly onReset?: () => void;
}

const MEMORY_TOKEN_ICONS: Record<string, string> = {
  'táo': '🍎',
  'mèo': '🐱',
  'trăng': '🌙',
  'thuyền': '⛵',
  'cây': '🌳',
  'cá': '🐟',
  'mưa': '🌧️',
  'bóng': '⚽',
};

export type MemoryPhase = 'view' | 'hide' | 'recall';

export function MemorySequenceGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: MemorySequenceGameProps) {
  const [phase, setPhase] = useState<MemoryPhase>('view');
  const [userSequence, setUserSequence] = useState<readonly string[]>([]);
  const [prevBoard, setPrevBoard] = useState(board);

  // Reset phase and user sequence during render when board changes
  if (prevBoard !== board) {
    setPrevBoard(board);
    setPhase('view');
    setUserSequence([]);
  }

  const isAge68 = ageTrack === 'age_6_8';
  const buttonMinSize = isAge68 ? 'min-h-[56px] min-w-[56px]' : 'min-h-[48px] min-w-[48px]';
  const slots = memorySequenceSlots(board);
  const requiredLength = memorySequenceAnswerLength(board);

  const handleStartRecall = () => {
    if (disabled) return;
    if (reducedMotion) {
      setPhase('recall');
    } else {
      setPhase('hide');
      setTimeout(() => setPhase('recall'), 250);
    }
  };

  const handleSelectOption = (token: string) => {
    if (disabled || phase !== 'recall') return;
    if (userSequence.length >= requiredLength) return;
    setUserSequence((prev) => [...prev, token]);
  };

  const handleUndo = () => {
    if (disabled || userSequence.length === 0) return;
    setUserSequence((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    if (disabled) return;
    setUserSequence([]);
    onReset?.();
  };

  const handleViewAgain = () => {
    if (disabled) return;
    setPhase('view');
  };

  const handleSubmit = () => {
    if (disabled || userSequence.length !== requiredLength) return;
    onSubmit(userSequence);
  };

  const renderTokenVisual = (token: string) => {
    const icon = MEMORY_TOKEN_ICONS[token];
    return (
      <span className="flex items-center justify-center gap-1.5 font-bold">
        {icon && <span aria-hidden="true" className="text-xl">{icon}</span>}
        <span className="text-base sm:text-lg">{token}</span>
      </span>
    );
  };

  return (
    <div
      data-testid="memory-sequence-game"
      className="flex flex-col items-center gap-5 py-4 text-center"
    >
      {/* ===================== VIEW PHASE ===================== */}
      {phase === 'view' && (
        <div className="flex flex-col items-center gap-5" data-testid="memory-view-phase">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Hãy quan sát và ghi nhớ thứ tự các hình bên dưới nhé!
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Bạn có thể nhìn kỹ bao lâu tùy thích, không bị tính giờ.
            </p>
          </div>

          {/* Sequence Display */}
          <div
            role="region"
            aria-label="Chuỗi hình cần ghi nhớ"
            className="flex max-w-full flex-wrap items-center justify-center gap-2.5 px-2"
          >
            {board.sequence.map((token, index) => (
              <div
                key={`${token}-${index}`}
                data-testid={`memory-item-${index}`}
                className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 border-indigo-200 bg-white px-3.5 py-2 shadow-sm transition dark:border-indigo-800 dark:bg-zinc-800 dark:text-slate-100 ${
                  reducedMotion ? '' : 'transform-gpu'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {index + 1}
                  </span>
                  {renderTokenVisual(token)}
                </div>
              </div>
            ))}
          </div>

          {/* Proceed to Recall Button */}
          <button
            type="button"
            data-testid="start-recall-btn"
            disabled={disabled}
            onClick={handleStartRecall}
            className={`flex ${
              isAge68 ? 'min-h-[56px]' : 'min-h-[48px]'
            } items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:opacity-50`}
          >
            Mình đã nhớ rồi! Bắt đầu xếp lại
          </button>
        </div>
      )}

      {/* ===================== HIDE PHASE ===================== */}
      {phase === 'hide' && (
        <div className="flex min-h-[160px] flex-col items-center justify-center p-4">
          <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
            Chuẩn bị nhớ lại nhé...
          </p>
        </div>
      )}

      {/* ===================== RECALL PHASE ===================== */}
      {phase === 'recall' && (
        <div className="flex w-full flex-col items-center gap-5" data-testid="memory-recall-phase">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {board.mode === 'missing'
                ? `Chọn từ còn thiếu ở vị trí ${(board.missingIndex ?? 0) + 1} trong dãy:`
                : board.mode === 'swapped'
                ? `Chọn 2 từ ở vị trí ${(board.swappedIndices?.[0] ?? 0) + 1} và ${(board.swappedIndices?.[1] ?? 1) + 1} bị đổi thứ tự:`
                : 'Hãy xếp lại chuỗi theo đúng thứ tự bạn vừa nhớ:'}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Đã chọn {userSequence.length}/{requiredLength} hình
            </p>
          </div>

          {/* User's Input Sequence Slots */}
          <div
            role="region"
            aria-label="Các ô thứ tự đã chọn"
            className="flex max-w-full flex-wrap items-center justify-center gap-2.5 px-2"
          >
            {slots.map((posIndex, index) => {
              const token = userSequence[index];
              const isFilled = Boolean(token);
              return (
                <button
                  key={posIndex}
                  type="button"
                  data-testid={`recall-slot-${index}`}
                  aria-label={
                    isFilled
                      ? `Vị trí ${posIndex + 1}: ${token}. Nhấn để xóa.`
                      : `Vị trí ${posIndex + 1}: chưa chọn`
                  }
                  disabled={disabled || !isFilled}
                  onClick={() => {
                    // Click on filled slot to undo up to this slot
                    if (isFilled && !disabled) {
                      setUserSequence((prev) => prev.slice(0, index));
                    }
                  }}
                  className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 px-3.5 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isFilled
                      ? 'border-indigo-500 bg-white text-slate-900 shadow-sm hover:border-rose-400 dark:border-indigo-400 dark:bg-zinc-800 dark:text-slate-100'
                      : 'border-dashed border-slate-300 bg-slate-50 text-slate-400 dark:border-zinc-700 dark:bg-zinc-900/60'
                  }`}
                >
                  {isFilled ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        Vị trí {posIndex + 1}
                      </span>
                      {renderTokenVisual(token)}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      Ô {posIndex + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Choice Tokens */}
          <div className="w-full max-w-md">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Nhấn hình để xếp vào ô tiếp theo
            </h3>
            <div
              role="group"
              aria-label="Các hình để chọn"
              className="flex flex-wrap items-center justify-center gap-2.5"
            >
              {board.options.map((option, optIdx) => (
                <button
                  key={`${option}-${optIdx}`}
                  type="button"
                  data-testid={`memory-option-${option}`}
                  disabled={disabled || userSequence.length >= requiredLength}
                  onClick={() => handleSelectOption(option)}
                  className={`flex ${buttonMinSize} items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm transition hover:border-indigo-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100 dark:hover:border-zinc-600`}
                >
                  {renderTokenVisual(option)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions: Undo, Reset, Peek, Submit */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              data-testid="undo-memory-btn"
              disabled={disabled || userSequence.length === 0}
              onClick={handleUndo}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
              <span>Xóa hình vừa chọn</span>
            </button>

            <button
              type="button"
              data-testid="reset-memory-btn"
              disabled={disabled || userSequence.length === 0}
              onClick={handleReset}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Đặt lại</span>
            </button>

            <button
              type="button"
              data-testid="peek-memory-btn"
              disabled={disabled}
              onClick={handleViewAgain}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-800 dark:bg-zinc-800 dark:text-amber-300"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span>Xem lại chuỗi</span>
            </button>

            <button
              type="button"
              data-testid="submit-memory-btn"
              disabled={disabled || userSequence.length !== requiredLength}
              onClick={handleSubmit}
              className={`flex ${
                isAge68 ? 'min-h-[56px]' : 'min-h-[48px]'
              } items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600`}
            >
              Kiểm tra đáp án
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
