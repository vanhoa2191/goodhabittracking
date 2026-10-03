import { describe, expect, it } from 'vitest';
import type { HabitActivity } from '@/types';
import { HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import { revertChanges, SMALLER_HABIT_IDS, smallerVersionFor, toSmallerChanges } from '@/lib/habit-programs/smaller-version';

const VIETNAMESE_ONLY = /[ăĂơƠưƯđĐĩĨũŨẠ-ỹ]/u;

describe('smaller versions of habits', () => {
  it('has one for every habit of the framework, and no others', () => {
    expect([...SMALLER_HABIT_IDS].sort()).toEqual(HABIT_FRAMEWORK_CATALOG.map((habit) => habit.id).sort());
  });

  it('reads in Vietnamese and in English, and other languages read English', () => {
    const id = HABIT_FRAMEWORK_CATALOG[0]?.id;
    const vi = smallerVersionFor(id, 'vi');
    const en = smallerVersionFor(id, 'en');
    expect(vi?.title).not.toBe(en?.title);
    expect(smallerVersionFor(id, 'fr')).toEqual(en);
    expect(VIETNAMESE_ONLY.test((en?.title ?? '') + (en?.description ?? ''))).toBe(false);
  });

  it('is short enough for a task: a short title, one sentence, one to five minutes', () => {
    for (const id of SMALLER_HABIT_IDS) {
      for (const language of ['vi', 'en'] as const) {
        const version = smallerVersionFor(id, language);
        expect(version?.title.length, `${id} ${language} title`).toBeLessThanOrEqual(60);
        expect(version?.description.length, `${id} ${language} description`).toBeLessThanOrEqual(140);
        expect(version?.minutes).toBeGreaterThanOrEqual(1);
        expect(version?.minutes).toBeLessThanOrEqual(5);
      }
    }
  });

  it('has nothing for an unknown habit', () => {
    expect(smallerVersionFor(undefined, 'vi')).toBeNull();
    expect(smallerVersionFor('GD9-XX-99', 'vi')).toBeNull();
  });

  describe('putting a task back after a try that did not help', () => {
    const id = HABIT_FRAMEWORK_CATALOG[3]?.id ?? '';
    const version = smallerVersionFor(id, 'vi');
    const base: HabitActivity = {
      id: 'a1', childId: null, title: 'Đọc sách cùng con', icon: '📚', category: 'study', points: 10, recurrenceType: 'daily',
      recurrenceDays: [0, 1, 2, 3, 4, 5, 6], timeOfDay: 'evening', requiresApproval: false, isActive: true, createdAt: '2026-10-01T00:00:00.000Z',
      frameworkHabitId: id,
    };

    it('gives back the family’s own words when the task still shows the small version', () => {
      if (!version) throw new Error('no small version');
      const small = { ...base, ...toSmallerChanges(version) };
      const changes = revertChanges(small, { kind: 'smaller', previous_values: { title: 'Đọc sách cùng con', instructions: null, durationMinutes: 15 } }, version);
      expect(changes).toEqual({ title: 'Đọc sách cùng con', instructions: '', durationMinutes: 15 });
    });

    it('leaves alone anything the family edited after the try began', () => {
      if (!version) throw new Error('no small version');
      const edited = { ...base, ...toSmallerChanges(version), title: 'Đọc 5 phút mỗi tối' };
      const changes = revertChanges(edited, { kind: 'smaller', previous_values: { title: 'Đọc sách cùng con', instructions: null, durationMinutes: 15 } }, version);
      expect(changes).toEqual({ instructions: '', durationMinutes: 15 });
    });

    it('puts the time of day back after a new time did not help, and has nothing to do without saved values', () => {
      expect(revertChanges({ ...base, timeOfDay: 'morning' }, { kind: 'retime', previous_values: { timeOfDay: 'evening' } }, null)).toEqual({ timeOfDay: 'evening' });
      expect(revertChanges(base, { kind: 'retime', previous_values: null }, null)).toBeNull();
      expect(revertChanges(base, { kind: 'together', previous_values: { title: 'x' } }, null)).toBeNull();
      expect(revertChanges(base, { kind: 'retime', previous_values: { timeOfDay: 'midnight' } }, null)).toBeNull();
    });
  });

  it('turns an activity into the small version', () => {
    const version = smallerVersionFor(HABIT_FRAMEWORK_CATALOG[3]?.id, 'vi');
    expect(version).not.toBeNull();
    if (!version) return;
    expect(toSmallerChanges(version)).toEqual({ title: version.title, instructions: version.description, durationMinutes: version.minutes });
  });
});
