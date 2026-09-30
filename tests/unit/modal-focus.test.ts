import { afterEach, describe, expect, it, vi } from 'vitest';
import { activateModalFocus } from '@/lib/use-modal-focus';

function setup(controlCount = 2) {
  let activeElement: Element | null = null;
  class Control {
    isConnected = true;
    focus() { activeElement = this as unknown as Element; }
  }
  const trigger = new Control();
  const controls = Array.from({ length: controlCount }, () => new Control());
  const dialog = Object.assign(new Control(), {
    querySelectorAll: () => controls,
    contains: (element: unknown) => controls.includes(element as Control),
  });
  let topDialog = dialog;
  const listeners = new Set<(event: KeyboardEvent) => void>();
  const cancelAnimationFrame = vi.fn();
  vi.stubGlobal('HTMLElement', Control);
  vi.stubGlobal('document', {
    get activeElement() { return activeElement; },
    querySelectorAll: () => [topDialog],
    addEventListener: (_: string, handler: (event: KeyboardEvent) => void) => listeners.add(handler),
    removeEventListener: (_: string, handler: (event: KeyboardEvent) => void) => listeners.delete(handler),
  });
  vi.stubGlobal('window', { requestAnimationFrame: () => 1, cancelAnimationFrame });
  trigger.focus();
  const close = vi.fn();
  const cleanup = activateModalFocus(dialog as unknown as HTMLElement, close);
  return {
    controls, trigger, dialog, close, cleanup, listeners, cancelAnimationFrame,
    active: () => activeElement,
    coverDialog: () => { topDialog = Object.assign(new Control(), dialog); },
    key: (key: string, shiftKey = false) => {
      const event = { key, shiftKey, preventDefault: vi.fn() };
      listeners.forEach((listener) => listener(event as unknown as KeyboardEvent));
      return event;
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('modal focus lifecycle', () => {
  it('focuses the first control and traps Tab in both directions', () => {
    const modal = setup();
    expect(modal.active()).toBe(modal.controls[0]);
    expect(modal.key('Tab', true).preventDefault).toHaveBeenCalled();
    expect(modal.active()).toBe(modal.controls[1]);
    expect(modal.key('Tab').preventDefault).toHaveBeenCalled();
    expect(modal.active()).toBe(modal.controls[0]);
    modal.trigger.focus();
    modal.key('Tab');
    expect(modal.active()).toBe(modal.controls[0]);
    modal.cleanup();
  });

  it('closes on Escape and restores trigger focus on cleanup', () => {
    const modal = setup();
    expect(modal.key('Escape').preventDefault).toHaveBeenCalled();
    expect(modal.close).toHaveBeenCalledOnce();
    modal.cleanup();
    expect(modal.active()).toBe(modal.trigger);
    expect(modal.listeners.size).toBe(0);
    expect(modal.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});

it('focuses and traps an empty dialog', () => {
  const modal = setup(0);
  expect(modal.active()).toBe(modal.dialog);
  expect(modal.key('Tab').preventDefault).toHaveBeenCalled();
  expect(modal.active()).toBe(modal.dialog);
  modal.cleanup();
});

it('only handles keys for the top dialog and skips detached triggers', () => {
  const modal = setup();
  modal.coverDialog();
  expect(modal.key('Escape').preventDefault).not.toHaveBeenCalled();
  expect(modal.close).not.toHaveBeenCalled();
  modal.trigger.isConnected = false;
  modal.cleanup();
  expect(modal.active()).toBe(modal.controls[0]);
});
