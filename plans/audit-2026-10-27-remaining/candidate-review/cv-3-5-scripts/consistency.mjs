// Explanation / label / duplicate consistency for the age_3_5 track (pure data checks, no engine).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const V2 = join(dirname(fileURLToPath(import.meta.url)), '../../../../content/thinking-games/candidates/365-v2');
const outPath = process.argv[2];
const items = JSON.parse(readFileSync(join(V2, 'candidate-manifest-v2.json'), 'utf8')).items.filter((x) => x.ageTrack === 'age_3_5');
const issues = [];
const push = (id, kind, detail) => issues.push({ id, kind, detail });
const solId = (it) => (typeof it.solution === 'object' && it.solution && 'id' in it.solution ? it.solution.id : it.solution);
const LETTERS = 'ABCDEFG';

for (const it of items) {
  const b = it.boardData;
  const e = it.explanation;
  const sol = it.solution;
  const id = it.id;
  switch (b.kind) {
    case 'rule-error': {
      const m = e.match(/Vị trí thứ (\d+) \(([^)]+)\)/);
      if (!m) push(id, 'expl-format', e);
      else {
        if (Number(m[1]) - 1 !== sol) push(id, 'rule-error-position', `expl ${m[1]} vs solution index ${sol}`);
        if (b.sequence[sol] !== m[2]) push(id, 'rule-error-item', `expl ${m[2]} vs sequence[${sol}]=${b.sequence[sol]}`);
      }
      break;
    }
    case 'planning-fix-step': {
      const m = e.match(/bước (\d+) thành hướng "([^"]+)"/);
      const opt = b.options.find((o) => o.id === sol);
      if (!m) push(id, 'expl-format', e);
      else {
        if (Number(m[1]) - 1 !== opt.index) push(id, 'fix-step-index', `expl ${m[1]} vs index ${opt.index}`);
      }
      break;
    }
    case 'spatial-silhouette':
    case 'spatial-rotation': {
      const m = e.match(/Hình ([A-C])\b/);
      const pos = b.options.findIndex((o) => o.id === sol);
      if (!m) push(id, 'expl-format', e);
      else if (LETTERS[pos] !== m[1]) push(id, 'shape-label', `expl ${m[1]} vs option position ${LETTERS[pos]}`);
      break;
    }
    case 'quantity-grouping': {
      const m = e.match(/nhóm (\d+)/);
      const exact = b.total / b.groupSize;
      if (sol !== exact && b.mode === 'exact') push(id, 'grouping-solution', `total ${b.total} / ${b.groupSize} = ${exact}, solution ${sol}`);
      break;
    }
    case 'quantity-balance': {
      const m = e.match(/Cần thêm (\d+)/);
      if (m && Number(m[1]) !== sol) push(id, 'balance-expl', `expl ${m[1]} vs solution ${sol}`);
      break;
    }
    case 'rule-transform': {
      const ops = { add: (x) => x + 1, subtract: (x) => x - 1, double: (x) => x * 2, reverse: (x) => Number(String(x).split('').reverse().join('')) };
      const out = ops[b.transform]?.(Number(b.query));
      if (out !== undefined && String(out) !== String(sol)) push(id, 'transform-solution', `${b.transform}(${b.query})=${out} vs solution ${sol}`);
      break;
    }
    case 'reasoning-elimination': {
      const matching = b.candidates.filter((c) => b.clues.every((cl) => (cl.negate ? c.traits[cl.trait] !== cl.value : c.traits[cl.trait] === cl.value)));
      if (matching.length !== 1) push(id, 'elimination-unique', `matching ${matching.length}`);
      else if (matching[0].id !== sol) push(id, 'elimination-solution', `matching ${matching[0].id} vs solution ${sol}`);
      break;
    }
    case 'observation-two-traits': case 'flexibility-classify': {
      break;
    }
    case 'memory-position': {
      const m = e.match(/hàng (\d+), cột (\d+)/g) ?? [];
      break;
    }
    default:
      break;
  }
  // explanation mentions the answer text for plain-string solutions
  if (typeof sol === 'string' && b.kind !== 'reasoning-if-then' && b.kind !== 'memory-sequence' && b.kind !== 'planning-command-order' && !e.toLowerCase().includes(sol.toLowerCase())) {
    push(id, 'expl-missing-answer', `${b.kind}: solution "${sol}" not in: ${e.slice(0, 120)}`);
  }
}

// exact duplicate boards within the track (same boardData, different day)
const byBoard = new Map();
for (const it of items) {
  const k = JSON.stringify(it.boardData);
  (byBoard.get(k) ?? byBoard.set(k, []).get(k)).push(it.id);
}
const dupBoards = [...byBoard.values()].filter((a) => a.length > 1);

// same fingerprint -> same board?
const fpMap = new Map();
for (const it of items) (fpMap.get(it.fingerprint) ?? fpMap.set(it.fingerprint, []).get(it.fingerprint)).push(it);
const fpGroups = [...fpMap.values()].filter((a) => a.length > 1);
const fpSameBoard = fpGroups.filter((g) => new Set(g.map((x) => JSON.stringify(x.boardData))).size === 1).length;

const byKind = {};
for (const x of issues) byKind[x.kind] = (byKind[x.kind] ?? 0) + 1;
const out = { items: items.length, issueCounts: byKind, issues, exactDuplicateBoards: dupBoards, fingerprintGroups: fpGroups.length, fingerprintItems: fpGroups.reduce((s, g) => s + g.length, 0), fingerprintGroupsWithIdenticalBoard: fpSameBoard, fpGroupSample: fpGroups.map((g) => g.map((x) => x.id)).slice(0, 40) };
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ issueCounts: byKind, exactDup: dupBoards.length, fpGroups: fpGroups.length, fpItems: out.fingerprintItems, fpSameBoard: fpSameBoard }, null, 1));
