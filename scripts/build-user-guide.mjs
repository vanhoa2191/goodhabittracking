// Turns the Markdown user guide (docs/huong-dan) into the static files the app serves under /guide.
//
//   npm run guide:build   writes public/guide/*.json
//   npm run guide:check   fails when the committed files are out of date
//
// The same Markdown is the single source for the repository docs and for the in-app guide. Only the
// chapters meant for parents are published; operator chapters and repository-only links are dropped here.
// Text is always escaped before any markup is added, so the HTML in the output is safe to inject.

import { readFile, readdir, writeFile, mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderInline } from '../apps/marketing/blog.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const SOURCE_DIR = join(root, 'docs/huong-dan');
export const OUTPUT_DIR = join(root, 'public/guide');

/** Chapters written for the operator or about the public website; they stay in the repository docs only. */
const REPOSITORY_ONLY = new Set(['10', '11']);
export class GuideError extends Error {}

const slugOf = (fileName) => (fileName === 'README.md' ? 'tong-quan' : fileName.replace(/^\d+-/, '').replace(/\.md$/, ''));
const numberOf = (fileName) => (/^(\d+)-/.exec(fileName)?.[1] ?? null);

function chapterFiles(fileNames) {
  return fileNames.filter((name) => name.endsWith('.md')).sort();
}

const REPOSITORY_ONLY_LINK = '#repository-only';

/**
 * `07-goi-va-thanh-toan.md#coupon` → `/docs/goi-va-thanh-toan#coupon`. A link to a chapter that is not published is
 * marked, so list items and table rows that exist only to point there can be dropped; other repository links keep their text.
 */
function rewriteLinks(markdown, published) {
  return markdown.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (whole, label, url) => {
    if (url.startsWith('#') || /^https?:/.test(url)) return whole;
    const [path, anchor] = url.split('#');
    const name = path.split('/').pop();
    if (path.startsWith('..')) return label;
    if (!published.has(name)) return /^\d+-/.test(name) ? `[${label}](${REPOSITORY_ONLY_LINK})` : label;
    return `[${label}](/docs/${slugOf(name)}${anchor ? `#${anchor}` : ''})`;
  });
}

/** Text between these markers is for people who run the product; the in-app guide leaves it out. */
const withoutOperatorText = (markdown) => markdown.replace(/<!--op-->[\s\S]*?<!--\/op-->/g, '');
const pointsToRepositoryOnly = (text) => text.includes(`](${REPOSITORY_ONLY_LINK})`);
const flattenRepositoryLinks = (html) => html.replace(/<a href="#repository-only">([^<]*)<\/a>/g, '$1');

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());

function renderTable(rows) {
  const [head, , ...body] = rows;
  const width = cells(head).length;
  const render = (tag) => (row) => {
    const values = cells(row);
    if (values.length !== width) throw new GuideError(`Table row has ${values.length} cells, expected ${width}: ${row.slice(0, 80)}`);
    return `<tr>${values.map((value) => `<${tag}>${renderInline(value)}</${tag}>`).join('')}</tr>`;
  };
  return `<div class="guide-table"><table><thead>${render('th')(head)}</thead><tbody>${body.map(render('td')).join('')}</tbody></table></div>`;
}

const plain = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

/** Splits one chapter into sections that start at each `<a id="…"></a>` anchor, with the heading that follows it. */
function parseChapter(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const sections = [];
  let title = '';
  let current = { id: 'dau-trang', level: 0, title: '', blocks: [] };
  let skipping = false;
  let index = 0;

  const flush = () => {
    if (current.blocks.length > 0 || current.title) sections.push(current);
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    const anchor = /^<a id="([a-z0-9-]+)"><\/a>\s*$/.exec(line.trim());
    if (anchor) {
      flush();
      current = { id: anchor[1], level: 0, title: '', blocks: [] };
      skipping = false;
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      if (level === 1) {
        title = text.replace(/^\d+\.\s*/, '');
      } else {
        if (current.title || current.level > 0 || current.blocks.length > 0 || current.id.startsWith('bo-qua-')) {
          flush();
          current = { id: `muc-${sections.length}`, level: 0, title: '', blocks: [] };
        }
        current.level = level;
        current.title = text;
        skipping = false;
      }
      index += 1;
      continue;
    }
    if (skipping) { index += 1; continue; }

    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const body = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) { body.push(lines[index]); index += 1; }
      index += 1;
      // Diagrams written for GitHub (Mermaid) cannot be drawn here; the text around them says the same.
      if (fence[1] !== 'mermaid') {
        const escaped = body.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        current.blocks.push(`<pre><code>${escaped}</code></pre>`);
      }
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (index < lines.length && /^\|/.test(lines[index])) { rows.push(lines[index]); index += 1; }
      const kept = [rows[0], rows[1], ...rows.slice(2).filter((row) => !pointsToRepositoryOnly(row))];
      if (kept.length > 2) current.blocks.push(renderTable(kept));
      continue;
    }
    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) { quote.push(lines[index].replace(/^>\s?/, '')); index += 1; }
      current.blocks.push(`<blockquote><p>${renderInline(quote.join(' '))}</p></blockquote>`);
      continue;
    }
    const listStart = /^(?:([-*])|(\d+)\.)\s+/.exec(line);
    if (listStart) {
      const ordered = Boolean(listStart[2]);
      const items = [];
      while (index < lines.length) {
        const match = lines[index].match(ordered ? /^\d+\.\s+(.*)$/ : /^[-*]\s+(.*)$/);
        if (!match) break;
        let text = match[1];
        index += 1;
        // A wrapped item continues on indented lines.
        while (index < lines.length && /^\s{2,}\S/.test(lines[index]) && !/^\s*([-*]|\d+\.)\s/.test(lines[index])) { text += ` ${lines[index].trim()}`; index += 1; }
        if (!pointsToRepositoryOnly(text)) items.push(`<li>${renderInline(text)}</li>`);
      }
      if (items.length > 0) current.blocks.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !/^(#{1,3}\s|>|\||```|<a id=|[-*]\s|\d+\.\s)/.test(lines[index])) { paragraph.push(lines[index].trim()); index += 1; }
    current.blocks.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
  }
  flush();

  return {
    title,
    sections: sections
      .filter((section) => !section.id.startsWith('bo-qua-'))
      .map((section) => {
        const body = section.blocks.join('\n');
        const heading = section.title ? `<h${section.level}>${renderInline(section.title)}</h${section.level}>` : '';
        const firstStrong = /<strong>([^<]+)<\/strong>/.exec(body)?.[1];
        return {
          id: section.id,
          level: section.level,
          title: section.title || (section.id === 'dau-trang' ? title : firstStrong || title),
          html: flattenRepositoryLinks(`${heading}${body ? `\n${body}` : ''}`),
          text: plain(`${section.title} ${body}`),
        };
      }),
  };
}

