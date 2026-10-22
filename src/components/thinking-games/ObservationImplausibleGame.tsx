'use client';

import { useState } from 'react';
import type {
  AgeTrack,
  ObservationImplausibleBoard,
} from '@/lib/thinking-games/types';
import { getButtonMinSize } from './game-utils';

export interface ObservationImplausibleGameProps {
  readonly board: ObservationImplausibleBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: string) => void;
  readonly onReset?: () => void;
}

const SCENE_ICONS = ['🎪', '🎨', '🎠', '🎒', '🧩', '🎈'];

export function ObservationImplausibleGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: ObservationImplausibleGameProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prevBoard, setPrevBoard] = useState(board);

  if (prevBoard !== board) {
    setPrevBoard(board);
    setSelectedId(null);
  }

  const minSize = getButtonMinSize(ageTrack);

  const handleSelect = (id: string) => {
    if (disabled) return;
    setSelectedId(id);
  };

  const handleReset = () => {
    if (disabled) return;
    setSelectedId(null);
    onReset?.();
  };

  const handleSubmit = () => {
    if (disabled || !selectedId) return;
    onSubmit(selectedId);
  };

  return (
    <div
      data-testid="observation-implausible-game"
      className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto py-2"
    >
      {/* Rule guide */}
      <div className="w-full bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-center">
        <div className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1">
          Tìm điểm vô lý / chi tiết sai quy tắc
        </div>
        <div className="text-sm sm:text-base font-bold text-rose-950 dark:text-white">
          Quy tắc chuẩn:{' '}
          <span className="underline decoration-rose-400 decoration-2">
            {board.rule.trait} phải là &ldquo;{board.rule.value}&rdquo;
          </span>
        </div>
        <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">
          Hãy tìm xem bạn nhỏ hoặc chi tiết nào không tuân theo quy tắc trên nhé!
        </div>
      </div>

      {/* Scene elements list */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Các tình huống trong cảnh:
          </h3>
          {selectedId && !disabled && (
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

        <div className="space-y-2.5">
          {board.scene.map((entry, idx) => {
            const isSelected = selectedId === entry.id;
            const icon = SCENE_ICONS[idx % SCENE_ICONS.length];

            return (
              <button
                key={entry.id}
                type="button"
                data-testid={`option-button-${entry.id}`}
                disabled={disabled}
                onClick={() => handleSelect(entry.id)}
                aria-pressed={isSelected}
                style={{ minHeight: `${minSize}px` }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all ${
                  reducedMotion ? '' : 'active:scale-95'
                } ${
                  isSelected
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 ring-2 ring-rose-500 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-rose-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      Tình huống {idx + 1}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                      {entry.text}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries(entry.traits).map(([trait, val]) => (
                        <span
                          key={trait}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                        >
                          {trait}: <strong>{val}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ml-2 ${
                    isSelected
                      ? 'border-rose-600 bg-rose-600 text-white'
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
          disabled={disabled || !selectedId}
          onClick={handleSubmit}
          style={{ minHeight: `${minSize}px` }}
          className={`px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-sm transition-all ${
            selectedId && !disabled
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 active:scale-95 cursor-pointer'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
          }`}
        >
          {selectedId ? 'Chọn điểm vô lý này' : 'Chọn một chi tiết sai quy tắc'}
        </button>
      </div>
    </div>
  );
}
