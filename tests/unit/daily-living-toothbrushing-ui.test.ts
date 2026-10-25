import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import type * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language, HabitActivity } from '@/types';
import { generateAgeAdaptedHabits } from '@/lib/wit-framework';
import { getDailyLivingTemplate, toHabitActivity } from '@/lib/daily-living-habits';

const state = vi.hoisted(() => ({
  language: 'vi' as Language, enabled: true, activities: [] as HabitActivity[],
  scope: 'child-a', createActivities: vi.fn(), updateActivity: vi.fn(),
  hooks: null as unknown[] | null, cursor: 0, effects: [] as (() => void | (() => void))[],
}));
// Like the other node-only UI tests, exercise event handlers with bounded hook
// state, and keep normal React hooks for server-markup assertions. No DOM/server.
vi.mock('react', async (load) => {
  const actual = await load<typeof React>();
  return { ...actual,
    useState<T>(initial: T | (() => T)) {
      if (!state.hooks) return actual.useState(initial);
      const index = state.cursor++;
      if (!(index in state.hooks)) state.hooks[index] = typeof initial === 'function' ? (initial as () => T)() : initial;
      return [state.hooks[index] as T, (action: T | ((previous: T) => T)) => {
        if (state.hooks) state.hooks[index] = typeof action === 'function' ? (action as (previous: T) => T)(state.hooks[index] as T) : action;
      }];
    },
    useRef<T>(initial: T) {
      if (!state.hooks) return actual.useRef(initial);
      const index = state.cursor++;
      if (!(index in state.hooks)) state.hooks[index] = { current: initial };
      return state.hooks[index] as { current: T };
    },
    useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
      if (!state.hooks) return actual.useEffect(effect, deps);
      state.effects.push(effect);
    },
  };
});
vi.mock('@/lib/experience-flags', () => ({ defaultExperienceFlags: { get dailyLivingHabits() { return state.enabled; } } }));
vi.mock('@/lib/i18n/context', async (load) => ({ ...await load<typeof import('@/lib/i18n/context')>(), useTranslation: () => ({ language: state.language }) }));
vi.mock('@/lib/store', () => ({ useAppStore: () => ({
  activities: state.activities, profiles: [{ id: 'child-a', name: 'An' }],
  activeChildId: state.scope, familyId: 'family',
  createActivities: state.createActivities, updateActivity: state.updateActivity,
}) }));

import { DailyLivingHabitLibrary, convertToothbrushing } from '@/components/DailyLivingHabitLibrary';

const old = (overrides: Partial<HabitActivity> = {}): HabitActivity => ({
  ...generateAgeAdaptedHabits('child-a', '3-6')[1],
  id: 'old', legacyTemplateId: 'WIT-PHY-02', createdAt: '2026-10-24T00:00:00Z', ...overrides,
});
async function pair(childId: string | null = 'child-a') {
  return Promise.all(['WIT-DLY-01', 'WIT-DLY-02'].map(async (id) => ({
    ...await toHabitActivity(getDailyLivingTemplate(id)!, 'family', { childId }), createdAt: '2026-10-25T00:00:00Z',
  })));
}
const render = () => renderToStaticMarkup(createElement(DailyLivingHabitLibrary));

beforeEach(() => {
  state.language = 'vi'; state.enabled = true; state.scope = 'child-a'; state.activities = [old()];
  state.createActivities.mockReset(); state.updateActivity.mockReset();
  state.hooks = null; state.cursor = 0; state.effects = [];
});

type ControlProps = {
  children?: ReactNode; value?: string; 'data-testid'?: string;
  onClick?: () => void; onChange?: (event: { target: { value: string } }) => void;
  disabled?: boolean; checked?: boolean;
};
function controls(node: ReactNode): ReactElement<ControlProps>[] {
  if (Array.isArray(node)) return node.flatMap(controls);
  if (!isValidElement<ControlProps>(node)) return [];
  return [node, ...controls(node.props.children)];
}
function interactiveView() {
  state.cursor = 0; state.effects = [];
  const tree = DailyLivingHabitLibrary();
  state.effects.forEach((effect) => effect());
  return controls(tree);
}
function control(testId: string) {
  return interactiveView().find((item) => item.props['data-testid'] === testId)!.props;
}
function choose(value: string) {
  interactiveView().find((item) => item.type === 'input' && item.props.value === value)!.props.onChange!({ target: { value } });
}