const OVERVIEW_TITLES = {
  vi: 'Tổng quan và danh mục tính năng',
  en: 'Overview and feature catalogue',
  fr: 'Vue d’ensemble et catalogue des fonctions',
  de: 'Überblick und Funktionsverzeichnis',
  it: 'Panoramica e catalogo delle funzioni',
  es: 'Resumen y catálogo de funciones',
  zh: '概览与功能目录',
  ja: '概要と機能一覧',
  ko: '개요 및 기능 목록',
};

/** Builds one language: `docs/huong-dan` for Vietnamese, `docs/huong-dan/i18n/<code>` for a translation (same file names and anchors). */
async function buildLocale(sourceDir, locale, prefix) {
  const names = chapterFiles(await readdir(sourceDir));
  const publishedNames = names.filter((name) => {
    const number = numberOf(name);
    return number === null || !REPOSITORY_ONLY.has(number);
  });
  const published = new Set(publishedNames);
  const summaries = new Map();
  const readme = await readFile(join(sourceDir, 'README.md'), 'utf8');
  for (const match of readme.matchAll(/^\d+\.\s+\[[^\]]+\]\(([^)]+\.md)\):\s*(.+)$/gm)) {
    summaries.set(match[1], match[2].replace(/\.$/, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'));
  }

  const files = new Map();
  const index = [];
  for (const name of publishedNames) {
    const source = await readFile(join(sourceDir, name), 'utf8');
    const overview = name === 'README.md';
    // The line that links a chapter to its neighbours is replaced by the app's own navigation.
    const parsed = parseChapter(rewriteLinks(withoutOperatorText(source).replace(/^\[←.*$/m, ''), published));
    if (!parsed.title || parsed.sections.length === 0) throw new GuideError(`${locale}/${name} has no title or no sections`);
    const ids = new Set();
    for (const section of parsed.sections) {
      if (ids.has(section.id)) throw new GuideError(`${locale}/${name} repeats the section id ${section.id}`);
      ids.add(section.id);
    }
    const slug = slugOf(name);
    const chapter = { slug, number: numberOf(name), title: overview ? (OVERVIEW_TITLES[locale] ?? parsed.title) : parsed.title, summary: summaries.get(name) ?? '', sections: parsed.sections };
    files.set(`${prefix}${slug}.json`, `${JSON.stringify(chapter)}\n`);
    index.push({
      slug,
      number: chapter.number,
      title: chapter.title,
      summary: chapter.summary,
      sections: parsed.sections.filter((section) => section.level > 0 || section.title).map(({ id, level, title }) => ({ id, level, title })),
    });
  }
  index.sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0));
  files.set(`${prefix}index.json`, `${JSON.stringify(index)}\n`);
  return files;
}

export async function buildGuide(sourceDir = SOURCE_DIR) {
  const files = await buildLocale(sourceDir, 'vi', '');
  const translations = await readdir(join(sourceDir, 'i18n')).catch(() => []);
  for (const code of translations.filter((name) => /^[a-z]{2}$/.test(name)).sort()) {
    for (const [name, content] of await buildLocale(join(sourceDir, 'i18n', code), code, `${code}/`)) files.set(name, content);
  }
  return files;
}

async function listJson(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const found = [];
  for (const entry of entries) {
    if (entry.isDirectory()) found.push(...await listJson(join(directory, entry.name), `${prefix}${entry.name}/`));
    else if (entry.name.endsWith('.json')) found.push(`${prefix}${entry.name}`);
  }
  return found;
}

async function main() {
  const check = process.argv.includes('--check');
  const files = await buildGuide();
  const present = await listJson(OUTPUT_DIR);
  if (check) {
    const stale = [];
    for (const [name, content] of files) {
      const existing = await readFile(join(OUTPUT_DIR, name), 'utf8').catch(() => null);
      if (existing !== content) stale.push(name);
    }
    for (const name of present) if (!files.has(name)) stale.push(name);
    if (stale.length > 0) {
      console.error(`The in-app guide is out of date (${stale.join(', ')}). Run: npm run guide:build`);
      process.exit(1);
    }
    console.log(`In-app guide is up to date (${files.size} files).`);
    return;
  }
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const name of present) if (!files.has(name)) await rm(join(OUTPUT_DIR, name));
  for (const [name, content] of files) {
    await mkdir(join(OUTPUT_DIR, name, '..'), { recursive: true });
    await writeFile(join(OUTPUT_DIR, name), content);
  }
  console.log(`Wrote ${files.size} guide files to public/guide.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
