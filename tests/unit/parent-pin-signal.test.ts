import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installParentPinSignal, PARENT_PIN_REQUIRED_EVENT, resetParentPinSignalForTests } from '@/lib/security/parent-pin-signal';

function fakeWindow(response: Response) {
  const listeners: Array<() => void> = [];
  const target = {
    fetch: vi.fn(async () => response),
    dispatchEvent: vi.fn((event: Event) => {
      if (event.type === PARENT_PIN_REQUIRED_EVENT) listeners.forEach((listener) => listener());
      return true;
    }),
  };
  return { target: target as unknown as Window, listeners, dispatchEvent: target.dispatchEvent };
}

describe('parent PIN required signal', () => {
  beforeEach(() => resetParentPinSignalForTests());

  it('raises the event when a request is refused for lack of the PIN', async () => {
    const { target, dispatchEvent } = fakeWindow(new Response(JSON.stringify({ code: 'parent_pin_required' }), { status: 403 }));
    installParentPinSignal(target);
    const response = await target.fetch('/api/family', { method: 'DELETE' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(response.status).toBe(403);
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });

  it.each([
    [new Response(JSON.stringify({ error: 'Family owner authentication required.' }), { status: 403 })],
    [new Response('not json', { status: 403 })],
    [new Response(JSON.stringify({ ok: true }), { status: 200 })],
  ])('stays quiet for other answers', async (answer) => {
    const { target, dispatchEvent } = fakeWindow(answer);
    installParentPinSignal(target);
    await target.fetch('/api/x');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it('leaves the response readable by the caller', async () => {
    const { target } = fakeWindow(new Response(JSON.stringify({ code: 'parent_pin_required' }), { status: 403 }));
    installParentPinSignal(target);
    const response = await target.fetch('/api/x');
    await expect(response.json()).resolves.toEqual({ code: 'parent_pin_required' });
  });
});
