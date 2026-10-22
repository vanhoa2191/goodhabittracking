'use client';

import { useState } from 'react';
import type { AgeTrack, FlexibilityClassifyBoard } from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface FlexibilityClassifyGameProps {
  readonly board: FlexibilityClassifyBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string[]) => void;
  readonly onReset?: () => void;
}

const TRAIT_ICONS: Record<string, string> = {
  tròn: '⚪',
  vuông: '⬛',
  sao: '⭐',
  'tam giác': '🔺',
};

const COLOR_CLASSES: Record<string, string> = {
  đỏ: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800',
  xanh: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
  vàng: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
  tím: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800',
};

export function FlexibilityClassifyGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: FlexibilityClassifyGameProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedIds([]);
  }

  const minSize = getButtonMinSize(ageTrack);

  const handleToggle = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedIds([]);
    onReset?.();
  };

  const handleSubmit = () => {
    if (disabled || selectedIds.length === 0) return;
    onSubmit(selectedIds);
  };

  return (
    <div
      data-testid="flexibility-classify-game"
      className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2"
    >
      {/* Rule banner */}
      <div className="w-full bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-center">
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1">
          Quy tắc phân loại mới
        </div>
        <div className="text-base sm:text-lg font-bold text-indigo-950 dark:text-white">
          Tìm mọi hình có{' '}
          <span className="underline decoration-indigo-400 decoration-2">
            {board.rule.trait} là &ldquo;{board.rule.value}&rdquo;
          </span>
        </div>
        <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
          (Bạn có thể chọn nhiều hình thỏa mãn)
        </div>
      </div>

      {/* Items list */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Các hình mẫu ({selectedIds.length} đã chọn):
          </h3>
          {selectedIds.length > 0 && !disabled && (
            <button
              type="button"
              data-testid="clear-selection-btn"
              onClick={handleReset}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 underline font-medium"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {board.items.map((item, idx) => {
            const isSelected = selectedIds.includes(item.id);
            const shape = item.traits['hình'] ?? '';
            const color = item.traits['màu'] ?? '';
            const size = item.traits['kích_cỡ'] ?? '';
            const position = item.traits['vị_trí'] ?? '';
            const shapeIcon = TRAIT_ICONS[shape] ?? '🔷';
            const colorStyle = COLOR_CLASSES[color] ?? 'bg-slate-50 border-slate-200';

            return (
              <button
                key={item.id}
                type="button"
                data-testid={`option-button-${item.id}`}
                disabled={disabled}
                onClick={() => handleToggle(item.id)}
                aria-pressed={isSelected}
                aria-label={`Hình ${idx + 1}: ${shape} màu ${color}, cỡ ${size}, vị trí ${position}`}
                style={{ minHeight: `${minSize}px` }}
                className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-center ${
                  reducedMotion ? '' : 'active:scale-95'
                } ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
                }`}
              >
                {/* Visual token */}
                <div
                  className={`w-14 h-14 rounded-xl border flex items-center justify-center text-3xl mb-2 ${colorStyle}`}
                >
                  {shapeIcon}
                </div>

                {/* Traits text */}
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize">
                  {shape} {color}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {size} • {position}
                </div>

                {/* Checkbox indicator */}
                <div
                  className={`mt-2 w-5 h-5 rounded-md border flex items-center justify-center text-xs font-bold ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
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
          disabled={disabled || selectedIds.length === 0}
          onClick={handleSubmit}
          style={{ minHeight: `${minSize}px` }}
          className={`px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all ${
            selectedIds.length > 0 && !disabled
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 active:scale-95 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {selectedIds.length > 0
            ? `Xác nhận (${selectedIds.length} hình)`
            : 'Chọn các hình phù hợp'}
        </button>
      </div>
    </div>
  );
}
