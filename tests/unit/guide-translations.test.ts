import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildGuide } from '../../scripts/build-user-guide.mjs';
import { GUIDE_TRANSLATIONS, guideLocaleFor } from '@/lib/guide/guide-locale';
import { guideChapterSchema, type GuideChapter } from '@/lib/guide/guide-types';

const sourceDir = 'docs/huong-dan';
const i18nDir = join(sourceDir, 'i18n');
const translated = existsSync(i18nDir) ? readdirSync(i18nDir).filter((name) => /^[a-z]{2}$/.test(name)).sort() : [];

async function chaptersOf(prefix: string): Promise<Map<string, GuideChapter>> {
  const built = (await buildGuide()) as Map<string, string>;
  const chapters = new Map<string, GuideChapter>();
  for (const [name, content] of built) {
    if (!name.startsWith(prefix) || name.slice(prefix.length).includes('/') || name.endsWith('index.json')) continue;
    const chapter = guideChapterSchema.parse(JSON.parse(content));
    chapters.set(chapter.slug, chapter);
  }
  return chapters;
}

const count = (text: string, pattern: RegExp): number => (text.match(pattern) ?? []).length;
const hrefs = (html: string): string[] => [...html.matchAll(/href="(\/docs\/[a-z0-9#-]+)"/g)].map((match) => match[1] as string).sort();
const VIETNAMESE_ONLY = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/gi;

describe('guide translations', () => {
  it('are listed exactly as they exist in the sources and in the built files', () => {
    expect([...GUIDE_TRANSLATIONS].sort()).toEqual(translated);
    const builtDirs = readdirSync('public/guide', { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    expect(builtDirs).toEqual(translated);
  });

  it('give a reader their own language, English when there is no translation, and Vietnamese for Vietnamese', () => {
    expect(guideLocaleFor('vi')).toBe('vi');
    for (const code of translated) expect(guideLocaleFor(code as never)).toBe(code);
    expect(guideLocaleFor('xx' as never)).toBe(translated.includes('en') ? 'en' : 'vi');
  });

  for (const code of translated) {
    describe(code, () => {
      it('has every published chapter, with the same sections, links and tables as the Vietnamese source', async () => {
        const source = await chaptersOf('');
        const target = await chaptersOf(`${code}/`);
        expect([...target.keys()].sort()).toEqual([...source.keys()].sort());
        for (const [slug, original] of source) {
          const copy = target.get(slug) as GuideChapter;
          expect(copy.sections.map((section) => [section.id, section.level]), `${code}/${slug} sections`).toEqual(original.sections.map((section) => [section.id, section.level]));
          const html = (chapter: GuideChapter) => chapter.sections.map((section) => section.html).join('\n');
          expect(hrefs(html(copy)), `${code}/${slug} links`).toEqual(hrefs(html(original)));
          for (const [label, pattern] of [['table rows', /<tr>/g], ['list items', /<li>/g], ['code blocks', /<pre>/g]] as const) {
            expect(count(html(copy), pattern), `${code}/${slug} ${label}`).toBe(count(html(original), pattern));
          }
        }
      });

      it('is really translated: almost no Vietnamese-only letters are left', async () => {
        if (code === 'vi') return;
        const target = await chaptersOf(`${code}/`);
        for (const [slug, chapter] of target) {
          const text = chapter.sections.map((section) => section.text).join(' ');
          const share = count(text, VIETNAMESE_ONLY) / Math.max(text.length, 1);
          expect(share, `${code}/${slug}`).toBeLessThan(0.01);
        }
      });
    });
  }

  it('never carry operator-only text or markers', async () => {
    const built = (await buildGuide()) as Map<string, string>;
    for (const [name, content] of built) {
      expect(content, name).not.toContain('<!--');
      expect(content, name).not.toContain('repository-only');
      expect(content, name).not.toMatch(/emailCodeLogin/);
    }
  });
});
