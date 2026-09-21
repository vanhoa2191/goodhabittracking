'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocus(
  isOpen: boolean,
  onClose: () => void,
  dialogRef?: RefObject<HTMLElement | null>
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef?.current
      ?? Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')).at(-1);
    if (!dialog) return;

    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    const focusInitialControl = () => (focusable()[0] ?? dialog).focus();
    focusInitialControl();
    const focusFrame = window.requestAnimationFrame(focusInitialControl);

    const handleKeyDown = (event: KeyboardEvent) => {
      const topDialog = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
      ).at(-1);
      if (topDialog !== dialog) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (elements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      if (previous?.isConnected) previous.focus();
    };
  }, [dialogRef, isOpen]);
}
