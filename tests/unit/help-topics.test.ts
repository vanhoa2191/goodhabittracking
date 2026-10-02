import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HELP_TOPIC_IDS } from '@/lib/guide/help-topic-id';
import { HELP_TOPICS } from '@/lib/guide/help-topics';
import { guideChapterSchema } from '@/lib/guide/guide-types';
import { getGuideCopy } from '@/lib/i18n/guide-copy';

const guideDir = 'public/guide';
const chapters = new Map(readdirSync(guideDir)
  .filter((name) => name.endsWith('.json') && name !== 'index.json')
  .map((name) => {
    const chapter = guideChapterSchema.parse(JSON.parse(readFileSync(join(guideDir, name), 'utf8')));
    return [chapter.slug, new Set(chapter.sections.map((section) => section.id))] as const;
  }));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.tsx$/.test(name) ? [path] : [];
  });
}

const usedTopics = new Map<string, number>();
for (const file of sourceFiles('src/components')) {
  for (const match of readFileSync(file, 'utf8').matchAll(/<HelpTip topic="([^"]+)"/g)) {
    const id = match[1] as string;
    usedTopics.set(id, (usedTopics.get(id) ?? 0) + 1);
  }
}

describe('help topics', () => {
  it('have a text for every id and no text without an id', () => {
    expect(Object.keys(HELP_TOPICS).sort()).toEqual([...HELP_TOPIC_IDS].sort());
  });

  it('open a guide section that exists', () => {
    for (const [id, topic] of Object.entries(HELP_TOPICS)) {
      expect(chapters.has(topic.chapter), `${id}: chapter ${topic.chapter}`).toBe(true);
      expect(chapters.get(topic.chapter)?.has(topic.anchor), `${id}: ${topic.chapter}#${topic.anchor}`).toBe(true);
    }
  });

  it('read well in Vietnamese and English: a title and a short explanation', () => {
    for (const [id, topic] of Object.entries(HELP_TOPICS)) {
      for (const language of ['vi', 'en'] as const) {
        const { title, text } = topic[language];
        expect(title.trim().length, `${id} ${language} title`).toBeGreaterThan(2);
        expect(title.length, `${id} ${language} title`).toBeLessThanOrEqual(40);
        expect(text.trim().length, `${id} ${language} text`).toBeGreaterThan(20);
        expect(text.length, `${id} ${language} text is short enough for a tip`).toBeLessThanOrEqual(260);
      }
    }
  });

  it('are all shown somewhere, and every ? in the screens names a real topic', () => {
    const known = new Set<string>(HELP_TOPIC_IDS);
    expect([...usedTopics.keys()].filter((id) => !known.has(id))).toEqual([]);
    expect(HELP_TOPIC_IDS.filter((id) => !usedTopics.has(id))).toEqual([]);
  });

  it('are also covered by the quick links on the guide home', () => {
    for (const language of ['vi', 'en'] as const) {
      for (const [label, slug, anchor] of getGuideCopy(language).tasks) {
        expect(chapters.get(slug)?.has(anchor), `${language}: ${label}`).toBe(true);
      }
    }
  });
});
