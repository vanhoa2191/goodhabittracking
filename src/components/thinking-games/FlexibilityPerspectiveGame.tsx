'use client';

import { useState } from 'react';
import type {
  AgeTrack,
  FlexibilityPerspectiveBoard,
  RelativeDirection,
} from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface FlexibilityPerspectiveGameProps {
  readonly board: FlexibilityPerspectiveBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: RelativeDirection) => void;
  readonly onReset?: () => void;
}

const FACING_ICONS: Record<string, string> = {
  north: '▲',
  east: '▶',
  south: '▼',
  west: '◀',
};

const FACING_NAMES: Record<string, string> = {
  north: 'hướng lên trên',
  east: 'hướng sang phải',
  south: 'hướng xuống dưới',
  west: 'hướng sang trái',
};

const DIRECTION_LABELS: Record<RelativeDirection, { label: string; icon: string; desc: string }> = {
  ahead: { label: 'Phía trước', icon: '⬆️', desc: 'Ngay đằng trước mặt' },
  behind: { label: 'Phía sau', icon: '⬇️', desc: 'Ngay sau lưng' },
  left: { label: 'Bên tay trái', icon: '⬅️', desc: 'Phía tay trái của bạn' },
  right: { label: 'Bên tay phải', icon: '➡️', desc: 'Phía tay phải của bạn' },
};

export function FlexibilityPerspectiveGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: FlexibilityPerspectiveGameProps) {
  const [selectedDirection, setSelectedDirection] = useState<RelativeDirection | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedDirection(null);
  }

  const minSize = getButtonMinSize(ageTrack);

  const handleSelect = (dir: RelativeDirection) => {
    if (disabled) return;
    setSelectedDirection(dir);
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedDirection(null);
    onReset?.();
  };

  const handleSubmit = () => {
    if (disabled || !selectedDirection) return;
    onSubmit(selectedDirection);
  };

  return (
    <div
      data-testid="flexibility-perspective-game"
      className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2"
    >
      {/* Helper guide */}
      <div className="w-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl p-3.5 text-center">
        <div className="text-xs font-semibold text-sky-800 dark:text-sky-300">
          Hãy đứng vào góc nhìn của bạn nhỏ 🧒 (đang nhìn {FACING_NAMES[board.viewer.facing]}):
        </div>
        <div className="text-sm font-bold text-sky-950 dark:text-white mt-0.5">
          Ngôi sao ⭐ đang nằm ở phía nào của bạn nhỏ?
        </div>
      </div>

      {/* Spatial Grid */}
      <div className="w-full flex flex-col items-center">
        <div
          className="grid gap-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: board.height }).map((_, y) =>
            Array.from({ length: board.width }).map((_, x) => {
              const isViewer = board.viewer.x === x && board.viewer.y === y;
              const isTarget = board.target.x === x && board.target.y === y;

              return (
                <div
                  key={`cell-${x}-${y}`}
                  className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex flex-col items-center justify-center font-bold text-lg transition-colors ${
                    isViewer
                      ? 'bg-blue-500 text-white shadow-lg ring-4 ring-blue-200 dark:ring-blue-900'
                      : isTarget
                      ? 'bg-amber-400 text-amber-950 shadow-lg ring-4 ring-amber-200 dark:ring-amber-900'
                      : 'bg-white dark:bg-slate-700/60 text-slate-700 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {isViewer ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xl">🧒</span>
                      <span className="text-[10px] font-black -mt-1">
                        {FACING_ICONS[board.viewer.facing]}
                      </span>
                    </div>
                  ) : isTarget ? (
                    <span className="text-2xl">⭐</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Direction options */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Chọn hướng theo góc nhìn của bạn nhỏ:
          </h3>
          {selectedDirection && !disabled && (
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

        <div className="grid grid-cols-2 gap-3">
          {board.options.map((dir) => {
            const isSelected = selectedDirection === dir;
            const info = DIRECTION_LABELS[dir];

            return (
              <button
                key={dir}
                type="button"
                data-testid={`option-button-${dir}`}
                disabled={disabled}
                onClick={() => handleSelect(dir)}
                aria-pressed={isSelected}
                style={{ minHeight: `${minSize}px` }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                  reducedMotion ? '' : 'active:scale-95'
                } ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-950 dark:text-white ring-2 ring-sky-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-300 text-slate-800 dark:text-slate-100'
                }`}
              >
                <span className="text-2xl flex-shrink-0">{info.icon}</span>
                <div>
                  <div className="font-bold text-sm sm:text-base">{info.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {info.desc}
                  </div>
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
          disabled={disabled || !selectedDirection}
          onClick={handleSubmit}
          style={{ minHeight: `${minSize}px` }}
          className={`px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all ${
            selectedDirection && !disabled
              ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200 active:scale-95 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {selectedDirection ? 'Xác nhận góc nhìn' : 'Chọn hướng theo góc nhìn'}
        </button>
      </div>
    </div>
  );
}
