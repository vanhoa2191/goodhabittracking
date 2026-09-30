import { describe, expect, it } from 'vitest';
import { cueChildOptions, keepIfOtherEditor, selectSupportPromptItems } from '@/lib/habit-programs/parent-ui-state';
import type { ActivityLog } from '@/types';

const log = (id: string, date: string, overrides: Partial<ActivityLog> = {}): ActivityLog => ({
  id, activityId: 'a1', childId: 'c1', date, status: 'completed', pointsAwarded: 10, completedAt: `${date}T08:00:00.000Z`, ...overrides,
});
const base = { planned: new Set(['c1:a1']), recorded: new Set<string>(), saved: new Set<string>(), today: '2026-09-30', yesterday: '2026-09-29' };

describe('which completed habits the parent is asked about', () => {
  it('asks only about verified logs of today and yesterday for habits that have a cue plan', () => {
    const items = selectSupportPromptItems([
      log('today', '2026-09-30'),
      log('yesterday', '2026-09-29', { status: 'approved' }),
      log('old', '2026-09-28'),
      log('pending', '2026-09-30', { status: 'pending_approval' }),
      log('unplanned', '2026-09-30', { activityId: 'a2' }),
    ], base);
    expect(items.map((item) => item.id)).toEqual(['today', 'yesterday']);
  });

  it('skips logs that already have a recorded level', () => {
    expect(selectSupportPromptItems([log('done', '2026-09-30')], { ...base, recorded: new Set(['done']) })).toEqual([]);
  });

  it('keeps unanswered logs coming after six answers, and only echoes the latest few confirmations', () => {
    const logs = Array.from({ length: 9 }, (_, index) => log(`l${index + 1}`, '2026-09-30'));
    const saved = new Set(['l1', 'l2', 'l3', 'l4', 'l5', 'l6']);
    const items = selectSupportPromptItems(logs, { ...base, recorded: saved, saved });
    const ids = items.map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining(['l7', 'l8', 'l9']));
    expect(ids.filter((id) => saved.has(id))).toEqual(['l4', 'l5', 'l6']);
    expect(ids.slice(0, 3)).toEqual(['l7', 'l8', 'l9']);
  });

  it('shows at most six unanswered logs at a time', () => {
    const logs = Array.from({ length: 9 }, (_, index) => log(`l${index + 1}`, '2026-09-30'));
    expect(selectSupportPromptItems(logs, base)).toHaveLength(6);
  });
});

describe('which child a cue is for', () => {
  const profiles = [{ id: 'c1', name: 'An' }, { id: 'c2', name: 'Binh' }];

  it('uses the habit\'s own child when it is assigned to one', () => {
    expect(cueChildOptions({ childId: 'c2' }, profiles, 'all', 'c1')).toEqual({ options: [profiles[1]], defaultId: 'c2' });
  });

  it('uses the child chosen in the list filter when a shared habit is filtered', () => {
    expect(cueChildOptions({ childId: null }, profiles, 'c2', 'c1')).toEqual({ options: [profiles[1]], defaultId: 'c2' });
  });

  it('asks which child when a shared habit is seen under all children', () => {
    expect(cueChildOptions({ childId: null }, profiles, 'all', 'c1')).toEqual({ options: profiles, defaultId: 'c1' });
    expect(cueChildOptions({ childId: null }, profiles, 'all', null).defaultId).toBe('c1');
    expect(cueChildOptions({ childId: null }, [], 'all', null)).toEqual({ options: [], defaultId: null });
  });
});

describe('closing an editor after a slow save', () => {
  it('closes the editor that finished but leaves a newer one open', () => {
    const first = { id: 'a' };
    const second = { id: 'b' };
    expect(keepIfOtherEditor(first, first)).toBeNull();
    expect(keepIfOtherEditor(second, first)).toBe(second);
    expect(keepIfOtherEditor(null, first)).toBeNull();
  });
});
