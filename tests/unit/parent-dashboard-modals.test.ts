import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { vi as vietnamese } from '@/lib/i18n/locales/vi';

const state = vi.hoisted(() => ({ index: 0, openIndex: 1, editing: false }));
vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>();
  return {
    ...react,
    useState: (initial: unknown) => {
      const index = state.index++;
      if (index === state.openIndex) return [true, vi.fn()];
      if (index === 2 && state.editing) return [{ id: 'habit-1' }, vi.fn()];
      return [typeof initial === 'function' ? initial() : initial, vi.fn()];
    },
    useCallback: (callback: unknown) => callback,
    useEffect: () => undefined,
  };
});
vi.mock('@/lib/store', () => ({ useAppStore: () => ({ profiles: [], logs: [], redemptions: [] }) }));
vi.mock('@/lib/use-modal-focus', () => ({ useModalFocus: vi.fn() }));
vi.mock('@/lib/i18n/context', () => ({ useTranslation: () => ({ t: vietnamese, language: 'vi' }) }));

import { ParentDashboard } from '@/components/ParentDashboard';
import { ModalShell } from '@/components/ui/ModalShell';

type ShellProps = { children: ReactNode; label: string; isOpen: boolean; onClose: () => void };

function findShell(node: ReactNode): ReactElement<ShellProps> | undefined {
  if (Array.isArray(node)) return node.map(findShell).find(Boolean);
  if (!isValidElement<{ children?: ReactNode }>(node)) return undefined;
  if (node.type === ModalShell) return node as ReactElement<ShellProps>;
  return findShell(node.props.children);
}

describe('parent dashboard modal integration', () => {
  it.each([
    { openIndex: 1, editing: false, name: vietnamese.createHabitTitle, fields: 11 },
    { openIndex: 1, editing: true, name: vietnamese.editHabitTitle, fields: 11 },
    { openIndex: 10, editing: false, name: vietnamese.adjustPoints, fields: 2 },
  ])('uses ModalShell and labels every field in $name', ({ openIndex, editing, name, fields }) => {
    Object.assign(state, { index: 0, openIndex, editing });
    const shell = findShell(ParentDashboard());
    expect(shell).toBeDefined();
    if (!shell) throw new Error('Expected an open modal');
    expect(shell.props.isOpen).toBe(true);
    expect(shell.props.label).toBe(name);
    expect(shell.props.onClose).toBeTypeOf('function');

    const html = renderToStaticMarkup(createElement('div', null, shell.props.children));
    const controls = [...html.matchAll(/<(?:input|select|textarea)\b[^>]*>/g)];
    expect(controls).toHaveLength(fields);
    const ids = controls.map(([tag]) => tag.match(/\bid="([^"]+)"/)?.[1]);
    expect(new Set(ids).size).toBe(fields);
    for (const id of ids) {
      expect(id).toBeDefined();
      expect(html).toContain(`for="${id}"`);
    }
  });
});
