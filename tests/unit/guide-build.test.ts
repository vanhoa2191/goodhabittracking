import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildGuide } from '../../scripts/build-user-guide.mjs';
import { guideChapterSchema, guideIndexSchema } from '@/lib/guide/guide-types';

const outputDir = 'public/guide';

async function generated(): Promise<Map<string, string>> {
  return buildGuide() as Promise<Map<string, string>>;
}

describe('in-app guide files', () => {
  it('are exactly what the Markdown guide builds (run `npm run guide:build` after editing docs/huong-dan)', async () => {
    const built = await generated();
    const committed = new Map(readdirSync(outputDir).filter((name) => name.endsWith('.json')).map((name) => [name, readFileSync(join(outputDir, name), 'utf8')] as const));
    expect([...committed.keys()].sort()).toEqual([...built.keys()].sort());
    for (const [name, content] of built) expect(committed.get(name), name).toBe(content);
  });

  it('describe every published chapter and match the schema', async () => {
    const built = await generated();
    const index = guideIndexSchema.parse(JSON.parse(built.get('index.json') as string));
    expect(index.map((entry) => entry.slug)).toEqual([
      'tong-quan', 'bat-dau', 'man-hinh-be', 'hom-nay-va-duyet-viec', 'thiet-ke-thoi-quen', 'gia-dinh-va-cai-dat',
      'khoa-hoc-thoi-quen', 'goi-va-thanh-toan', 'gioi-thieu-ban-be', 'bao-mat-va-rieng-tu', 'ban-do-lien-ket', 'thuat-ngu',
    ]);
    for (const entry of index) {
      const chapter = guideChapterSchema.parse(JSON.parse(built.get(`${entry.slug}.json`) as string));
      expect(chapter.sections.length, entry.slug).toBeGreaterThan(0);
      const ids = chapter.sections.map((section) => section.id);
      expect(new Set(ids).size, `${entry.slug} has unique section ids`).toBe(ids.length);
    }
  });

  it('keep the operator chapters and operator-only notes out', async () => {
    const built = await generated();
    expect(built.has('quan-tri-va-van-hanh.json')).toBe(false);
    expect(built.has('website-va-trang-cong-khai.json')).toBe(false);
    const everything = [...built.values()].join('\n');
    expect(everything).not.toContain('repository-only');
    expect(everything).not.toContain('/docs/quan-tri');
    expect(everything).not.toContain('Quy trình nội bộ');
    expect(everything).not.toContain('<!--');
    // The overview lists what is on or off; release flags and who can change them stay out.
    expect(everything).not.toContain('emailCodeLogin');
    expect(everything).not.toMatch(/người vận hành đổi|biến cấu hình|cờ phát hành/i);
    expect(everything).not.toMatch(/\.md[)#"]/);
  });

  it('only link to guide chapters and sections that exist', async () => {
    const built = await generated();
    const sections = new Map<string, Set<string>>();
    for (const [name, content] of built) {
      if (name === 'index.json') continue;
      const chapter = guideChapterSchema.parse(JSON.parse(content));
      sections.set(chapter.slug, new Set(chapter.sections.map((section) => section.id)));
    }
    const broken: string[] = [];
    for (const [name, content] of built) {
      if (name === 'index.json') continue;
      for (const match of content.matchAll(/href=\\"\/docs\/([a-z0-9-]+)(?:#([a-z0-9-]+))?\\"/g)) {
        const [, slug, anchor] = match as unknown as [string, string, string | undefined];
        if (!sections.has(slug)) broken.push(`${name}: /docs/${slug}`);
        else if (anchor && !sections.get(slug)?.has(anchor)) broken.push(`${name}: /docs/${slug}#${anchor}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('escape text before adding markup', async () => {
    const built = await generated();
    for (const [name, content] of built) {
      if (name === 'index.json') continue;
      const chapter = guideChapterSchema.parse(JSON.parse(content));
      for (const section of chapter.sections) {
        expect(section.html, `${name}#${section.id}`).not.toMatch(/<script|<iframe|\son[a-z]+=|javascript:/i);
      }
    }
  });
});
