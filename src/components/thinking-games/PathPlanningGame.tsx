'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Flag, Home, RotateCcw, Undo2 } from 'lucide-react';
import type { AgeTrack, PathBoard, PathStep } from '@/lib/thinking-games/types';
import { getButtonMinHeight, getButtonMinSize } from './game-utils';

export interface PathPlanningGameProps {
  readonly board: PathBoard;
  readonly ageTrack: AgeTrack;
  readonly reducedMotion?: boolean;
  readonly disabled?: boolean;
  readonly onSubmit: (answer: readonly PathStep[]) => void;
  readonly onReset?: () => void;
}

function cellKey(step: PathStep): string {
  return `${step.x},${step.y}`;
}

export function PathPlanningGame({
  board,
  ageTrack,
  reducedMotion = false,
  disabled = false,
  onSubmit,
  onReset,
}: PathPlanningGameProps) {
  const [path, setPath] = useState<readonly PathStep[]>([board.start]);
  const [prevBoard, setPrevBoard] = useState(board);

  // Reset path during render when board changes
  if (prevBoard !== board) {
    setPrevBoard(board);
    setPath([board.start]);
  }

  const controlMinSize = getButtonMinSize(ageTrack);

  const wallSet = useMemo(() => new Set(board.walls.map(cellKey)), [board.walls]);
  const waypointSet = useMemo(() => new Set(board.waypoints.map(cellKey)), [board.waypoints]);
  const pathSet = useMemo(() => new Set(path.map(cellKey)), [path]);
  const pathIndexMap = useMemo(
    () => new Map<string, number>(path.map((step, idx) => [cellKey(step), idx + 1])),
    [path]
  );

  const currentHead = path[path.length - 1] ?? board.start;
  const isAtGoal = currentHead.x === board.goal.x && currentHead.y === board.goal.y;

  // Check how many waypoints have been visited
  const visitedWaypointsCount = board.waypoints.filter((wp) => pathSet.has(cellKey(wp))).length;
  const allWaypointsVisited = visitedWaypointsCount === board.waypoints.length;

  const canStepTo = useCallback(
    (next: PathStep): boolean => {
      if (next.x < 0 || next.y < 0 || next.x >= board.width || next.y >= board.height) return false;
      if (wallSet.has(cellKey(next))) return false;
      if (pathSet.has(cellKey(next))) return false;
      const distance = Math.abs(currentHead.x - next.x) + Math.abs(currentHead.y - next.y);
      return distance === 1;
    },
    [board.height, board.width, currentHead.x, currentHead.y, pathSet, wallSet]
  );

  const moveByDirection = useCallback(
    (dx: number, dy: number) => {
      if (disabled) return;
      const nextStep: PathStep = { x: currentHead.x + dx, y: currentHead.y + dy };
      if (canStepTo(nextStep)) {
        setPath((prev) => [...prev, nextStep]);
      }
    },
    [canStepTo, currentHead.x, currentHead.y, disabled]
  );

  const handleCellClick = (x: number, y: number) => {
    if (disabled) return;
    const target: PathStep = { x, y };

    // If clicking the step directly before head, perform Undo
    if (path.length > 1) {
      const prevStep = path[path.length - 2];
      if (prevStep && prevStep.x === x && prevStep.y === y) {
        setPath((prev) => prev.slice(0, -1));
        return;
      }
    }

    // If clicking an adjacent unvisited valid cell, append to path
    if (canStepTo(target)) {
      setPath((prev) => [...prev, target]);
    }
  };

  const handleUndo = useCallback(() => {
    if (disabled) return;
    setPath((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, [disabled]);

  const handleReset = useCallback(() => {
    if (disabled) return;
    setPath([board.start]);
    onReset?.();
  }, [board.start, disabled, onReset]);

  const handleSubmit = () => {
    if (disabled || !isAtGoal) return;
    onSubmit(path);
  };

  // Keyboard navigation
  useEffect(() => {
    if (disabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        moveByDirection(0, -1);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        moveByDirection(0, 1);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        moveByDirection(-1, 0);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        moveByDirection(1, 0);
      } else if (e.code === 'Backspace' || e.code === 'KeyZ') {
        e.preventDefault();
        handleUndo();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleReset, handleUndo, moveByDirection]);

  return (
    <div
      data-testid="path-planning-game"
      className="flex flex-col items-center gap-4 py-3 text-center"
    >
      {/* Question prompt & Status */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {board.shortestPathOnly
            ? 'Tìm đường ngắn nhất (ít bước nhất) từ điểm xuất phát 🏠 đến đích 🎯'
            : 'Tìm đường từ điểm xuất phát 🏠 đến đích 🎯'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {board.shortestPathOnly && (
            <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
              ⚡ Đường ngắn nhất (hiện tại: {Math.max(0, path.length - 1)} bước)
            </span>
          )}
          {board.waypoints.length > 0 && (
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Điểm cần thu thập: {visitedWaypointsCount}/{board.waypoints.length}{' '}
              {allWaypointsVisited ? '✅ (Đã qua đủ!)' : '⭐ (Nhớ đi qua nhé)'}
            </p>
          )}
        </div>
      </div>

      {/* Grid container */}
      <div
        role="region"
        aria-label="Bản đồ mê cung đường đi"
        className="mx-auto w-full max-w-[340px] rounded-3xl border-2 border-slate-200 bg-slate-50 p-2 shadow-inner dark:border-zinc-800 dark:bg-zinc-900 sm:max-w-[380px]"
      >
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: board.height }).map((_, y) =>
            Array.from({ length: board.width }).map((_, x) => {
              const currentStep: PathStep = { x, y };
              const key = cellKey(currentStep);
              const isStart = board.start.x === x && board.start.y === y;
              const isGoal = board.goal.x === x && board.goal.y === y;
              const isWall = wallSet.has(key);
              const isWaypoint = waypointSet.has(key);
              const waypointNumber = board.waypointOrder === 'ordered'
                ? board.waypoints.findIndex((waypoint) => waypoint.x === x && waypoint.y === y) + 1
                : 0;
              const isInPath = pathSet.has(key);
              const stepIndex = pathIndexMap.get(key);
              const isHead = currentHead.x === x && currentHead.y === y;
              const isCandidate = canStepTo(currentStep);

              let cellLabel = `Ô (${x}, ${y})`;
              if (isStart) cellLabel += ', Điểm xuất phát';
              else if (isGoal) cellLabel += ', Đích đến';
              else if (isWall) cellLabel += ', Tường chắn';
              else if (isWaypoint) cellLabel += waypointNumber > 0 ? `, Ngôi sao số ${waypointNumber}` : ', Điểm cần qua';
              if (isInPath) cellLabel += `, Bước ${stepIndex}`;

              return (
                <button
                  key={key}
                  type="button"
                  data-testid={`path-cell-${x}-${y}`}
                  aria-label={cellLabel}
                  disabled={disabled || isWall}
                  onClick={() => handleCellClick(x, y)}
                  className={`relative flex aspect-square items-center justify-center rounded-xl text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    reducedMotion ? '' : 'transition-transform'
                  } ${
                    isWall
                      ? 'cursor-not-allowed bg-slate-700 text-slate-300 dark:bg-zinc-800 dark:text-zinc-500'
                      : isHead
                      ? 'border-2 border-indigo-600 bg-indigo-500 text-white shadow-md ring-2 ring-indigo-300 dark:ring-indigo-600'
                      : isInPath
                      ? 'border border-indigo-300 bg-indigo-100 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200'
                      : isCandidate
                      ? 'border-2 border-dashed border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border border-slate-200 bg-white hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-850 dark:hover:bg-zinc-800'
                  }`}
                >
                  {isStart && !isHead && (
                    <Home className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  )}
                  {isGoal && !isHead && (
                    <Flag className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                  )}
                  {isWall && <span aria-hidden="true">🧱</span>}
                  {isWaypoint && !isHead && (
                    <span aria-hidden="true" className={isInPath ? 'opacity-40' : 'text-base'}>
                      ⭐{waypointNumber > 0 && <span className="text-[10px] font-extrabold">{waypointNumber}</span>}
                    </span>
                  )}
                  {isInPath && !isStart && !isGoal && (
                    <span className="font-extrabold text-[11px]">{stepIndex}</span>
                  )}
                  {isHead && (
                    <span className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" aria-hidden="true" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* On-screen Directional Touch Controls */}
      <div
        role="group"
        aria-label="Phím điều hướng bước đi"
        className="flex flex-col items-center gap-1"
      >
        <button
          type="button"
          data-testid="dir-up"
          aria-label="Bước lên"
          disabled={disabled || !canStepTo({ x: currentHead.x, y: currentHead.y - 1 })}
          onClick={() => moveByDirection(0, -1)}
          className={`flex ${controlMinSize} items-center justify-center rounded-2xl border border-slate-300 bg-white p-2 text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100`}
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="dir-left"
            aria-label="Bước sang trái"
            disabled={disabled || !canStepTo({ x: currentHead.x - 1, y: currentHead.y })}
            onClick={() => moveByDirection(-1, 0)}
            className={`flex ${controlMinSize} items-center justify-center rounded-2xl border border-slate-300 bg-white p-2 text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100`}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            data-testid="dir-down"
            aria-label="Bước xuống"
            disabled={disabled || !canStepTo({ x: currentHead.x, y: currentHead.y + 1 })}
            onClick={() => moveByDirection(0, 1)}
            className={`flex ${controlMinSize} items-center justify-center rounded-2xl border border-slate-300 bg-white p-2 text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100`}
          >
            <ArrowDown className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            data-testid="dir-right"
            aria-label="Bước sang phải"
            disabled={disabled || !canStepTo({ x: currentHead.x + 1, y: currentHead.y })}
            onClick={() => moveByDirection(1, 0)}
            className={`flex ${controlMinSize} items-center justify-center rounded-2xl border border-slate-300 bg-white p-2 text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-100`}
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Control Actions: Undo, Reset, Submit */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          data-testid="undo-path-btn"
          disabled={disabled || path.length <= 1}
          onClick={handleUndo}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          <span>Hoàn tác</span>
        </button>

        <button
          type="button"
          data-testid="reset-path-btn"
          disabled={disabled || path.length <= 1}
          onClick={handleReset}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-200"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Đặt lại</span>
        </button>

        <button
          type="button"
          data-testid="submit-path-btn"
          disabled={disabled || !isAtGoal}
          onClick={handleSubmit}
          className={`flex ${
            getButtonMinHeight(ageTrack)
          } items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-base font-bold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600`}
        >
          Kiểm tra đường đi
        </button>
      </div>
    </div>
  );
}
