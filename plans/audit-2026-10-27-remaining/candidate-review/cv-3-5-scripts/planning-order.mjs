// Counts engine-accepted orderings for every planning-command-order item in the age_3_5 track (3! permutations each).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine, V2_CANDIDATE_ROOT } from '../../../../scripts/generate-thinking-games-candidates-v2.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2] ?? join(here, 'cv-3-5-planning-order.json');
const items = JSON.parse(readFileSync(join(V2_CANDIDATE_ROOT, 'candidate-manifest-v2.json'), 'utf8')).items
  .filter((x) => x.ageTrack === 'age_3_5' && x.boardData.kind === 'planning-command-order');
const loaded = await loadEngine();
const engine = loaded.engine;
const perm = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => perm([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p])));
const dist = {};
const bad = [];
for (const it of items) {
  const ids = it.boardData.commands.map((c) => c.id);
  const ok = perm(ids).filter((p) => { const r = engine.checkAnswer(it, p); return r.ok && r.correct; });
  dist[ok.length] = (dist[ok.length] ?? 0) + 1;
  if (ok.length !== 1) bad.push({ id: it.id, accepted: ok.map((p) => p.join('>')) });
}
writeFileSync(outPath, JSON.stringify({ items: items.length, acceptedOrderingHistogram: dist, bad }, null, 2));
console.log(JSON.stringify({ items: items.length, acceptedOrderingHistogram: dist, bad: bad.slice(0, 10) }));
loaded.cleanup();