describe('toothbrushing UI event wiring', () => {
  it('requires explicit switch + confirm, locks double clicks, and reads the committed store before pausing', async () => {
    state.hooks = [];
    const events: string[] = [];
    state.createActivities.mockImplementation(async (items: readonly Omit<HabitActivity, 'createdAt'>[]) => {
      events.push('create');
      state.activities = [...state.activities, ...items.map((item) => ({ ...item, createdAt: '2026-10-25' }))];
      return true;
    });
    state.updateActivity.mockImplementation(async (id: string, updates: Partial<HabitActivity>) => {
      events.push('pause');
      state.activities = state.activities.map((item) => item.id === id ? { ...item, ...updates } : item);
      return true;
    });
    const keepConfirm = control('toothbrushing-confirm');
    expect(keepConfirm.disabled).toBe(true);
    keepConfirm.onClick!();
    expect(state.createActivities).not.toHaveBeenCalled();
    choose('switch');
    const confirm = control('toothbrushing-confirm');
    expect(confirm.disabled).toBe(false);
    confirm.onClick!(); confirm.onClick!();
    expect(control('daily-living-child-select').disabled).toBe(true);
    await vi.waitFor(() => {
      interactiveView();
      expect(state.updateActivity).toHaveBeenCalledExactlyOnceWith('old', { isActive: false });
    });
    expect(state.createActivities).toHaveBeenCalledTimes(1);
    expect(events).toEqual(['create', 'pause']);
    state.cursor = 0;
    expect(renderToStaticMarkup(createElement('div', null, DailyLivingHabitLibrary()))).toContain('Đã xác nhận hai mục sáng/tối');
  });

  it('keeps old active and exposes an alert on save failure, including if rows sync in later', async () => {
    state.hooks = []; state.createActivities.mockResolvedValue(false);
    choose('switch'); control('toothbrushing-confirm').onClick!();
    await vi.waitFor(() => {
      interactiveView();
      expect(control('toothbrushing-confirm').disabled).toBe(false);
    });
    state.activities.push(...await pair());
    interactiveView();
    state.cursor = 0;
    const html = renderToStaticMarkup(createElement('div', null, DailyLivingHabitLibrary()));
    expect(html).toContain('role="alert"'); expect(html).toContain('Mục gộp được giữ nguyên');
    expect(state.activities[0].isActive).toBe(true); expect(state.updateActivity).not.toHaveBeenCalled();
  });

  it('resets to keep when changing assignment scope', () => {
    state.hooks = [];
    choose('switch');
    control('daily-living-child-select').onChange!({ target: { value: 'shared' } });
    control('daily-living-child-select').onChange!({ target: { value: 'child-a' } });
    expect(control('toothbrushing-confirm').disabled).toBe(true);
    expect(state.createActivities).not.toHaveBeenCalled();
  });
});

describe('toothbrushing parent library UI', () => {
  it('defaults to keep, offers an explicit switch, and previews separate times and total stars', () => {
    const html = render();
    expect(html).toContain('Giữ nguyên');
    expect(html).toContain('Chuyển sang sáng + tối');
    expect(html.match(/<input[^>]*value="keep"[^>]*>/)?.[0]).toContain('checked=""');
    expect(html.match(/<input[^>]*value="switch"[^>]*>/)?.[0]).not.toContain('checked=""');
    expect(html).toContain('Tổng sao sau khi chuyển: 10');
    expect(html).toContain('Sáng'); expect(html).toContain('Tối');
    expect(state.createActivities).not.toHaveBeenCalled();
    expect(state.updateActivity).not.toHaveBeenCalled();
    expect(html).toMatch(/data-testid="daily-living-add"[^>]*disabled=""/);
  });

  it('explains why a shared combined habit must be kept while configuring one child', () => {
    state.activities = [old({ childId: null })];
    const html = render();
    expect(html).toContain('Chọn “Cả nhà”');
    expect(html.match(/<input[^>]*value="switch"[^>]*>/)?.[0]).toContain('disabled=""');
  });

  it('offers restore guidance instead of duplicating an archived half', async () => {
    const [morning] = await pair();
    state.activities.push({ ...morning, isActive: false });
    expect(render()).toContain('Khôi phục hoặc Luyện lại');
  });

  it.each(['off', 'en', 'no combined'] as const)('hides conversion when %s', (condition) => {
    if (condition === 'off') state.enabled = false;
    if (condition === 'en') state.language = 'en';
    if (condition === 'no combined') state.activities = [];
    expect(render()).not.toContain('data-testid="toothbrushing-conversion"');
  });
});

