import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = new URL('../../../src/lib/thinking-games/', import.meta.url).pathname;

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'server') return [];
      return files(path);
    }
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

describe('client-safe boundary', () => {
  it('does not import server modules, node builtins or Next server APIs', () => {
    for (const file of files(root)) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/from ['"]server-only['"]/);
      expect(source).not.toMatch(/from ['"]node:/);
      expect(source).not.toMatch(/from ['"]next\//);
      expect(source).not.toMatch(/from ['"][^'"]*server\//);
    }
  });

  it('does not read the clock or unseeded randomness in engine code', () => {
    for (const file of files(root)) {
      const source = readFileSync(file, 'utf8');
      expect(source).not.toMatch(/Date\.now\s*\(/);
      expect(source).not.toMatch(/Math\.random\s*\(/);
    }
  });

  it('exports no server response module from the barrel', () => {
    const barrel = readFileSync(join(root, 'index.ts'), 'utf8');
    expect(barrel).not.toMatch(/server/);
  });
});
