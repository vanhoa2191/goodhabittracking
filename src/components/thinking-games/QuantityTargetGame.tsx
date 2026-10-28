'use client';

import { useState } from 'react';
import type { AgeTrack, QuantityTargetBoard } from '@/lib/thinking-games/types';
import { quantityTargetSatisfies } from '@/lib/thinking-games';
import { getButtonMinSize } from './game-utils';

export interface QuantityTargetGameProps {
  readonly board: QuantityTargetBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string[]) => void;
  readonly onReset?: () => void;
}

const ITEM_ICONS = ['💎', '🪙', '⭐', '🎈', '🎁', '🍎'];

export function QuantityTargetGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: QuantityTargetGameProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedIds([]);
  }

  const buttonMinSize = getButtonMinSize(ageTrack);

  const isSelected = (id: string) => selectedIds.includes(id);

  const maxSelectable = board.mode === 'exact-two' ? 2 : board.maxItems ? board.maxItems : undefined;

  const toggleItem = (id: string) => {
    if (disabled) return;
    if (isSelected(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      if (maxSelectable !== undefined && selectedIds.length >= maxSelectable) return;
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  // Compute current sum of selected items
  const currentSum = selectedIds.reduce((sum, id) => {
    const item = board.items.find((i) => i.id === id);
    return sum + (item?.value ?? 0);
  }, 0);

  const isSatisfied = quantityTargetSatisfies(board, selectedIds);

  const handleSubmit = () => {
    if (disabled || selectedIds.length === 0) return;
    if (board.mode === 'exact-two' && selectedIds.length !== 2) return;
    onSubmit(selectedIds);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedIds([]);
    onReset?.();
  };

  return (
    <div
      data-testid="quantity-target-game"
      className="flex flex-col items-center gap-5 py-3 text-center"
    >
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {board.mode === 'fewest'
            ? 'Chọn các món đồ sao cho tổng bằng mục tiêu với số món ít nhất:'
            : board.mode === 'exact-two'
            ? 'Chọn đúng 2 món đồ sao cho tổng giá trị bằng mục tiêu:'
            : board.mode === 'not-over'
            ? 'Chọn các món đồ sao cho tổng không vượt quá mục tiêu:'
            : board.maxItems
            ? `Chọn các món đồ sao cho tổng bằng mục tiêu (tối đa ${board.maxItems} món):`
            : 'Chọn các món đồ sao cho tổng giá trị đạt mục tiêu:'}
        </p>
      </div>

      {/* Target & Basket Header */}
      <div
        role="region"
        aria-label="Mục tiêu và giỏ đồ hiện tại"
        className="w-full max-w-md rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-4 shadow-sm dark:border-indigo-900 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-indigo-200/80 pb-2.5 dark:border-zinc-800">
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true" className="text-xl">🎯</span>
            <span className="text-xs font-extrabold uppercase text-indigo-900 dark:text-indigo-300">
              Mục tiêu:
            </span>
          </div>
          <div className="flex items-center gap-2">
            {board.mode === 'fewest' && (
              <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Ít món nhất
              </span>
            )}
            {board.mode === 'exact-two' && (
              <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Đúng 2 món
              </span>
            )}
            {board.maxItems && board.mode !== 'exact-two' && (
              <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                Tối đa {board.maxItems} món
              </span>
            )}
            <span className="font-mono text-xl font-black text-indigo-700 dark:text-indigo-400">
              {board.target}
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Tổng trong giỏ:
          </span>
          <span
            data-testid="current-sum-display"
            className={`font-mono text-base font-black ${
              isSatisfied
                ? 'text-emerald-600 dark:text-emerald-400'
                : currentSum > board.target && board.mode !== 'not-over'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {currentSum} / {board.target}{' '}
            {isSatisfied && '✅ (Thỏa mãn yêu cầu)'}
            {!isSatisfied && currentSum === board.target && board.mode === 'fewest' && '⚠️ (Chưa phải ít món nhất)'}
            {!isSatisfied && currentSum === board.target && board.mode === 'exact-two' && '⚠️ (Cần đúng 2 món)'}
            {!isSatisfied && currentSum === board.target && board.maxItems && selectedIds.length > board.maxItems && `⚠️ (Quá ${board.maxItems} món)`}
          </span>
        </div>
      </div>

      {/* Items Tray */}
      <div className="w-full max-w-md">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Các món đồ có thể chọn ({selectedIds.length} món đang chọn)
        </h3>
        <div
          role="group"
          aria-label="Danh sách món đồ để chọn"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {board.items.map((item, idx) => {
            const isSel = isSelected(item.id);
            const icon = ITEM_ICONS[idx % ITEM_ICONS.length];

            return (
              <button
                key={item.id}
                type="button"
                data-testid={`option-button-${item.id}`}
                aria-pressed={isSel}
                aria-label={`Món ${item.id}: giá trị ${item.value}`}
                disabled={disabled}
                onClick={() => toggleItem(item.id)}
                className={`flex flex-col ${buttonMinSize} items-center justify-center rounded-2xl border-2 p-3 shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  reducedMotion ? '' : 'transform-gpu active:scale-95'
                } ${
                  isSel
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500 dark:border-indigo-400 dark:bg-indigo-950 dark:text-white'
                    : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-zinc-700 dark:bg-zinc-800'
                }`}
              >
                <span aria-hidden="true" className="text-xl">
                  {icon}
                </span>
                <span className="mt-1 font-mono text-base font-black">
                  +{item.value}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isSel ? 'Đã lấy vào giỏ' : 'Bấm để lấy'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {selectedIds.length > 0 && (
          <button
            type="button"
            data-testid="clear-selection-btn"
            disabled={disabled}
            onClick={handleClear}
            className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-300"
          >
            Làm trống giỏ
          </button>
        )}

        <button
          type="button"
          data-testid="submit-answer-btn"
          disabled={disabled || selectedIds.length === 0}
          onClick={handleSubmit}
          className={`min-h-[48px] rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white shadow-md transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400 ${
            selectedIds.length > 0 && !disabled
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
