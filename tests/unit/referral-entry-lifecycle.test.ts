import type { FormEvent, ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReferralCodeEntry } from '@/components/ReferralCodeEntry';

const hooks = vi.hoisted(() => ({ index: 0, effects: [] as Array<() => (() => void) | void> }));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return {
    ...react,
    useState: (initial: unknown) => {
      const index = hooks.index++;
      return [index === 0 ? 'eligible' : index === 1 ? 'ABCDEFGH' : initial, vi.fn()];
    },
    useRef: (initial: unknown) => ({ current: initial }),
    useId: () => 'referral-input',
    useEffect: (effect: () => (() => void) | void) => { hooks.effects.push(effect); },
  };
});
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: 'vi' }) }));

afterEach(() => { vi.unstubAllGlobals(); });

describe('referral request ownership', () => {
  it.each([false, true])('only releases the creation gate while its own form is mounted (closed=%s)', async (closed) => {
    hooks.index = 0;
    hooks.effects = [];
    let finish!: (value: Response) => void;
    const response = new Promise<Response>((resolve) => { finish = resolve; });
    vi.stubGlobal('fetch', vi.fn((_url, init?: RequestInit) => init?.method === 'POST'
      ? response : Promise.resolve(new Response(JSON.stringify({ state: 'eligible' })))));
    const onBusyChange = vi.fn();
    const form = ReferralCodeEntry({ onBusyChange }) as ReactElement<{ onSubmit: (event: FormEvent) => Promise<void> }>;
    const cleanup = hooks.effects[0]();
    const submission = form.props.onSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    expect(onBusyChange.mock.calls).toEqual([[true]]);
    if (closed) cleanup?.();
    finish(new Response(JSON.stringify({ status: 'invalid' })));
    await submission;
    expect(onBusyChange.mock.calls).toEqual(closed ? [[true]] : [[true], [false]]);
    if (!closed) cleanup?.();
  });
});