describe('confirmed replacement before pausing combined toothbrushing', () => {
  async function setup(scope = 'child-a', rows = [old()]) {
    let activities = rows;
    const events: string[] = [];
    const createActivities = vi.fn(async (items: readonly Omit<HabitActivity, 'createdAt'>[]) => {
      events.push('create');
      activities = [...activities, ...items.map((item) => ({ ...item, createdAt: '2026-10-25T00:00:00Z' }))];
      return true;
    });
    const readActivities = vi.fn(async () => { events.push('read'); return activities; });
    const updateActivity = vi.fn(async (id: string, updates: Partial<HabitActivity>) => {
      events.push('pause'); activities = activities.map((item) => item.id === id ? { ...item, ...updates } : item); return true;
    });
    const run = () => convertToothbrushing(scope, 'family', { activities: rows, createActivities, readActivities, updateActivity });
    return { run, createActivities, readActivities, updateActivity, events, rows: () => activities };
  }

  it('creates the pair, reads it back, then only sets isActive=false on the old row', async () => {
    const previous = old({ points: 17, title: 'Tên riêng' });
    const test = await setup('child-a', [previous]);
    expect(await test.run()).toBe('converted');
    expect(test.events).toEqual(['create', 'read', 'pause']);
    expect(test.createActivities.mock.calls[0][0].map((item) => [item.legacyTemplateId, item.childId, item.timeOfDay])).toEqual([
      ['WIT-DLY-01', 'child-a', 'morning'], ['WIT-DLY-02', 'child-a', 'evening'],
    ]);
    expect(test.updateActivity).toHaveBeenCalledExactlyOnceWith('old', { isActive: false });
    expect(test.rows()[0]).toEqual({ ...previous, isActive: false });
    expect(previous.isActive).toBe(true);
  });

  it.each(['false', 'throw'] as const)('leaves old untouched when create returns %s', async (failure) => {
    const test = await setup();
    if (failure === 'false') test.createActivities.mockResolvedValue(false);
    else test.createActivities.mockRejectedValue(new Error('timeout'));
    expect(await test.run()).toBe('saveUnconfirmed');
    expect(test.updateActivity).not.toHaveBeenCalled();
    expect(test.readActivities).not.toHaveBeenCalled();
  });

  it.each(['empty', 'half', 'inactive', 'wrong child', 'throws'] as const)('keeps old active on incomplete readback: %s', async (failure) => {
    const test = await setup();
    const replacements = await pair();
    if (failure === 'throws') test.readActivities.mockRejectedValue(new Error('sync failed'));
    else test.readActivities.mockResolvedValue([old(), ...(
      failure === 'empty' ? [] : failure === 'half' ? replacements.slice(0, 1) : replacements.map((item) => ({
        ...item, ...(failure === 'inactive' ? { isActive: false } : { childId: 'child-b' }),
      }))
    )]);
    expect(await test.run()).toBe('saveUnconfirmed');
    expect(test.updateActivity).not.toHaveBeenCalled();
  });

  it('does not trust a success boolean when replacements were skipped by an in-flight store guard', async () => {
    const test = await setup();
    test.createActivities.mockResolvedValue(true);
    expect(await test.run()).toBe('saveUnconfirmed');
    expect(test.updateActivity).not.toHaveBeenCalled();
  });

  it('creates only a missing half and never overwrites an existing custom half', async () => {
    const [morning] = await pair();
    const custom = { ...morning, points: 0, title: 'Theo lịch riêng', timeOfDay: 'afternoon' as const };
    const test = await setup('child-a', [old(), custom]);
    expect(await test.run()).toBe('converted');
    expect(test.createActivities.mock.calls[0][0].map((item) => item.legacyTemplateId)).toEqual(['WIT-DLY-02']);
    expect(test.rows().find((item) => item.id === custom.id)).toEqual(custom);
  });

  it('reuses both existing halves and retries pausing without creating duplicates', async () => {
    const test = await setup('child-a', [old(), ...await pair()]);
    test.updateActivity.mockResolvedValueOnce(false);
    expect(await test.run()).toBe('pauseUnconfirmed');
    expect(await test.run()).toBe('converted');
    expect(test.createActivities).not.toHaveBeenCalled();
  });

  it('reports a pause exception separately after the pair is confirmed', async () => {
    const test = await setup();
    test.updateActivity.mockRejectedValue(new Error('timeout'));
    expect(await test.run()).toBe('pauseUnconfirmed');
    expect(test.events).toEqual(['create', 'read']);
  });

  it('never writes a shared combined habit from a child scope', async () => {
    const test = await setup('child-a', [old({ childId: null })]);
    expect(await test.run()).toBe('blocked');
    expect(test.createActivities).not.toHaveBeenCalled(); expect(test.updateActivity).not.toHaveBeenCalled();
  });

  it('explicit family conversion creates two shared halves and pauses only the shared old habit', async () => {
    const shared = old({ id: 'shared-old', childId: null });
    const test = await setup('shared', [shared, old()]);
    expect(await test.run()).toBe('converted');
    expect(test.createActivities.mock.calls[0][0].every((item) => item.childId === null)).toBe(true);
    expect(test.updateActivity).toHaveBeenCalledExactlyOnceWith('shared-old', { isActive: false });
    expect(test.rows().find((item) => item.id === 'old')?.isActive).toBe(true);
  });

  it('refuses to pause when the combined assignment changes scope during saving', async () => {
    const test = await setup();
    test.readActivities.mockResolvedValue([old({ childId: 'child-b' }), ...await pair()]);
    expect(await test.run()).toBe('saveUnconfirmed'); expect(test.updateActivity).not.toHaveBeenCalled();
  });

  it('requires another explicit confirmation if readback reveals a different star total', async () => {
    const test = await setup();
    const replacements = await pair();
    test.readActivities.mockResolvedValue([old(), { ...replacements[0], points: 25 }, replacements[1]]);
    expect(await test.run()).toBe('saveUnconfirmed');
    expect(test.updateActivity).not.toHaveBeenCalled();
  });
});
