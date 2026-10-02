import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { describe, expect, it } from 'vitest';

const guideDir = 'docs/huong-dan';
const files = readdirSync(guideDir).filter((name) => name.endsWith('.md')).sort();

function anchorsOf(file: string): Set<string> {
  const text = readFileSync(join(guideDir, file), 'utf8');
  return new Set([...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map((match) => match[1] as string));
}

function linksOf(file: string): string[] {
  const text = readFileSync(join(guideDir, file), 'utf8').replace(/```[\s\S]*?```/g, '');
  return [...text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)]
    .map((match) => match[1] as string)
    .filter((url) => !url.startsWith('http'));
}

describe('user guide', () => {
  it('has the index and every chapter it lists', () => {
    const index = readFileSync(join(guideDir, 'README.md'), 'utf8');
    for (const file of files.filter((name) => name !== 'README.md')) {
      expect(index, `${file} is listed in the index`).toContain(`(${file}`);
    }
  });

  it('keeps every internal link and anchor valid', () => {
    const anchors = new Map(files.map((file) => [file, anchorsOf(file)] as const));
    const broken: string[] = [];
    for (const file of files) {
      for (const url of linksOf(file)) {
        const [path = '', anchor] = url.split('#');
        const target = path ? normalize(join(dirname(join(guideDir, file)), path)) : join(guideDir, file);
        if (!existsSync(target)) {
          broken.push(`${file}: ${url} (missing file)`);
          continue;
        }
        const name = target.startsWith(`${guideDir}/`) ? target.slice(guideDir.length + 1) : null;
        if (anchor && name && name.endsWith('.md') && !anchors.get(name)?.has(anchor)) {
          broken.push(`${file}: ${url} (missing anchor)`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('links each chapter to the one before and after it', () => {
    const chapters = files.filter((name) => /^\d\d-/.test(name));
    chapters.forEach((file, index) => {
      const next = chapters[index + 1];
      if (next) expect(linksOf(file), `${file} points to ${next}`).toContain(next);
    });
  });
});
