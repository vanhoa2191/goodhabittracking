import { describe, expect, it } from 'vitest';
import { createActivityFromFrameworkHabit, HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import { frameworkLanguageFor, loadFramework, VIETNAMESE_FRAMEWORK } from '@/lib/habit-framework/localized';
import type { Language } from '@/types';

const translated: readonly Language[] = ['en', 'ko'];
const readsEnglish: readonly Language[] = ['fr', 'de', 'it', 'es', 'zh', 'ja'];

describe('localized habit framework', () => {
  it('gives Vietnamese at once, as the authoritative text', async () => {
    expect(await loadFramework('vi')).toBe(VIETNAMESE_FRAMEWORK);
    expect(VIETNAMESE_FRAMEWORK.habits).toBe(HABIT_FRAMEWORK_CATALOG);
  });

  it.each(translated)('loads %s with the same habits, stages and ids as the Vietnamese text', async (language) => {
    const framework = await loadFramework(language);
    expect(framework.language).toBe(language);
    expect(framework.habits.map((habit) => habit.id)).toEqual(HABIT_FRAMEWORK_CATALOG.map((habit) => habit.id));
    expect(framework.stages.map((stage) => stage.id)).toEqual(VIETNAMESE_FRAMEWORK.stages.map((stage) => stage.id));
    const first = framework.habits[0]!;
    expect(first.name).not.toBe(HABIT_FRAMEWORK_CATALOG[0]!.name);
    expect(first.activities.length).toBe(HABIT_FRAMEWORK_CATALOG[0]!.activities.length);
    expect(first.conceptTags).toEqual(HABIT_FRAMEWORK_CATALOG[0]!.conceptTags);
  });

  it('keeps Vietnamese for Vietnamese readers, uses a translation where one exists, and English elsewhere', () => {
    expect(frameworkLanguageFor('vi')).toBe('vi');
    expect(frameworkLanguageFor('ko')).toBe('ko');
    for (const language of readsEnglish) expect(frameworkLanguageFor(language)).toBe('en');
  });

  it.each(readsEnglish)('serves the English text to a reader of %s until that language is translated', async (language) => {
    expect((await loadFramework(language)).language).toBe('en');
  });

  it('loads a language once and reuses it', async () => {
    expect(await loadFramework('en')).toBe(await loadFramework('en'));
  });

  it.each(translated)('builds a %s activity that keeps the framework link and writes the adult guidance label in that language', async (language) => {
    const framework = await loadFramework(language);
    const habit = framework.habits[0]!;
    const activity = createActivityFromFrameworkHabit(habit, null, language);
    expect(activity.title).toBe(habit.name);
    expect(activity.frameworkHabitId).toBe(habit.id);
    expect(activity.instructions).toContain(habit.parentGuidance);
    expect(activity.instructions).not.toContain('Người lớn đồng hành');
  });

  it('keeps the Vietnamese activity text unchanged by default', () => {
    const activity = createActivityFromFrameworkHabit(HABIT_FRAMEWORK_CATALOG[0]!, null);
    expect(activity.instructions).toContain('Người lớn đồng hành: ');
  });
});
