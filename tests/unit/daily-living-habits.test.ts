import { WIT_HABIT_PACKS } from '@/lib/constants';
import { describe, expect, it } from 'vitest';
import {
  DAILY_LIVING_TEMPLATES,
  DAILY_LIVING_SETS,
  getDailyLivingTemplate,
  validateDailyLivingCatalog,
  getTemplatesForSet,
  toHabitActivity,
  dailyLivingStatus,
} from '@/lib/daily-living-habits';
import { HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import { HABIT_PROGRAMS } from '@/lib/habit-programs/programs';
import type { HabitActivity } from '@/types';

describe('Daily Living Catalog — structure and integrity', () => {
  it('has 12 unique templates', () => {
    expect(DAILY_LIVING_TEMPLATES).toHaveLength(12);
    const ids = DAILY_LIVING_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(12);
  });

  it('has 10 daily templates (WIT-DLY-01..10) and 2 legacy (WIT-NUT-01, WIT-CAP-01)', () => {
    const daily = DAILY_LIVING_TEMPLATES.filter((t) => t.source === 'daily');
    const legacy = DAILY_LIVING_TEMPLATES.filter((t) => t.source === 'legacy');
    expect(daily).toHaveLength(10);
    expect(legacy).toHaveLength(2);
    expect(daily.map((t) => t.id).sort()).toEqual([
      'WIT-DLY-01', 'WIT-DLY-02', 'WIT-DLY-03', 'WIT-DLY-04', 'WIT-DLY-05',
      'WIT-DLY-06', 'WIT-DLY-07', 'WIT-DLY-08', 'WIT-DLY-09', 'WIT-DLY-10',
    ]);
    expect(legacy.map((t) => t.id).sort()).toEqual(['WIT-CAP-01', 'WIT-NUT-01']);
  });

  it('all templates have required fields populated', () => {
    for (const t of DAILY_LIVING_TEMPLATES) {
      expect(t.id).toMatch(/^WIT-(DLY-\d{2}|NUT-01|CAP-01)$/);
      expect(t.title).toBeTruthy();
      expect(t.shortTitle).toBeTruthy();
      expect(t.icon).toBeTruthy();
      expect(['selfcare', 'health', 'chores', 'nutrition', 'capacity']).toContain(t.category);
      expect(['morning', 'afternoon', 'evening', 'anytime']).toContain(t.timeOfDay);
      expect(typeof t.points).toBe('number');
      expect(t.points).toBeGreaterThanOrEqual(0);
      expect(t.description).toBeTruthy();
    }
  });

  it('daily templates have 5 points each', () => {
    for (const t of DAILY_LIVING_TEMPLATES.filter((t) => t.source === 'daily')) {
      expect(t.points).toBe(5);
    }
  });

  it('legacy templates resolve fields from WIT_HABIT_PACKS at runtime', () => {
    const nut = DAILY_LIVING_TEMPLATES.find((t) => t.id === 'WIT-NUT-01')!;
    const cap = DAILY_LIVING_TEMPLATES.find((t) => t.id === 'WIT-CAP-01')!;
    expect(nut.title).toBe('Rửa sạch hai tay bằng xà phòng trước khi vào bàn ăn');
    expect(nut.icon).toBe('🧼');
    expect(nut.category).toBe('nutrition');
    expect(nut.timeOfDay).toBe('afternoon');
    expect(nut.points).toBe(10);
    expect(cap.title).toBe('Gánh vác: Tự gấp chăn màn & sắp xếp giường');
    expect(cap.icon).toBe('🛏️');
    expect(cap.category).toBe('capacity');
    expect(cap.timeOfDay).toBe('morning');
    expect(cap.points).toBe(15);
  });

  it('has 4 sets with valid references', () => {
    expect(DAILY_LIVING_SETS).toHaveLength(4);
    const templateIds = new Set(DAILY_LIVING_TEMPLATES.map((t) => t.id));
    for (const set of DAILY_LIVING_SETS) {
      expect(set.id).toMatch(/^DLS-\d{2}$/);
      expect(set.title).toBeTruthy();
      expect(set.description).toBeTruthy();
      expect(set.itemIds.length).toBeGreaterThanOrEqual(2);
      expect(set.itemIds.length).toBeLessThanOrEqual(5);
      for (const itemId of set.itemIds) {
        expect(templateIds.has(itemId)).toBe(true);
      }
    }
  });

  it('set contents match plan.md', () => {
    const setsById = Object.fromEntries(DAILY_LIVING_SETS.map((s) => [s.id, s]));
    expect(setsById['DLS-01'].itemIds).toEqual(['WIT-DLY-01', 'WIT-DLY-03']);
    expect(setsById['DLS-02'].itemIds).toEqual(['WIT-DLY-01', 'WIT-DLY-03', 'WIT-DLY-05', 'WIT-DLY-04', 'WIT-CAP-01']);
    expect(setsById['DLS-03'].itemIds).toEqual(['WIT-DLY-02', 'WIT-DLY-07', 'WIT-DLY-09', 'WIT-DLY-10']);
    expect(setsById['DLS-04'].itemIds).toEqual(['WIT-DLY-01', 'WIT-DLY-02', 'WIT-DLY-03', 'WIT-NUT-01', 'WIT-DLY-06']);
  });

  it('validateDailyLivingCatalog passes without throwing', () => {
    expect(() => validateDailyLivingCatalog()).not.toThrow();
  });

  it('getDailyLivingTemplate returns correct template', () => {
    const t = getDailyLivingTemplate('WIT-DLY-01');
    expect(t).toBeDefined();
    expect(t!.id).toBe('WIT-DLY-01');
    expect(t!.shortTitle).toBe('Đánh răng sáng');
  });

  it('getDailyLivingTemplate returns undefined for unknown ID', () => {
    expect(getDailyLivingTemplate('WIT-XXX-99')).toBeUndefined();
  });

  it('getTemplatesForSet returns correct templates in order', () => {
    const templates = getTemplatesForSet('DLS-01');
    expect(templates).toHaveLength(2);
    expect(templates.map((t) => t.id)).toEqual(['WIT-DLY-01', 'WIT-DLY-03']);
  });
});

describe('toHabitActivity adapter', () => {
  const familyId = '11111111-1111-4111-8111-111111111111';
  const childId = '22222222-2222-4222-8222-222222222222';

  it('creates activity with deterministic ID for WIT-DLY-* templates', async () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activity = await toHabitActivity(template, familyId, { childId });
    expect(activity.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(activity.legacyTemplateId).toBe('WIT-DLY-01');
  });

  it('creates activity with random UUID for legacy templates', async () => {
    const template = getDailyLivingTemplate('WIT-NUT-01')!;
    const activity = await toHabitActivity(template, familyId, { childId });
    expect(activity.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(activity.legacyTemplateId).toBe('WIT-NUT-01');
  });

  it('sets standard daily living fields', async () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activity = await toHabitActivity(template, familyId, { childId });
    expect(activity.childId).toBe(childId);
    expect(activity.title).toBe(template.title);
    expect(activity.description).toBe(template.description);
    expect(activity.instructions).toBe(template.support);
    expect(activity.icon).toBe(template.icon);
    expect(activity.category).toBe(template.category);
    expect(activity.points).toBe(template.points);
    expect(activity.recurrenceType).toBe('daily');
    expect(activity.recurrenceDays).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(activity.timeOfDay).toBe(template.timeOfDay);
    expect(activity.durationMinutes).toBe(0);
    expect(activity.requiresApproval).toBe(false);
    expect(activity.isActive).toBe(true);
    expect(activity.targetAgeStage).toBe('all');
    expect(activity.isParentRole).toBe(false);
    expect(activity.legacyTemplateId).toBe(template.id);
  });

  it('allows overriding points, timeOfDay, cue', async () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activity = await toHabitActivity(template, familyId, {
      childId,
      points: 10,
      timeOfDay: 'anytime',
      cue: 'Custom cue',
    });
    expect(activity.points).toBe(10);
    expect(activity.timeOfDay).toBe('anytime');
  });

  it('uses null childId for shared activities', async () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activity = await toHabitActivity(template, familyId, { childId: null });
    expect(activity.childId).toBeNull();
  });
});

