import { describe, expect, it } from 'vitest';
import { keepInViewportShift, menuEntryIndex, menuKeyAction, nextMenuIndex } from '@/lib/dropdown-menu-navigation';

describe('dropdown menu navigation', () => {
  it('moves down and up and wraps around at both ends', () => {
    expect(nextMenuIndex(0, 3, 'ArrowDown')).toBe(1);
    expect(nextMenuIndex(2, 3, 'ArrowDown')).toBe(0);
    expect(nextMenuIndex(2, 3, 'ArrowUp')).toBe(1);
    expect(nextMenuIndex(0, 3, 'ArrowUp')).toBe(2);
  });

  it('starts from the first item going down and the last going up when nothing is focused', () => {
    expect(nextMenuIndex(-1, 4, 'ArrowDown')).toBe(0);
    expect(nextMenuIndex(-1, 4, 'ArrowUp')).toBe(3);
  });

  it('jumps to the first and last item with Home and End', () => {
    expect(nextMenuIndex(2, 5, 'Home')).toBe(0);
    expect(nextMenuIndex(1, 5, 'End')).toBe(4);
  });

  it('ignores other keys and empty menus', () => {
    expect(nextMenuIndex(0, 3, 'a')).toBeNull();
    expect(nextMenuIndex(0, 0, 'ArrowDown')).toBeNull();
    expect(menuKeyAction('x', 0, 3)).toBeNull();
  });

  it('focuses the chosen item when opening and falls back to the first one', () => {
    expect(menuEntryIndex(2, 5)).toBe(2);
    expect(menuEntryIndex(-1, 5)).toBe(0);
    expect(menuEntryIndex(7, 5)).toBe(0);
    expect(menuEntryIndex(0, 0)).toBe(-1);
  });

  it('closes on Escape without letting the key through, and on Tab while letting focus move on', () => {
    expect(menuKeyAction('Escape', 1, 3)).toEqual({ type: 'close', consume: true });
    expect(menuKeyAction('Tab', 1, 3)).toEqual({ type: 'close', consume: false });
  });

  it('turns an arrow key into a focus move', () => {
    expect(menuKeyAction('ArrowDown', 1, 3)).toEqual({ type: 'focus', index: 2 });
    expect(menuKeyAction('End', 0, 3)).toEqual({ type: 'focus', index: 2 });
  });

  it('shifts a panel back inside the viewport and leaves one that fits', () => {
    expect(keepInViewportShift(-40, 184, 375)).toBe(48);
    expect(keepInViewportShift(200, 424, 375)).toBe(-57);
    expect(keepInViewportShift(20, 244, 375)).toBe(0);
  });
});
