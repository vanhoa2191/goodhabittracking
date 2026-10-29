// Targeted engine probes for age_3_5: alternative valid shortest path, and find-break ambiguity geometry.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine, V2_CANDIDATE_ROOT } from '../../../../scripts/generate-thinking-games-candidates-v2.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2] ?? join(here, 'cv-3-5-probe.json');
const items = JSON.parse(readFileSync(join(V2_CANDIDATE_ROOT, 'candidate-manifest-v2.json'), 'utf8')).items.filter((x) => x.ageTrack === 'age_3_5');
const loaded = await loadEngine();
const engine = loaded.engine;
const out = {};

// 1. shortest-path items: engine should accept a different shortest path (up-first) and reject a 10-step detour
const sp = items.filter((x) => x.boardData.kind === 'path-planning' && x.boardData.shortestPathOnly);
const altShortest = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }];
const detour = [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }]; // 10 moves
out.shortestPath = {
  count: sp.length,
  altAccepted: sp.filter((x) => { const r = engine.checkAnswer(x, altShortest); return r.ok && r.correct; }).length,
  detourRejected: sp.filter((x) => { const r = engine.checkAnswer(x, detour); return !(r.ok && r.correct); }).length,
  walls: sp.map((x) => x.boardData.walls.length),
};
// 2. path-planning items with empty walls but text claims walls
const noWall = items.filter((x) => x.boardData.kind === 'path-planning' && x.boardData.walls.length === 0);
out.pathNoWalls = { count: noWall.length, ids: noWall.map((x) => x.id).slice(0, 40), explanationMentionsWall: noWall.filter((x) => /tường|tránh/.test(x.explanation + x.tutorial + x.invitation + x.hints.join(' '))).length };
// 3. find-break symmetry: count mismatched mirror cells vs offered options
const fb = items.filter((x) => x.boardData.kind === 'spatial-symmetry' && x.boardData.mode === 'find-break');
out.findBreak = fb.map((x) => {
  const g = x.boardData.grid; const H = g.length; const W = g[0].length;
  const mism = [];
  for (let y = 0; y < H; y += 1) for (let xx = 0; xx < W; xx += 1) {
    const mir = x.boardData.axis === 'vertical' ? [y, W - 1 - xx] : [H - 1 - y, xx];
    const a = g[y][xx]; const b = g[mir[0]][mir[1]];
    if (a !== b) mism.push(`${xx},${y}`);
  }
  const offered = x.boardData.options.map((o) => `${o.x},${o.y}`);
  const solKey = `${x.solution.x},${x.solution.y}`;
  return { id: x.id, axis: x.boardData.axis, mismatchedCells: mism, offeredMismatched: offered.filter((k) => mism.includes(k)), solution: solKey };
});
out.findBreakTwoCellsOneOffered = out.findBreak.filter((r) => r.mismatchedCells.length >= 2 && r.offeredMismatched.length === 1).length;
out.findBreakMismatchCounts = out.findBreak.reduce((m, r) => { m[r.mismatchedCells.length] = (m[r.mismatchedCells.length] || 0) + 1; return m; }, {});
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ shortestPath: out.shortestPath, pathNoWalls: { count: out.pathNoWalls.count, explanationMentionsWall: out.pathNoWalls.explanationMentionsWall }, findBreakTwoCellsOneOffered: out.findBreakTwoCellsOneOffered, findBreakMismatchCounts: out.findBreakMismatchCounts }, null, 1));
loaded.cleanup();
