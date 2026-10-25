import { describe, expect, it } from 'vitest';
import { getToothbrushingConversion } from '@/lib/daily-living-habits';
import { WIT_HABIT_PACKS } from '@/lib/constants';
import { generateAgeAdaptedHabits } from '@/lib/wit-framework';
import type { HabitActivity } from '@/types';

const combined = (overrides: Partial<HabitActivity> = {}): HabitActivity => ({
  ...generateAgeAdaptedHabits('child-a', '3-6')[1],
  id: 'combined', createdAt: '2026-10-24T00:00:00Z', legacyTemplateId: 'WIT-PHY-02',
  ...overrides,
});
const replacement = (templateId: string, overrides: Partial<HabitActivity> = {}) => combined({
  id: templateId, legacyTemplateId: templateId, points: 5, ...overrides,
});

describe('toothbrushing conversion decision', () => {
  it('requires a selected scope and an active combined assignment', () => {
    expect(getToothbrushingConversion('', [combined()]).canConvert).toBe(false);
    for (const activities of [[], [combined({ isActive: false })], [combined({ childId: 'child-b' })]]) {
      expect(getToothbrushingConversion('child-a', activities).canConvert).toBe(false);
    }
  });

  it('plans both missing templates and reports the old and new star totals without mutations', () => {
    const old = combined({ title: 'Tên đã sửa', points: 17 });
    const before = structuredClone(old);
    const plan = getToothbrushingConversion('child-a', [old]);
    expect(plan.canConvert).toBe(true);
    expect(plan.combinedActivities).toEqual([old]);
    expect(plan.missingTemplates.map((item) => item.id)).toEqual(['WIT-DLY-01', 'WIT-DLY-02']);
    expect(plan.previousPoints).toBe(17);
    expect(plan.replacementPoints).toBe(10);
    expect(plan.pairConfirmed).toBe(false);
    expect(old).toEqual(before);
  });

  it('reuses active child or shared replacements, preserving their custom points', () => {
    const morning = replacement('WIT-DLY-01', { points: 0, timeOfDay: 'afternoon' });
    const evening = replacement('WIT-DLY-02', { childId: null, points: 12 });
    const plan = getToothbrushingConversion('child-a', [combined(), morning, evening]);
    expect(plan.missingTemplates).toEqual([]);
    expect(plan.replacementPoints).toBe(12);
    expect(plan.pairConfirmed).toBe(true);
  });

  it('only adds the missing half and ignores another child’s replacements', () => {
    const plan = getToothbrushingConversion('child-a', [combined(), replacement('WIT-DLY-01'), replacement('WIT-DLY-02', { childId: 'child-b' })]);
    expect(plan.missingTemplates.map((item) => item.id)).toEqual(['WIT-DLY-02']);
  });

  it.each([{ isActive: false }, { isActive: false, graduatedAt: '2026-10-20' }, { graduatedAt: '2026-10-20' }])('requires explicit restore/practice for an inactive replacement: %j', (overrides) => {
    const plan = getToothbrushingConversion('child-a', [combined(), replacement('WIT-DLY-01', overrides)]);
    expect(plan.canConvert).toBe(false);
    expect(plan.blockedReason).toBe('inactiveReplacement');
    expect(plan.pairConfirmed).toBe(false);
    expect(plan.missingTemplates.map((item) => item.id)).not.toContain('WIT-DLY-01');
  });

  it('prefers an active shared replacement over an archived child replacement', () => {
    const plan = getToothbrushingConversion('child-a', [combined(), replacement('WIT-DLY-01', { isActive: false }), replacement('WIT-DLY-01', { id: 'shared-morning', childId: null })]);
    expect(plan.canConvert).toBe(true);
    expect(plan.missingTemplates.map((item) => item.id)).toEqual(['WIT-DLY-02']);
  });

  it('never pauses a shared combined habit from a single child scope', () => {
    const shared = combined({ childId: null });
    const plan = getToothbrushingConversion('child-a', [shared, combined()]);
    expect(plan.canConvert).toBe(false);
    expect(plan.blockedReason).toBe('shared');
  });

  it('only converts shared combined habits into shared replacements after selecting the family', () => {
    const shared = combined({ childId: null });
    const plan = getToothbrushingConversion('shared', [shared, combined()]);
    expect(plan.canConvert).toBe(true);
    expect(plan.combinedActivities).toEqual([shared]);
    expect(plan.missingTemplates).toHaveLength(2);
    expect(getToothbrushingConversion('shared', [shared, replacement('WIT-DLY-01', { childId: null }), replacement('WIT-DLY-02', { childId: null })]).pairConfirmed).toBe(true);
  });

  it('keeps a shared combined habit when creating shared replacements would overlap existing child assignments', () => {
    const plan = getToothbrushingConversion('shared', [combined({ childId: null }), replacement('WIT-DLY-01')]);
    expect(plan.canConvert).toBe(false);
    expect(plan.blockedReason).toBe('childReplacement');
  });

  it('recognizes the known age starter by its complete structure, never by title alone', () => {
    const ageHabit = combined({ legacyTemplateId: undefined });
    expect(getToothbrushingConversion('child-a', [ageHabit]).canConvert).toBe(true);
    for (const overrides of [{ description: 'Tự tạo' }, { points: 99 }, { portrait16Key: undefined }, { frameworkHabitId: 'GD1-NT-01' }, { legacyTemplateId: 'WIT-DLY-01' }]) {
      expect(getToothbrushingConversion('child-a', [combined({ legacyTemplateId: undefined, ...overrides })]).combinedActivities).toEqual([]);
    }
  });

  it('recognizes untouched legacy shared rows with no template ID using the existing matcher', () => {
    const template = WIT_HABIT_PACKS.flatMap((pack) => pack.items).find((item) => item.id === 'WIT-PHY-02')!;
    const row = combined({ ...template, id: 'old-shared', childId: null, legacyTemplateId: undefined, targetAgeStage: 'all', portrait16Key: undefined });
    expect(getToothbrushingConversion('shared', [row]).combinedActivities).toEqual([row]);
  });
});
