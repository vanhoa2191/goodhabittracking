import { isValidElement } from 'react';
import type { FormEvent, ReactElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutCustomerProfileStep } from '@/components/CheckoutCustomerProfileStep';
import { CustomerProfileForm } from '@/components/CustomerProfileForm';
import { getCustomerProfilePromptCopy } from '@/lib/i18n/customer-profile-prompt-copy';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import type { Language } from '@/types';

const hooks = vi.hoisted(() => ({
  index: 0, refIndex: 0, effectIndex: 0, states: [] as unknown[], refs: [] as Array<{ current: unknown }>,
  effects: [] as Array<() => (() => void) | void>,
  effectDependencies: [] as Array<readonly unknown[] | undefined>,
}));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => {
      const index = hooks.index++;
      if (!(index in hooks.states)) hooks.states[index] = typeof initial === 'function' ? initial() : initial;
      return [hooks.states[index], (value: unknown) => { hooks.states[index] = typeof value === 'function' ? value(hooks.states[index]) : value; }];
    },
    useRef: (initial: unknown) => {
      const index = hooks.refIndex++;
      return hooks.refs[index] ??= { current: initial };
    },
    useId: () => 'customer',
    useEffect: (effect: () => (() => void) | void, dependencies?: readonly unknown[]) => {
      const index = hooks.effectIndex++;
      const previous = hooks.effectDependencies[index];
      if (!dependencies || !previous || dependencies.length !== previous.length || dependencies.some((value, i) => !Object.is(value, previous[i]))) hooks.effects.push(effect);
      hooks.effectDependencies[index] = dependencies;
    },
  };
});
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: 'vi' }) }));

const profile = { display_name: 'Nguyễn An', email: 'parent@example.test', phone: '0912345678', marketing_consent: false };
const event = { preventDefault: vi.fn() } as unknown as FormEvent;
type ElementProps = { children?: ReactNode; role?: string; type?: string; id?: string; disabled?: boolean; checked?: boolean; value?: string; onClick?: () => void; onChange?: (event: { target: { value: string; checked: boolean } }) => void; onSubmit?: (event: FormEvent) => Promise<void> };

function elements(node: ReactNode): Array<ReactElement<ElementProps>> {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<ElementProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function render<T>(component: () => T): T {
  hooks.index = 0;
  hooks.refIndex = 0;
  hooks.effectIndex = 0;
  hooks.effects = [];
  return component();
}
const response = (stored = profile) => new Response(JSON.stringify({ profile: stored }));
beforeEach(() => { hooks.states = []; hooks.refs = []; hooks.effectDependencies = []; });
afterEach(() => { vi.unstubAllGlobals(); });

describe('checkout customer profile step', () => {
  it.each([{ ...profile, display_name: ' ' }, { ...profile, phone: '' }, { ...profile, phone: '123' }])('shows the form for incomplete details: %j', async (stored) => {
    vi.stubGlobal('fetch', vi.fn(async () => response(stored)));
    const onComplete = vi.fn();
    const initial = render(() => CheckoutCustomerProfileStep({ onComplete }));
    expect(initial.type).toBe('p');
    hooks.effects[0]();
    await vi.waitFor(() => expect(hooks.states[0]).toEqual(stored));
    const loaded = render(() => CheckoutCustomerProfileStep({ onComplete }));
    expect(loaded.type).toBe(CustomerProfileForm);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('skips a complete profile without rendering the form during loading', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response()));
    const onComplete = vi.fn();
    expect(render(() => CheckoutCustomerProfileStep({ onComplete })).type).toBe('p');
    hooks.effects[0]();
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(hooks.states[0]).toBeNull();
  });

  it('blocks on load failure and retries the server read', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(response());
    vi.stubGlobal('fetch', fetcher);
    const onComplete = vi.fn();
    render(() => CheckoutCustomerProfileStep({ onComplete }));
    const cleanup = hooks.effects[0]();
    await vi.waitFor(() => expect(hooks.states[1]).toMatchObject({ code: 'network_error' }));
    expect(onComplete).not.toHaveBeenCalled();
    const failed = elements(render(() => CheckoutCustomerProfileStep({ onComplete })));
    expect(failed.find((el) => el.props.role === 'alert')?.props.children).toContain(getCustomerProfilePromptCopy('vi').errors.network_error);
    failed.find((el) => el.type === 'button')?.props.onClick?.();
    cleanup?.();
    expect(render(() => CheckoutCustomerProfileStep({ onComplete })).type).toBe('p');
    expect(hooks.effects).toHaveLength(1);
    hooks.effects[0]();
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledOnce());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('ignores a profile response after checkout is closed', async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; })));
    const onComplete = vi.fn();
    render(() => CheckoutCustomerProfileStep({ onComplete }));
    const cleanup = hooks.effects[0]();
    cleanup?.();
    finish(response());
    await new Promise((resolve) => setImmediate(resolve));
    expect(onComplete).not.toHaveBeenCalled();
    expect(hooks.states[0]).toBeNull();
  });
});

describe('customer profile form', () => {
  it('defaults marketing off, locks saving, and retains inputs for retry after a failure', async () => {
    let finish!: (value: Response) => void;
    const fetcher = vi.fn().mockImplementationOnce(() => new Promise<Response>((resolve) => { finish = resolve; })).mockResolvedValueOnce(response());
    vi.stubGlobal('fetch', fetcher);
    const onSaved = vi.fn();
    const view = () => render(() => CustomerProfileForm({ profile: { ...profile, marketing_consent: true }, onSaved }));
    const form = view();
    hooks.effects[0]();
    expect(elements(form).find((el) => el.props.type === 'checkbox')?.props.checked).toBe(false);
    const pending = form.props.onSubmit(event);
    expect(elements(view()).find((el) => el.type === 'button')?.props.disabled).toBe(true);
    finish(new Response(JSON.stringify({ correlationId: 'support-id' }), { status: 503 }));
    await pending;
    const failed = view();
    expect(elements(failed).find((el) => el.props.id === 'customer-phone')?.props.value).toBe(profile.phone);
    expect(elements(failed).find((el) => el.props.role === 'alert')?.props.children).toContain('support-id');
    expect(elements(failed).find((el) => el.type === 'button')?.props.disabled).toBe(false);
    await failed.props.onSubmit(event);
    expect(onSaved).toHaveBeenCalledWith(profile);
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ displayName: profile.display_name, phone: profile.phone, marketingConsent: false });
  });
});

describe('checkout and onboarding copy', () => {
  const languages: Language[] = ['vi', 'en', 'fr', 'de', 'it', 'es', 'zh', 'ja', 'ko'];
  it.each(languages)('provides new labels and errors in %s', (language) => {
    const copy = getCustomerProfilePromptCopy(language);
    for (const value of [copy.invalidName, copy.loading, copy.loadFailed, copy.retry, copy.description, ...Object.values(copy.errors), getOnboardingCopy(language).customizeMore]) expect(value.trim()).not.toBe('');
    if (language !== 'vi') expect([copy.invalidName, copy.loading, copy.loadFailed, copy.retry, getOnboardingCopy(language).customizeMore].join(' ')).not.toMatch(/Vui lòng|Thử lại|Tùy chỉnh|Đang tải/);
  });
});
