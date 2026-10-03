import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const componentsRoot = join(process.cwd(), 'src', 'components');

// A ternary that picks between two string literals on the language shows English to every
// language but one. Visible text and aria labels belong in a Record<Language, ...> copy file.
const STRING = String.raw`(?:'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\x60(?:[^\x60\\]|\\.)*\x60)`;
const TERNARY = new RegExp(
  String.raw`\b(?:language|lang|locale)\s*(?:===|!==)\s*'(?:vi|en)'\s*\?\s*${STRING}\s*:\s*${STRING}`,
  'g',
);

// Files still allowed to carry such a ternary, each with the reason it is not a copy bug here.
const ALLOWED: Readonly<Record<string, string>> = {
  'help/HelpTip.tsx': 'picks the vi or en help content; translating the help content is separate work',
  'ParentJourneysTab.tsx': 'picks the vi or en stage data; translating the stage content is separate work',
  'AffiliateCard.tsx': 'chooses a number and date locale and a currency symbol, not a sentence',
  'public/PricingContent.tsx': 'chooses a price market code, not text',
};

function listTsx(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listTsx(path);
    return entry.name.endsWith('.tsx') ? [path] : [];
  });
}

function findTernaries(path: string): string[] {
  const source = readFileSync(path, 'utf8');
  return [...source.matchAll(TERNARY)].map((match) => {
    const line = source.slice(0, match.index).split('\n').length;
    return `${relative(process.cwd(), path)}:${line}  ${match[0].replace(/\s+/g, ' ').slice(0, 90)}`;
  });
}

describe('hard-coded two-language ternaries in components', () => {
  const files = listTsx(componentsRoot);
  const keyOf = (path: string) => relative(componentsRoot, path);

  it('finds the ternary shape it is meant to forbid', () => {
    expect("x = language === 'vi' ? 'Xin chào' : 'Hello'").toMatch(TERNARY);
    TERNARY.lastIndex = 0;
    expect("x = language === 'vi' ? `Đã lưu ${a}` : `Saved ${a}`").toMatch(TERNARY);
    TERNARY.lastIndex = 0;
    expect("x = language === 'vi' ? copy.a : copy.b").not.toMatch(TERNARY);
    TERNARY.lastIndex = 0;
  });

  it('leaves no unlisted component choosing between two literal strings by language', () => {
    const offenders = files
      .filter((path) => !(keyOf(path) in ALLOWED))
      .flatMap(findTernaries);
    expect(offenders, `Move these strings into a Record<Language, ...> copy file:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('keeps the allowlist honest: every listed file still has the ternary', () => {
    const stale = Object.keys(ALLOWED).filter((key) => findTernaries(join(componentsRoot, key)).length === 0);
    expect(stale, `Remove from ALLOWED: ${stale.join(', ')}`).toEqual([]);
  });
});
