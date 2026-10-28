'use client';

import { useState } from 'react';
import type { AgeTrack, Direction, PlanningFixStepBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface PlanningFixStepGameProps {
  readonly board: PlanningFixStepBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

const DIRECTION_LABELS: Record<Direction, string> = {
  up: 'Đi lên',
  down: 'Đi xuống',
  left: 'Sang trái',
  right: 'Sang phải',
};

const DIRECTION_ICONS: Record<Direction, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

export function PlanningFixStepGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: PlanningFixStepGameProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedOptionId(null);
  }

  const minSize = getButtonMinSize(ageTrack);

  const handleSelect = (id: string) => {
    if (disabled) return;
    setSelectedOptionId(id);
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedOptionId(null);
    onReset?.();
  };

  const handleSubmit = () => {
    if (disabled || !selectedOptionId) return;
    onSubmit(selectedOptionId);
  };

  // Preview commands with the selected fix applied
  const activeOption = board.options.find((opt) => opt.id === selectedOptionId);
  const effectiveCommands = [...board.commands];
  if (activeOption) {
    effectiveCommands[activeOption.index] = activeOption.command;
  }

  return (
    <div
      data-testid="planning-fix-step-game"
      className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2"
    >
      {/* Grid view of the maze */}
      <div className="w-full flex flex-col items-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Bản đồ di chuyển ({board.width}×{board.height})
        </h3>
        <div
          className="grid gap-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: board.height }).map((_, y) =>
            Array.from({ length: board.width }).map((_, x) => {
              const isStart = board.start.x === x && board.start.y === y;
              const isGoal = board.goal.x === x && board.goal.y === y;
              const isWall = board.walls.some((w) => w.x === x && w.y === y);

              return (
                <div
                  key={`cell-${x}-${y}`}
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center font-bold text-base transition-colors ${
                    isStart
                      ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
                      : isGoal
                      ? 'bg-amber-400 text-amber-950 shadow-md ring-2 ring-amber-200'
                      : isWall
                      ? 'bg-slate-700 dark:bg-slate-900 text-slate-400'
                      : 'bg-white dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/40'
                  }`}
                >
                  {isStart ? '🤖' : isGoal ? '⭐' : isWall ? '🧱' : ''}
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
          <span className="inline-flex items-center gap-1">🤖 Xuất phát</span>
          <span className="inline-flex items-center gap-1">⭐ Đích đến</span>
          {board.walls.length > 0 && <span className="inline-flex items-center gap-1">🧱 Vật cản</span>}
        </div>
      </div>

      {/* Program commands display */}
      <div className="w-full">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Các lệnh hiện tại trong chương trình:
        </h3>
        <div className="flex flex-wrap gap-2">
          {board.commands.map((cmd, idx) => {
            const isReplaced = activeOption && activeOption.index === idx;
            const displayCmd = isReplaced ? activeOption.command : cmd;

            return (
              <div
                key={`cmd-step-${idx}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                  isReplaced
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 ring-2 ring-emerald-400'
                    : 'border-slate-200 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                  {idx + 1}
                </span>
                <span className="text-base">{DIRECTION_ICONS[displayCmd]}</span>
                <span>{DIRECTION_LABELS[displayCmd]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fix options */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Chọn một bước sửa để robot đến đích:
          </h3>
          {selectedOptionId && !disabled && (
            <button
              type="button"
              data-testid="clear-selection-btn"
              onClick={handleReset}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 underline font-medium"
            >
              Chọn lại
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {board.options.map((option) => {
            const isSelected = selectedOptionId === option.id;

            return (
              <button
                key={option.id}
                type="button"
                data-testid={`option-button-${option.id}`}
                disabled={disabled}
                onClick={() => handleSelect(option.id)}
                aria-pressed={isSelected}
                style={{ minHeight: `${minSize}px` }}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all ${
                  reducedMotion ? '' : 'active:scale-95'
                } ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                    {DIRECTION_ICONS[option.command]}
                  </span>
                  <div>
                    <div className="font-bold text-sm">
                      Đổi bước {option.index + 1}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Thành &quot;{DIRECTION_LABELS[option.command]}&quot;
                    </div>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 text-transparent'
                  }`}
                >
                  ✓
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button */}
      <div className="w-full pt-2 flex justify-center">
        <button
          type="button"
          data-testid="submit-answer-btn"
          disabled={disabled || !selectedOptionId}
          onClick={handleSubmit}
          style={{ minHeight: `${minSize}px` }}
          className={`px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all ${
            selectedOptionId && !disabled
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {selectedOptionId ? 'Thử cách sửa này' : 'Chọn một cách sửa'}
        </button>
      </div>
    </div>
  );
}
