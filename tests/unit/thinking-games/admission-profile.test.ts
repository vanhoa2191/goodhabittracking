import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLIENT_DIRS = ['src/app', 'src/components', 'src/lib/store', 'src/lib/i18n'];
const FORBIDDEN = ['internal_pilot', 'contentProfile', 'resolveInternalPilotAssignment', 'allowPilotProfile'];

function sourceFiles(dir: string): string[] {
  const entries = readdirSync(join(process.cwd(), dir), { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) ? [path] : [];
  });
}

describe('client admission boundary', () => {
  it('does not let client-facing modules select the permissive pilot profile', () => {
    const violations = CLIENT_DIRS.flatMap(sourceFiles).flatMap((file) => {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      return FORBIDDEN.filter((token) => source.includes(token)).map((token) => `${file}: ${token}`);
    });
    expect(violations).toEqual([]);
  });
});
