import { isValidElement } from 'react';
import type { FormEvent, ReactElement, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OnboardingModal } from '@/components/OnboardingModal';
import { getOnboardingCopy } from '@/lib/i18n/onboarding-copy';
import { getProfileMutationCopy } from '@/lib/i18n/profile-mutation-copy';

const state = vi.hoisted(() => ({
  index: 0, values: [] as unknown[], focus: vi.fn(), createProfile: vi.fn(), activateFreeTrial: vi.fn(),
  ref: { current: null as { focus: () => void } | null },
}));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return { ...react,
    useState: (initial: unknown) => {
      const index = state.index++;
      if (!(index in state.values)) state.values[index] = typeof initial === 'function' ? initial() : initial;
      return [state.values[index], (value: unknown) => { state.values[index] = value; }];
    },
    useRef: () => state.ref,
  };
});
vi.mock('@/lib/store', () => ({ useAppStore: () => ({ currentUser: { id: 'parent' }, isPro: false, createProfile: state.createProfile, activateFreeTrial: state.activateFreeTrial }) }));
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ language: 'vi' }) }));
vi.mock('@/lib/sound', () => ({ sounds: { playLevelUp: vi.fn() } }));

function elements(node: ReactNode): Array<ReactElement<Record<string, unknown>>> {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as ReactNode)];
}
function view(onClose = vi.fn()) {
  state.index = 0;
  const tree = elements(OnboardingModal({ isOpen: true, onClose }));
  const input = tree.find((el) => el.type === 'input' && el.props.ref === state.ref);
  state.ref.current = input ? { focus: state.focus } : null;
  return tree;
}
async function submit(tree: ReturnType<typeof view>) {
  const handler = tree.find((el) => el.type === 'form')?.props.onSubmit as (event: FormEvent) => Promise<void>;
  await handler({ preventDefault: vi.fn() } as unknown as FormEvent);
}

function fillChildName(value: string) {
  const input = view().find((el) => el.props.id === 'onboarding-child-name');
  const change = input?.props.onChange as (event: { target: { value: string } }) => void;
  change({ target: { value } });
}

function checkOption(label: string, checked: boolean) {
  const field = view().find((el) => el.type === 'label' && elements(el.props.children as ReactNode).some((child) => child.props.children === label));
  const input = elements(field).find((el) => el.type === 'input');
  const change = input?.props.onChange as (event: { target: { checked: boolean } }) => void;
  change({ target: { checked } });
}

beforeEach(() => {
  state.values = [];
  state.ref.current = null;
  state.createProfile.mockResolvedValue({ success: true });
  state.activateFreeTrial.mockResolvedValue({ success: true });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('child-only onboarding', () => {
  it('shows child fields with customization collapsed and defaults intact without a parent profile', () => {
    const tree = view();
    expect(tree.find((el) => el.props.id === 'onboarding-child-name')).toBeDefined();
    expect(tree.find((el) => el.props.id === 'onboarding-child-nickname')).toBeDefined();
    expect(tree.find((el) => el.props.id === 'onboarding-child-age')?.props.value).toBe(5);
    expect(tree.find((el) => el.type === 'details')?.props.open).toBeUndefined();
    expect(tree.filter((el) => String(el.props.id).includes('onboarding-parent'))).toEqual([]);
    const leo = tree.find((el) => el.type === 'button' && elements(el.props.children as ReactNode).some((child) => child.props.children === 'Leo'));
    expect(leo?.props['aria-pressed']).toBe(true);
    expect(tree.find((el) => el.props.type === 'checkbox')?.props.checked).toBe(true);
    const close = tree.find((el) => el.props['aria-label'] === getOnboardingCopy('vi').close);
    expect(close?.props.className).toContain('min-w-11 min-h-11');
    expect(close?.props.className).toContain('focus-visible:ring-2');
  });

  it('puts a blank-name error under the input and focuses it before any request', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    await submit(view());
    expect(state.focus).toHaveBeenCalledOnce();
    const tree = view();
    const input = tree.find((el) => el.props.id === 'onboarding-child-name');
    expect(input?.props['aria-invalid']).toBe(true);
    expect(input?.props['aria-describedby']).toBe('onboarding-child-name-error');
    const error = tree.find((el) => el.props.id === 'onboarding-child-name-error');
    expect(error?.props.role).toBe('alert');
    expect(error?.props.children).toBe(getOnboardingCopy('vi').childNameRequired);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('releases saving after consent network failure and preserves the child name', async () => {
    fillChildName('Minh An');
    checkOption(getOnboardingCopy('vi').consent, true);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await submit(view());
    const tree = view();
    expect(tree.find((el) => el.props.type === 'submit')?.props.disabled).toBe(false);
    expect(tree.find((el) => el.props.role === 'alert')?.props.children).toBe(getProfileMutationCopy('vi').privacyError);
    expect(tree.find((el) => el.props.id === 'onboarding-child-name')?.props.value).toBe('Minh An');
    expect(state.activateFreeTrial).not.toHaveBeenCalled();
    expect(state.createProfile).not.toHaveBeenCalled();
  });

  it.each([true, false])('preserves consent, trial, nickname fallback and starter habits (enabled=%s)', async (autoApply) => {
    fillChildName('Minh An');
    checkOption(getOnboardingCopy('vi').autoLoad, autoApply);
    checkOption(getOnboardingCopy('vi').consent, true);
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    const onClose = vi.fn();
    await submit(view(onClose));
    expect(fetcher).toHaveBeenCalledWith('/api/privacy/consent', expect.objectContaining({ method: 'POST', body: JSON.stringify({ policyVersion: '2026-09-19', childDataConsent: true }) }));
    expect(state.activateFreeTrial).toHaveBeenCalledOnce();
    expect(state.createProfile).toHaveBeenCalledWith(expect.objectContaining({ name: 'Minh An', nickname: 'Bé An', age: 5, avatar: 'mascot:leo', ageStage: autoApply ? '3-6' : undefined, isPublicOnLeaderboard: false }), expect.any(String));
    expect(onClose).toHaveBeenCalledOnce();
    expect(view().find((el) => el.props.type === 'submit')?.props.disabled).toBe(false);
  });
});
