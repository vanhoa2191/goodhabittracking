export const PARENT_PIN_REQUIRED_EVENT = 'kidhabit:parent-pin-required';

let installed = false;

/**
 * Sensitive parent requests answer 403 with code parent_pin_required when the PIN was not entered
 * in this browser (for example after the unlock expired). Every caller would need the same
 * handling, so the answer is turned into one event the store uses to show the PIN screen.
 */
export function installParentPinSignal(target: Window = window): void {
  if (installed) return;
  installed = true;
  const originalFetch = target.fetch.bind(target);
  target.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    if (response.status === 403) {
      void response.clone().json().then((body: unknown) => {
        if (typeof body === 'object' && body !== null && (body as { code?: unknown }).code === 'parent_pin_required') {
          target.dispatchEvent(new CustomEvent(PARENT_PIN_REQUIRED_EVENT));
        }
      }).catch(() => undefined);
    }
    return response;
  };
}

export function resetParentPinSignalForTests(): void {
  installed = false;
}
