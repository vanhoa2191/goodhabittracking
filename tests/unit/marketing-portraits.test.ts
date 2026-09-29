import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPortraitGuide, portraitNames, summitId } from '../../apps/marketing/portraits.mjs';

describe('marketing portrait guide', () => {
  const guide = buildPortraitGuide();

  it('lists the sixteen portraits of the approved framework with the summit last', () => {
    expect(guide.portraits).toHaveLength(16);
    expect(guide.portraits.map((portrait) => portrait.id)).toEqual(Object.keys(portraitNames));
    expect(guide.portraits.at(-1)).toMatchObject({ id: summitId, name: 'Làm Người Thành Công' });
    expect(guide.habitCount).toBe(47);
    expect(guide.stageCount).toBe(5);
  });

  it('gives every portrait a real habit from the framework instead of invented copy', async () => {
    const data = JSON.parse(await readFile(join(process.cwd(), 'src', 'data', 'habit-framework-v1.vi.json'), 'utf8'));
    const habitNames = new Set<string>(data.habits.map((habit: { name: string }) => habit.name));
    for (const portrait of guide.portraits) {
      expect(portrait.habitCount, portrait.id).toBeGreaterThan(0);
      expect(portrait.example, portrait.id).not.toBeNull();
      expect(habitNames.has(portrait.example!.name), portrait.id).toBe(true);
      expect(portrait.example!.meaning.length, portrait.id).toBeGreaterThan(10);
    }
  });

  it('knows every portrait id the framework data links to', async () => {
    const data = JSON.parse(await readFile(join(process.cwd(), 'src', 'data', 'habit-framework-v1.vi.json'), 'utf8'));
    const linked = new Set<string>();
    for (const habit of data.habits as { conceptTags: string[] }[]) {
      for (const tag of habit.conceptTags) {
        const match = /^#ChânDung:(CD-\d{2})-/u.exec(tag);
        if (match) linked.add(match[1]);
      }
    }
    for (const id of linked) expect(Object.keys(portraitNames)).toContain(id);
  });
});
