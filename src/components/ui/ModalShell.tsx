'use client';

import React, { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useModalFocus } from '@/lib/use-modal-focus';

const MAX_WIDTH_CLASSES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
} as const;

type ModalWidth = keyof typeof MAX_WIDTH_CLASSES;

interface ModalShellProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly isOpen: boolean;
  readonly label: string;
  readonly maxWidth?: ModalWidth;
  readonly mobileSheet?: boolean;
  readonly onClose: () => void;
}

let bodyLockCount = 0;
let originalBodyOverflow = '';

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;

  return () => {
    bodyLockCount = Math.max(0, bodyLockCount - 1);
    if (bodyLockCount === 0) document.body.style.overflow = originalBodyOverflow;
  };
}

export function ModalShell({
  children,
  className = '',
  isOpen,
  label,
  maxWidth = 'md',
  mobileSheet = true,
  onClose,
}: ModalShellProps) {
  const isMounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen || !isMounted) return;
    return lockBodyScroll();
  }, [isMounted, isOpen]);

  useModalFocus(isOpen && isMounted, onClose, dialogRef);

  if (!isOpen || !isMounted) return null;

  const mobilePosition = mobileSheet
    ? 'place-items-end p-0 sm:place-items-center sm:p-4'
    : 'place-items-center p-3 sm:p-4';
  const mobileCorners = mobileSheet ? 'rounded-t-3xl sm:rounded-3xl' : 'rounded-3xl';

  return createPortal(
    <div
      className={`fixed inset-0 z-50 grid min-h-dvh overflow-hidden bg-slate-950/55 backdrop-blur-sm ${mobilePosition}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100dvh-env(safe-area-inset-top))] w-full flex-col overflow-hidden border border-slate-100 bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-h-[90dvh] ${MAX_WIDTH_CLASSES[maxWidth]} ${mobileCorners} ${className}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>,
    document.body
  );
}
