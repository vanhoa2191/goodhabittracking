'use client';

import { useState } from 'react';
import type { AgeTrack, PlanningCommandOrderBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface PlanningCommandOrderGameProps {
  readonly board: PlanningCommandOrderBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string[]) => void;
  readonly onReset?: () => void;
}

export function PlanningCommandOrderGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: PlanningCommandOrderGameProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedIds([]);
  }

  const minSize = getButtonMinSize(ageTrack);

  const commandMap = new Map<string, string>();
  for (const cmd of board.commands) {
    commandMap.set(cmd.id, cmd.text);
  }

  const unplacedCommands = board.commands.filter((cmd) => !selectedIds.includes(cmd.id));

  const handleAddCommand = (cmdId: string) => {
    if (disabled) return;
    if (selectedIds.includes(cmdId)) return;
    setSelectedIds([...selectedIds, cmdId]);
  };

  const handleRemoveStep = (indexToRemove: number) => {
    if (disabled) return;
    setSelectedIds(selectedIds.filter((_, idx) => idx !== indexToRemove));
  };

  const handleMoveStep = (currentIndex: number, direction: 'up' | 'down') => {
    if (disabled) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= selectedIds.length) return;
    const next = [...selectedIds];
    const temp = next[currentIndex]!;
    next[currentIndex] = next[targetIndex]!;
    next[targetIndex] = temp;
    setSelectedIds(next);
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedIds([]);
    onReset?.();
  };

  const isComplete = selectedIds.length === board.commands.length;

  const handleSubmit = () => {
    if (disabled || !isComplete) return;
    onSubmit(selectedIds);
  };

  return (
    <div
      data-testid="planning-command-order-game"
      className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2"
    >
      {/* Precedence clues badge */}
      {board.before && board.before.length > 0 && (
        <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <div className="font-semibold mb-1">Gợi ý thứ tự logic:</div>
          <div className="flex flex-wrap gap-2">
            {board.before.map(([bId, aId], idx) => (
              <span
                key={`${bId}-${aId}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/60 rounded-md font-medium"
              >
                <span>{commandMap.get(bId) ?? bId}</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">➔</span>
                <span>{commandMap.get(aId) ?? aId}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sequence slots */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Thứ tự các bước ({selectedIds.length}/{board.commands.length}):
          </h3>
          {selectedIds.length > 0 && !disabled && (
            <button
              type="button"
              data-testid="reset-order-btn"
              onClick={handleReset}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 underline font-medium"
            >
              Làm lại thứ tự
            </button>
          )}
        </div>

        <div className="space-y-2" role="list" aria-label="Danh sách thứ tự các bước">
          {Array.from({ length: board.commands.length }).map((_, stepIdx) => {
            const placedId = selectedIds[stepIdx];
            const placedText = placedId ? commandMap.get(placedId) : null;

            if (placedId && placedText) {
              return (
                <div
                  key={`slot-${stepIdx}-${placedId}`}
                  role="listitem"
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-xl shadow-sm gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                      {stepIdx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base truncate">
                      {placedText}
                    </span>
                  </div>

                  {!disabled && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {stepIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveStep(stepIdx, 'up')}
                          aria-label={`Chuyển bước ${stepIdx + 1} lên trước`}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 text-xs font-bold"
                        >
                          ▲
                        </button>
                      )}
                      {stepIdx < selectedIds.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveStep(stepIdx, 'down')}
                          aria-label={`Chuyển bước ${stepIdx + 1} xuống sau`}
                          className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 text-xs font-bold"
                        >
                          ▼
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(stepIdx)}
                        aria-label={`Gỡ bỏ ${placedText}`}
                        className="px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-medium"
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={`empty-slot-${stepIdx}`}
                role="listitem"
                className="flex items-center p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 text-xs sm:text-sm gap-2"
              >
                <span className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center">
                  {stepIdx + 1}
                </span>
                <span>(Chưa có bước cho vị trí này)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available commands tray */}
      {unplacedCommands.length > 0 && (
        <div className="w-full">
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Chọn bước tiếp theo để thêm vào hàng:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {unplacedCommands.map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                data-testid={`command-tray-btn-${cmd.id}`}
                disabled={disabled}
                onClick={() => handleAddCommand(cmd.id)}
                style={{ minHeight: `${minSize}px` }}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 text-slate-800 dark:text-slate-100 font-medium text-sm transition-all text-left shadow-sm disabled:opacity-50 ${
                  reducedMotion ? '' : 'active:scale-95'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  +
                </span>
                <span className="truncate">{cmd.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit button */}
      <div className="w-full pt-2 flex justify-center">
        <button
          type="button"
          data-testid="submit-answer-btn"
          disabled={disabled || !isComplete}
          onClick={handleSubmit}
          style={{ minHeight: `${minSize}px` }}
          className={`px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all ${
            isComplete && !disabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {isComplete ? 'Xác nhận thứ tự các bước' : `Sắp đủ ${board.commands.length} bước để gửi`}
        </button>
      </div>
    </div>
  );
}
