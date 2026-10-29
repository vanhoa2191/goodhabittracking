#!/usr/bin/env node
/**
 * Writes the guarded production import for the release-365-v2 serving manifest as independently atomic batches.
 * Each batch inserts missing rows only (never overwrites), then fails the transaction unless every row of the batch
 * reads back identical. The rows use the same projections the serving code rebuilds items from
 * (public payload + grading payload), and the generator proves that round trip before writing anything.
 *
 * Usage: node scripts/build-thinking-games-release-v2-import-sql.mjs --output-dir <dir>
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { build } from 'esbuild';

const root = resolve(new URL('..', import.meta.url).pathname);
const dirIndex = process.argv.indexOf('--output-dir');
if (dirIndex < 0 || !process.argv[dirIndex + 1]) throw new Error('--output-dir <dir> is required');
const outputDir = resolve(process.argv[dirIndex + 1]);
const BATCH_SIZE = 100;

const manifestPath = join(root, 'content/thinking-games/manifests/release-365-v2.json');
const raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);
const digest = createHash('sha256').update(raw).digest('hex');

const temp = mkdtempSync(join(tmpdir(), 'thinking-games-import-'));
const outfile = join(temp, 'engine.mjs');
await build({ entryPoints: [join(root, 'src/lib/thinking-games/index.ts')], bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent' });
const engine = await import(pathToFileURL(outfile).href);
rmSync(temp, { recursive: true, force: true });

const rows = manifest.items.map((item) => ({
  id: item.id,
  content_version: item.contentVersion,
  day_index: item.dayIndex,
  slot_type: item.slotType,
  age_track: item.ageTrack,
  locale: item.locale,
  game_type_id: item.gameTypeId,
  rule_variant_id: item.ruleVariantId,
  status: item.status,
  checker_id: item.validSolutionPredicate,
  public_payload: { ...engine.toPublicPuzzle(item), source: item.source, editorial: item.editorial },
  grading_payload: engine.toGradingData(item),
  fingerprint: item.fingerprint,
}));

// Same reconstruction as src/lib/thinking-games/server/content-row.ts.
for (const [index, row] of rows.entries()) {
  const rebuilt = engine.parsePuzzleItem({
    ...row.public_payload,
    schemaVersion: row.public_payload.schemaVersion ?? 1,
    contentVersion: row.content_version, id: row.id, dayIndex: row.day_index, slotType: row.slot_type,
    ageTrack: row.age_track, locale: row.locale, gameTypeId: row.game_type_id, ruleVariantId: row.rule_variant_id,
    explanation: row.grading_payload.explanation, solution: row.grading_payload.solution,
    validSolutionPredicate: row.grading_payload.validSolutionPredicate,
    status: row.status, fingerprint: row.fingerprint, source: row.public_payload.source ?? null, editorial: row.public_payload.editorial ?? null,
  });
  if (!isDeepStrictEqual(JSON.parse(JSON.stringify(rebuilt)), manifest.items[index])) {
    throw new Error(`row ${row.id} does not round-trip to the manifest item`);
  }
  if (JSON.stringify(row.public_payload).includes('"solution"')) throw new Error(`row ${row.id} leaks a solution in its public payload`);
}

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `$j$${JSON.stringify(value)}$j$::jsonb`;
const values = (row) => `(${[
  quote(row.id), quote(row.content_version), row.day_index, quote(row.slot_type), quote(row.age_track), quote(row.locale),
  quote(row.game_type_id), quote(row.rule_variant_id), quote(row.status), quote(row.checker_id),
  json(row.public_payload), json(row.grading_payload), quote(row.fingerprint),
].join(', ')})`;

mkdirSync(outputDir, { recursive: true });
const batches = [];
for (let start = 0; start < rows.length; start += BATCH_SIZE) batches.push(rows.slice(start, start + BATCH_SIZE));
batches.forEach((batch, index) => {
  const name = `batch-${String(index + 1).padStart(2, '0')}-of-${String(batches.length).padStart(2, '0')}.sql`;
  const sql = `-- release-365-v2 content import ${index + 1}/${batches.length}; manifest sha256 ${digest}
-- Inserts missing rows only and aborts unless every row of this batch reads back identical.
begin;
create temp table release_import_batch on commit drop as
select * from (values
${batch.map(values).join(',\n')}
) as incoming(id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id, status, checker_id, public_payload, grading_payload, fingerprint);
insert into public.thinking_game_content (id, content_version, day_index, slot_type, age_track, locale, game_type_id, rule_variant_id, status, checker_id, public_payload, grading_payload, fingerprint)
select * from release_import_batch
on conflict (id) do nothing;
do $verify$
declare mismatched integer;
begin
  select count(*) into mismatched
  from release_import_batch i
  left join public.thinking_game_content c on c.id = i.id
  where c.id is null
     or (c.content_version, c.day_index, c.slot_type, c.age_track, c.locale, c.game_type_id, c.rule_variant_id, c.status, c.checker_id, c.public_payload, c.grading_payload, c.fingerprint)
        is distinct from
        (i.content_version, i.day_index, i.slot_type, i.age_track, i.locale, i.game_type_id, i.rule_variant_id, i.status, i.checker_id, i.public_payload, i.grading_payload, i.fingerprint);
  if mismatched <> 0 then
    raise exception 'release-365-v2 import batch ${index + 1} mismatched % rows', mismatched;
  end if;
end $verify$;
commit;
`;
  writeFileSync(join(outputDir, name), sql);
});

writeFileSync(join(outputDir, 'verify-after-import.sql'), `-- Run after all batches. Expect: rows = 1460, per-track 730, per-slot 365, no other version rows touched.
select content_version, age_track, slot_type, count(*) as rows, min(day_index) as first_day, max(day_index) as last_day
from public.thinking_game_content where content_version = 'release-365-v2'
group by 1, 2, 3 order by 2, 3;
`);
console.log(JSON.stringify({ outputDir, batches: batches.length, rows: rows.length, manifestSha256: digest }));
