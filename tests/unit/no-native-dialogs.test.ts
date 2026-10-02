import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return /\.(tsx?)$/.test(entry.name) ? [path] : [];
  });
}

// Native alert/confirm/prompt ignore the theme, the language and the text size, block the page and cannot be
// styled; the app has useConfirm and useNotice for these. A bare `confirm(` is only a native dialog in a file that
// does not define its own function of that name (the in-app one is `await confirm(` from useConfirm).
const NATIVE = /(?<![\w.])(?:window\.)?(?:alert|prompt)\(|window\.confirm\(/;
const BARE_CONFIRM = /(?<![\w.])confirm\(/;
const definesOwnConfirm = (source: string) => /(function confirm\b|const confirm\b|\bconfirm\s*[,}]|\{[^}]*\bconfirm\b[^}]*\}\s*=\s*use(?:Confirm|[A-Z]))/.test(source);

describe('components and the store', () => {
  it('never open a native browser dialog', () => {
    const offenders = [...sources('src/components'), ...sources('src/lib/store')].flatMap((file) => {
      const source = readFileSync(file, 'utf8');
      const bareIsNative = !definesOwnConfirm(source);
      return source.split('\n').flatMap((line, index) => {
        if (line.trimStart().startsWith('//')) return [];
        return NATIVE.test(line) || (bareIsNative && BARE_CONFIRM.test(line)) ? [`${file}:${index + 1}`] : [];
      });
    });
    expect(offenders).toEqual([]);
  });
});
