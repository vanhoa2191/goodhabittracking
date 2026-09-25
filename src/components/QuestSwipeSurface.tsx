'use client';

import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';

type QuestSwipeSurfaceProps = {
  readonly children: ReactNode;
  readonly completeLabel: string;
  readonly deferLabel: string;
  readonly canComplete: boolean;
  readonly canDefer: boolean;
  readonly onComplete: () => void;
  readonly onDefer: () => void;
};

type PointerStart = { readonly x: number; readonly y: number; readonly pointerId: number };
const SWIPE_THRESHOLD = 72;
const MAX_DRAG = 96;

export function QuestSwipeSurface({
  children, completeLabel, deferLabel, canComplete, canDefer, onComplete, onDefer,
}: QuestSwipeSurfaceProps) {
  const start = useRef<PointerStart | null>(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || (!canComplete && !canDefer)) return;
    start.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const origin = start.current;
    if (!origin || origin.pointerId !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) < 8 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setOffset(Math.max(-MAX_DRAG, Math.min(MAX_DRAG, dx)));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const origin = start.current;
    start.current = null;
    setOffset(0);
    if (!origin || origin.pointerId !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    const action = dx > 0 ? (canComplete ? onComplete : null) : (canDefer ? onDefer : null);
    if (!action) return;
    suppressClick.current = true;
    window.setTimeout(() => { suppressClick.current = false; }, 0);
    action();
  };

  return (
    <div
      className="relative min-w-0 overflow-hidden rounded-2xl bg-amber-100 dark:bg-zinc-800 touch-pan-y"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { start.current = null; setOffset(0); }}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
      }}
    >
      {canComplete && <span aria-hidden="true" className="absolute inset-y-0 left-3 flex items-center text-sm font-bold text-emerald-800 dark:text-emerald-300">{completeLabel}</span>}
      {canDefer && <span aria-hidden="true" className="absolute inset-y-0 right-3 flex items-center text-sm font-bold text-amber-900 dark:text-amber-300">{deferLabel}</span>}
      <div
        className={offset === 0 ? 'relative motion-safe:transition-transform motion-safe:duration-200' : 'relative'}
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
      >
        {children}
      </div>
    </div>
  );
}
