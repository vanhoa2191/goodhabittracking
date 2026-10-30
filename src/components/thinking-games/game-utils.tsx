'use client';

import React from 'react';
import type { AgeTrack, PathStep } from '@/lib/thinking-games/types';

export const TOKEN_ICONS: Record<string, string> = {
  'lá': '🍃',
  'hoa': '🌸',
  'quả': '🍎',
  'nắng': '☀️',
  'mây': '☁️',
  'sao': '⭐',
  'cá': '🐟',
  'thuyền': '⛵',
  'mưa': '🌧️',
  'cầu vồng': '🌈',
  'ô': '☂️',
  'tròn': '🔴',
  'vuông': '🟦',
  'tam giác': '🔺',
  'đỏ': '🔴',
  'xanh': '🟦',
  'vàng': '🟨',
  'tím': '🟪',
  'to': '🐘',
  'nhỏ': '🐭',
  'trên': '⬆️',
  'dưới': '⬇️',
  'đồ chơi': '🧸',
  'đồ ăn': '🥪',
  'đi đúng hướng': '🚶',
  'đi sai hướng': '🚷',
};

export function getButtonMinSize(ageTrack: AgeTrack): string {
  if (ageTrack === 'age_3_5') return 'min-h-[64px] min-w-[64px]';
  if (ageTrack === 'age_6_8') return 'min-h-[56px] min-w-[56px]';
  return 'min-h-[48px] min-w-[48px]';
}

export function getButtonMinHeight(ageTrack: AgeTrack): string {
  if (ageTrack === 'age_3_5') return 'min-h-[64px]';
  if (ageTrack === 'age_6_8') return 'min-h-[56px]';
  return 'min-h-[48px]';
}

export function renderTokenVisual(token: string | number): React.ReactNode {
  const strToken = String(token);
  const icon = TOKEN_ICONS[strToken];
  return (
    <span className="inline-flex items-center justify-center gap-1.5 font-bold">
      {icon && <span aria-hidden="true" className="text-xl">{icon}</span>}
      <span className="text-sm sm:text-base">{strToken}</span>
    </span>
  );
}

export function describeCellGrid(cells: readonly PathStep[], width: number, height: number): string {
  const positions = [...cells].sort((a, b) => a.y - b.y || a.x - b.x)
    .map(({ x, y }) => `hàng ${y + 1} cột ${x + 1}`).join('; ');
  return `Lưới ${height} hàng, ${width} cột, tính từ góc trên bên trái. Ô tô đậm: ${positions || 'không có'}.`;
}

export function MiniCellGrid({
  cells,
  width = 4,
  height = 4,
  sizeClass = 'h-5 w-5',
  highlightClass = 'bg-indigo-600 dark:bg-indigo-400',
  emptyClass = 'bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700',
  className = '',
}: {
  cells: readonly PathStep[];
  width?: number;
  height?: number;
  sizeClass?: string;
  highlightClass?: string;
  emptyClass?: string;
  className?: string;
}) {
  const cellSet = new Set(cells.map((c) => `${c.x},${c.y}`));
  return (
    <div
      className={`grid gap-1 rounded-xl border border-slate-200 bg-white p-1.5 dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
      role="img"
      aria-label={describeCellGrid(cells, width, height)}
    >
      {Array.from({ length: height }).map((_, y) =>
        Array.from({ length: width }).map((_, x) => {
          const isFilled = cellSet.has(`${x},${y}`);
          return (
            <div
              key={`${x}-${y}`}
              className={`rounded ${sizeClass} transition-colors ${
                isFilled ? highlightClass : emptyClass
              }`}
            />
          );
        })
      )}
    </div>
  );
}
