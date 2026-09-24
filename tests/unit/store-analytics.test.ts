import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppStoreProvider, useAppStore } from '@/lib/store';
import type { ProductEventSink } from '@/lib/product-analytics';

afterEach(() => vi.restoreAllMocks());

function captureCloudLetterRead(analyticsSink?: ProductEventSink, analyticsOptIn = false) {
  let recordRead: (() => void) | undefined;
  function Probe() {
    recordRead = useAppStore().recordCloudDailyLetterRead;
    return null;
  }
  const providerProps = {
    analyticsSink,
    analyticsOptIn,
    children: createElement(Probe),
  };
  renderToStaticMarkup(createElement(AppStoreProvider, providerProps));
  return recordRead;
}

describe('store analytics consent gate', () => {
  it('does not deliver a cloud letter read without explicit opt-in', () => {
    const sink = vi.fn();
    const recordRead = captureCloudLetterRead(sink);

    expect(recordRead).toBeDefined();
    recordRead?.();

    expect(sink).not.toHaveBeenCalled();
  });

  it('does not make a request or deliver a cloud letter read without a destination', () => {
    const request = vi.spyOn(globalThis, 'fetch');
    const recordRead = captureCloudLetterRead(undefined, true);

    expect(recordRead).toBeDefined();
    recordRead?.();

    expect(request).not.toHaveBeenCalled();
  });

  it('does not deliver an event before client hydration, even with opt-in props', () => {
    const sink = vi.fn();
    const recordRead = captureCloudLetterRead(sink, true);

    expect(recordRead).toBeDefined();
    recordRead?.();

    expect(sink).not.toHaveBeenCalled();
  });
});
