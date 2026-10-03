export type MenuKeyAction =
  | { readonly type: 'focus'; readonly index: number }
  | { readonly type: 'close'; readonly consume: boolean };

export function menuEntryIndex(selectedIndex: number, count: number): number {
  if (count <= 0) return -1;
  return selectedIndex >= 0 && selectedIndex < count ? selectedIndex : 0;
}

export function nextMenuIndex(current: number, count: number, key: string): number | null {
  if (count <= 0) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown') return current < 0 ? 0 : (current + 1) % count;
  if (key === 'ArrowUp') return current < 0 ? count - 1 : (current - 1 + count) % count;
  return null;
}

/** Escape is consumed; Tab is left to the browser so focus moves on from the menu button. */
export function menuKeyAction(key: string, current: number, count: number): MenuKeyAction | null {
  if (key === 'Escape') return { type: 'close', consume: true };
  if (key === 'Tab') return { type: 'close', consume: false };
  const index = nextMenuIndex(current, count, key);
  return index === null ? null : { type: 'focus', index };
}

/** Horizontal shift that keeps a panel with the given edges inside the viewport, with a margin on both sides. */
export function keepInViewportShift(left: number, right: number, viewportWidth: number, margin = 8): number {
  if (left < margin) return margin - left;
  if (right > viewportWidth - margin) return viewportWidth - margin - right;
  return 0;
}