describe('dailyLivingStatus', () => {
  const childId = '22222222-2222-4222-8222-222222222222';

  const baseActivity = (overrides: Partial<HabitActivity> = {}): HabitActivity => ({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    childId,
    title: 'Test',
    icon: '🪥',
    category: 'selfcare',
    points: 5,
    recurrenceType: 'daily',
    recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
    timeOfDay: 'morning',
    requiresApproval: false,
    isActive: true,
    targetAgeStage: 'all',
    isParentRole: false,
    legacyTemplateId: 'WIT-DLY-01',
    createdAt: '2026-10-24T00:00:00.000Z',
    ...overrides,
  });

  it('returns "available" when no matching activity exists', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    expect(dailyLivingStatus(template, childId, [])).toBe('available');
  });

  it('returns "added" when active activity exists for the child', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activities = [baseActivity({ isActive: true, childId })];
    expect(dailyLivingStatus(template, childId, activities)).toBe('added');
  });

  it('returns "sharedCovers" when shared (null childId) activity covers the child', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activities = [baseActivity({ isActive: true, childId: null })];
    expect(dailyLivingStatus(template, childId, activities)).toBe('sharedCovers');
  });

  it('ignores another child\'s graduated, archived or active assignment', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const otherChild = '33333333-3333-4333-8333-333333333333';
    const activities = [
      baseActivity({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', isActive: false, graduatedAt: '2026-10-01T00:00:00.000Z', childId: otherChild }),
      baseActivity({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', isActive: false, childId: otherChild }),
      baseActivity({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', isActive: true, childId: otherChild }),
    ];
    expect(dailyLivingStatus(template, childId, activities)).toBe('available');
  });

  it('returns "graduated" when activity has graduatedAt', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activities = [baseActivity({ isActive: false, graduatedAt: '2026-10-01T00:00:00.000Z', childId })];
    expect(dailyLivingStatus(template, childId, activities)).toBe('graduated');
  });

  it('returns "archived" when activity is inactive without graduatedAt', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activities = [baseActivity({ isActive: false, graduatedAt: null, childId })];
    expect(dailyLivingStatus(template, childId, activities)).toBe('archived');
  });

  it('prefers "added" over "sharedCovers" when both exist', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activities = [
      baseActivity({ isActive: true, childId: null }), // shared
      baseActivity({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', isActive: true, childId }), // child-specific
    ];
    expect(dailyLivingStatus(template, childId, activities)).toBe('added');
  });

  it('prefers "graduated" over other statuses', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const activities = [
      baseActivity({ isActive: true, childId }), // added
      baseActivity({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', isActive: false, graduatedAt: '2026-10-01T00:00:00.000Z', childId }), // graduated
    ];
    expect(dailyLivingStatus(template, childId, activities)).toBe('graduated');
  });

  it('uses matchesLegacyTemplateAssignment for WIT-NUT-01 and WIT-CAP-01', () => {
    const nutTemplate = getDailyLivingTemplate('WIT-NUT-01')!;
    const capTemplate = getDailyLivingTemplate('WIT-CAP-01')!;

    // An old row saved from the original catalog entry, without legacyTemplateId.
    const original = WIT_HABIT_PACKS.flatMap((pack) => pack.items).find((item) => item.id === 'WIT-NUT-01')!;
    const legacyActivity: HabitActivity = {
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      childId: null,
      title: original.title,
      description: original.description,
      instructions: original.description,
      icon: original.icon,
      category: original.category,
      points: original.points,
      recurrenceType: 'daily',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: original.timeOfDay,
      durationMinutes: original.durationMinutes,
      requiresApproval: Boolean(original.requiresApproval),
      isActive: true,
      targetAgeStage: 'all',
      isParentRole: false,
      createdAt: '2026-10-24T00:00:00.000Z',
    };

    expect(dailyLivingStatus(nutTemplate, childId, [legacyActivity])).toBe('sharedCovers');
    expect(dailyLivingStatus(capTemplate, childId, [legacyActivity])).toBe('available'); // different template

    // Activity with different title should not match
    const diffTitleActivity = { ...legacyActivity, title: 'Different title' };
    expect(dailyLivingStatus(nutTemplate, childId, [diffTitleActivity])).toBe('available');
  });

  it('does not match custom habits with only similar title', () => {
    const template = getDailyLivingTemplate('WIT-DLY-01')!;
    const customActivity: HabitActivity = {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      childId,
      title: 'Đánh răng buổi sáng',
      icon: '🪥',
      category: 'selfcare',
      points: 5,
      recurrenceType: 'daily',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6],
      timeOfDay: 'morning',
      requiresApproval: false,
      isActive: true,
      targetAgeStage: 'all',
      isParentRole: false,
      createdAt: '2026-10-24T00:00:00.000Z',
    };
    // No legacyTemplateId, different structure - should not match
    expect(dailyLivingStatus(template, childId, [customActivity])).toBe('available');
  });
});

describe('Framework and Program invariants', () => {
  it('47 framework habits unchanged', () => {
    expect(HABIT_FRAMEWORK_CATALOG).toHaveLength(47);
    const ids = HABIT_FRAMEWORK_CATALOG.map((h) => h.id);
    expect(new Set(ids).size).toBe(47);
    for (const h of HABIT_FRAMEWORK_CATALOG) {
      expect(h.id).toMatch(/^GD[1-5]-(NT|SK|MQH|HT|TC)-\d{2}$/);
    }
  });

  it('20 programs unchanged', () => {
    expect(HABIT_PROGRAMS).toHaveLength(20);
    const ids = HABIT_PROGRAMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(20);
    for (const p of HABIT_PROGRAMS) {
      expect(p.habitIds).toHaveLength(3);
      for (const hid of p.habitIds) {
        expect(hid).toMatch(/^GD[1-5]-(NT|SK|MQH|HT|TC)-\d{2}$/);
      }
    }
  });
});

describe('Morning/evening are separate activity IDs', () => {
  it('WIT-DLY-01 and WIT-DLY-02 produce different deterministic IDs', async () => {
    const familyId = '11111111-1111-4111-8111-111111111111';
    const childId = '22222222-2222-4222-8222-222222222222';
    const id1 = await (await import('@/lib/daily-living-habits-id')).dailyLivingActivityId(familyId, childId, 'WIT-DLY-01');
    const id2 = await (await import('@/lib/daily-living-habits-id')).dailyLivingActivityId(familyId, childId, 'WIT-DLY-02');
    expect(id1).not.toBe(id2);
  });
});