import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { build } from 'esbuild';

const root = resolve(new URL('..', import.meta.url).pathname);
const csvPath = join(root, 'docs/research/2026-10-17-daily-thinking-games-365.csv');
const pilotPath = join(root, 'content/thinking-games/pilot/pilot-manifest-v1.json');
const releasePath = join(root, 'content/thinking-games/manifests/release-365-v1.json');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }
  return rows.filter((entry) => entry.length > 1);
}

function editorialRows() {
  const [header, ...rows] = parseCsv(readFileSync(csvPath, 'utf8'));
  const index = new Map((header ?? []).map((name, position) => [name.replace(/^\uFEFF/, ''), position]));
  return rows.map((row) => ({
    day: Number(row[index.get('day')]),
    mainId: row[index.get('main_id')],
    mainTypeId: row[index.get('main_type_id')],
    mainSkill: row[index.get('main_skill')],
    mainRuleVariant: row[index.get('main_rule_variant')],
    bonusId: row[index.get('bonus_id')],
    bonusTypeId: row[index.get('bonus_type_id')],
    bonusSkill: row[index.get('bonus_skill')],
    bonusRuleVariant: row[index.get('bonus_rule_variant')],
    mainStatus: row[index.get('main_status')],
    bonusStatus: row[index.get('bonus_status')],
  }));
}

function summarize(label, result) {
  if (result.ok) {
    console.log(`${label}: PASS ${JSON.stringify(result.metrics)}`);
    return;
  }
  console.log(`${label}: FAIL ${JSON.stringify(result.errors)}`);
}

const temp = mkdtempSync(join(tmpdir(), 'thinking-games-check-'));
try {
  const outfile = join(temp, 'manifest.mjs');
  await build({
    entryPoints: [join(root, 'src/lib/thinking-games/manifest.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
  });
  const validator = await import(pathToFileURL(outfile).href);
  const rows = editorialRows();
  const editorial = validator.validateEditorialRows(rows);
  summarize('editorial', editorial);
  const pilot = JSON.parse(readFileSync(pilotPath, 'utf8'));
  const release = JSON.parse(readFileSync(releasePath, 'utf8'));
  const pilotResult = validator.validateManifest(pilot, { profile: 'pilot' });
  summarize('pilot', pilotResult);
  const pilotAsRelease = validator.validateManifest(pilot, { profile: 'release' });
  summarize('pilot-as-release', pilotAsRelease);
  const releaseResult = validator.validateManifest(release, { profile: 'release' });
  summarize('release', releaseResult);
  const releasePlaceholderResult = validator.validateManifest({
    ...release,
    items: [],
    editorialApproval: null,
    status: 'not_ready',
  }, { profile: 'release' });
  summarize('release-placeholder', releasePlaceholderResult);

  const expected = editorial.ok
    && pilotResult.ok
    && !pilotAsRelease.ok
    && releaseResult.ok
    && !releasePlaceholderResult.ok
    && releasePlaceholderResult.errors.some((entry) => entry.code === 'release_item_count');
  if (!expected) {
    console.error('content check did not match the expected profile gates');
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
} finally {
  rmSync(temp, { recursive: true, force: true });
}
