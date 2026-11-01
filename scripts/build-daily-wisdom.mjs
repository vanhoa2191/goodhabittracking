#!/usr/bin/env node
/**
 * Builds content/daily-wisdom/quotes-vi.json from the curated source files in content/daily-wisdom/source/.
 * Line format: kind|months|author|text   (kind tn|cd|dn|ch, months "3" or "12,1,2" or empty for any month)
 * Verse lines inside one saying are separated by " / ". The order is a deterministic shuffle so neighbouring days
 * mix kinds and themes. Run with --check to verify the committed JSON is up to date.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const sourceDir = join(root, 'content/daily-wisdom/source');
const outputPath = join(root, 'content/daily-wisdom/quotes-vi.json');
const KINDS = new Set(['tn', 'cd', 'dn', 'ch']);
const normalize = (text) => text.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const seen = new Map();
const quotes = [];
for (const file of readdirSync(sourceDir).filter((name) => name.endsWith('.txt')).sort()) {
  readFileSync(join(sourceDir, file), 'utf8').split('\n').forEach((line, index) => {
    if (!line.trim() || line.startsWith('#')) return;
    const [kind, months, author, ...rest] = line.split('|');
    const text = rest.join('|').trim().replace(/\s+/g, ' ');
    const where = `${file}:${index + 1}`;
    if (!KINDS.has(kind)) throw new Error(`${where}: unknown kind "${kind}"`);
    if (kind === 'dn' && !author.trim()) throw new Error(`${where}: danh ngôn needs an author`);
    if (text.length < 8 || text.length > 330) throw new Error(`${where}: text length ${text.length}`);
    const monthList = months.trim() ? months.split(',').map(Number) : [];
    if (monthList.some((month) => !Number.isInteger(month) || month < 1 || month > 12)) throw new Error(`${where}: bad months "${months}"`);
    const key = normalize(text);
    if (seen.has(key)) return; // exact duplicates across files are dropped, first one wins
    seen.set(key, where);
    const entry = { k: kind, t: /[.!?…]$/.test(text) ? text : `${text}.` };
    if (author.trim()) entry.a = author.trim();
    if (monthList.length > 0) entry.m = monthList;
    quotes.push(entry);
  });
}

// Deterministic shuffle: order by a hash of the text, so adding a line never reshuffles the others.
quotes.sort((a, b) => {
  const ha = createHash('sha256').update(a.t).digest('hex');
  const hb = createHash('sha256').update(b.t).digest('hex');
  return ha < hb ? -1 : ha > hb ? 1 : 0;
});

const json = `${JSON.stringify(quotes)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(outputPath, 'utf8') !== json) {
    console.error('content/daily-wisdom/quotes-vi.json is out of date; run node scripts/build-daily-wisdom.mjs');
    process.exit(1);
  }
} else {
  writeFileSync(outputPath, json);
}
const byKind = Object.fromEntries([...KINDS].map((kind) => [kind, quotes.filter((quote) => quote.k === kind).length]));
const byMonth = Array.from({ length: 12 }, (_, i) => quotes.filter((quote) => !quote.m || quote.m.includes(i + 1)).length);
console.log(JSON.stringify({ total: quotes.length, byKind, eligiblePerMonth: byMonth }));
