// Second pass over the age_3_5 track: exhaustive answer-set uniqueness for set/ordered kinds,
// character-set scan, word-shape scan, length stats, repeated copy and sensitive-term scan.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEngine, V2_CANDIDATE_ROOT } from '../../../../scripts/generate-thinking-games-candidates-v2.mjs';

const TRACK = 'age_3_5';
const here = dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2] ?? join(here, 'cv-3-5-text.json');
const manifest = JSON.parse(readFileSync(join(V2_CANDIDATE_ROOT, 'candidate-manifest-v2.json'), 'utf8'));
const items = manifest.items.filter((x) => x.ageTrack === TRACK);

const loaded = await loadEngine();
const engine = loaded.engine;

// ---- exhaustive uniqueness for array-answer kinds (options small) ----
const setUniq = { checked: 0, bad: [], kinds: {} };
function permutations(arr, k) {
  if (k === 0) return [[]];
  const out = [];
  arr.forEach((x, i) => {
    for (const rest of permutations(arr.filter((_, j) => j !== i), k - 1)) out.push([x, ...rest]);
  });
  return out;
}
for (const it of items) {
  const sol = it.solution;
  if (!Array.isArray(sol) || sol.some((s) => typeof s === 'object' && s !== null && 'x' in s)) continue; // point paths: validity only
  const opts = (it.boardData.options ?? []).map((o) => (typeof o === 'object' && o !== null && 'id' in o ? o.id : o));
  if (opts.length === 0 || opts.length > 7) { setUniq.bad.push({ id: it.id, reason: 'options-length', n: opts.length }); continue; }
  setUniq.checked += 1;
  const k = sol.length;
  const accepted = new Set();
  for (let size = 1; size <= Math.min(k, opts.length); size += 1) {
    if (size !== k) continue;
    for (const seq of permutations(opts, size)) {
      const r = engine.checkAnswer(it, seq);
      if (r.ok && r.correct) accepted.add(JSON.stringify(seq));
    }
  }
  const isSet = ['g07-t1', 'g08-t2', 'g05-t3'].includes(it.gameTypeId) || (it.gameTypeId === 'g03-t1' && it.boardData.mode !== 'swapped');
  const groups = isSet ? new Set([...accepted].map((s) => JSON.stringify(JSON.parse(s).slice().sort()))) : accepted;
  const kind = it.boardData.kind;
  setUniq.kinds[kind] = setUniq.kinds[kind] ?? { items: 0, uniqueOk: 0 };
  setUniq.kinds[kind].items += 1;
  if (groups.size === 1) setUniq.kinds[kind].uniqueOk += 1;
  else setUniq.bad.push({ id: it.id, kind, isSet, acceptedGroups: groups.size, accepted: [...accepted].slice(0, 6), solution: sol });
}

// ---- character set ----
const ALLOWED_PUNCT = new Set(['\n', '\t', '–', '—', '‘', '’', '“', '”', '…', '·', '→', '×', '−', 'đ', 'Đ', '•', '(', ')', '"', "'", '!', '?', ',', '.', ':', ';', '-', '/', '%', '+', '=', '&', '*', '#', '[', ']', '{', '}', '<', '>', '|', '_', '@', '~', '^', ' ']);
function isVietnameseOrAsciiChar(ch) {
  if (ch.charCodeAt(0) < 128) return /[A-Za-z0-9 ]/.test(ch) || ALLOWED_PUNCT.has(ch);
  if (ALLOWED_PUNCT.has(ch)) return true;
  const d = ch.normalize('NFD');
  const base = d[0];
  return /[A-Za-z]/.test(base) && [...d.slice(1)].every((c) => c.codePointAt(0) >= 0x300 && c.codePointAt(0) <= 0x36f);
}
function strings(obj, path = '') {
  const out = [];
  if (typeof obj === 'string') out.push([path, obj]);
  else if (Array.isArray(obj)) obj.forEach((v, i) => out.push(...strings(v, `${path}[${i}]`)));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) out.push(...strings(v, path ? `${path}.${k}` : k));
  return out;
}
const TEXT_KEYS = /^(title|invitation|tutorial|explanation|hints|solution|boardData|text|scenario|value|trait|id|ruleKind|mode|kind|command|label)/;
const charIssues = [];
const allStrings = [];
for (const it of items) {
  for (const [path, s] of strings(it)) {
    if (['id', 'fingerprint', 'contentVersion', 'gameTypeId', 'ruleVariantId', 'skillGroup', 'slotType', 'ageTrack', 'locale', 'validSolutionPredicate', 'status', 'praiseKeys'].includes(path.split(/[.[\]]/)[0]) && !/^(hints|title)/.test(path)) continue;
    allStrings.push({ id: it.id, path, s });
    const bad = [...s].filter((ch) => !isVietnameseOrAsciiChar(ch));
    if (bad.length) charIssues.push({ id: it.id, path, chars: [...new Set(bad)].map((c) => `${c} U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`), snippet: s.slice(0, 160) });
    if (/\s{2,}/.test(s) || /^\s|\s$/.test(s)) charIssues.push({ id: it.id, path, kind: 'whitespace', snippet: JSON.stringify(s).slice(0, 160) });
  }
}

// ---- Vietnamese syllable shape (approximate; catches garbled tokens, not every misspelling) ----
const ONSET = '(?:ngh|ng|nh|ch|gh|gi|kh|ph|qu|th|tr|b|c|d|đ|g|h|k|l|m|n|p|q|r|s|t|v|x)?';
const CODA = '(?:ng|nh|ch|c|m|n|p|t|o|u|i|y)?';
const VOWEL = '[aăâeêioôơuưy]';
const SYLLABLE = new RegExp(`^${ONSET}${VOWEL}{1,3}${CODA}$`, 'u');
const tokenIssues = [];
const tokenCounts = new Map();
for (const { id, path, s } of allStrings) {
  if (!/^(title|invitation|tutorial|explanation|hints)/.test(path) && !/text|scenario|value/.test(path)) continue;
  const words = s.toLowerCase().normalize('NFC').split(/[\s.,!?;:"“”'‘’()\-–—…·→]+/).filter(Boolean);
  for (const w of words) {
    if (/^\d+$/.test(w)) continue;
    const base = w.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
    const syl = base.replace(/[^a-zăâêôơưđ]/gu, '');
    tokenCounts.set(w, (tokenCounts.get(w) ?? 0) + 1);
    if (!SYLLABLE.test(syl)) tokenIssues.push({ id, path, token: w });
  }
}
const suspiciousTokens = [...new Map(tokenIssues.map((t) => [t.token, t])).values()];

// ---- length / repeated copy ----
const lenStats = {};
for (const field of ['title', 'invitation', 'tutorial', 'explanation']) {
  const vals = items.map((x) => x[field]);
  const words = vals.map((v) => v.split(/\s+/).length).sort((a, b) => a - b);
  lenStats[field] = { min: words[0], median: words[Math.floor(words.length / 2)], p90: words[Math.floor(words.length * 0.9)], max: words[words.length - 1], distinct: new Set(vals).size };
}
const hintWords = items.flatMap((x) => x.hints.map((h) => h.split(/\s+/).length));
lenStats.hints = { min: Math.min(...hintWords), max: Math.max(...hintWords), distinct: new Set(items.flatMap((x) => x.hints)).size, total: hintWords.length };
const repeated = (field) => {
  const m = new Map();
  for (const x of items) { const v = Array.isArray(x[field]) ? x[field].join(' | ') : x[field]; m.set(v, (m.get(v) ?? 0) + 1); }
  return [...m.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([text, n]) => ({ text: text.slice(0, 140), n }));
};
const repeatCopy = { invitation: repeated('invitation'), tutorial: repeated('tutorial'), explanation: repeated('explanation'), title: repeated('title') };
const sensitive = /sợ|máu|chết|đau|bạo|đánh|đấm|giết|ma\b|quỷ|mua|bán|giá|tiền|khuyến mãi|thương hiệu|con trai|con gái|bé trai|bé gái|con trai|nữ|nam|bố|mẹ|mập|xấu|ngu|gầy|nghèo|giàu|đen|trắng|quê|thành phố|tôn giáo|chúa|phật/iu;
const sensitiveHits = [];
for (const { id, path, s } of allStrings) {
  if (!/^(title|invitation|tutorial|explanation|hints|boardData)/.test(path)) continue;
  const m = s.match(sensitive);
  if (m) sensitiveHits.push({ id, path, term: m[0], snippet: s.slice(0, 160) });
}
const englishHits = allStrings.filter(({ s, path }) => /^(title|invitation|tutorial|explanation|hints)/.test(path) && /\b(left|right|ahead|behind|north|south|east|west|candidate|item|shape|scene|fact|step|fix|turn)\b/i.test(s)).map(({ id, path, s }) => ({ id, path, snippet: s.slice(0, 160) }));

// ---- answer leak: plain-string solution quoted in prompt text ----
const leaks = [];
for (const it of items) {
  if (typeof it.solution !== 'string') continue;
  for (const f of ['title', 'invitation', 'tutorial']) {
    if (it[f].toLowerCase().includes(it.solution.toLowerCase())) leaks.push({ id: it.id, field: f, solution: it.solution, snippet: it[f].slice(0, 160) });
  }
}

const out = {
  items: items.length,
  setUniq: { checked: setUniq.checked, bad: setUniq.bad.length, badSamples: setUniq.bad.slice(0, 30), kinds: setUniq.kinds },
  charIssues: { count: charIssues.length, samples: charIssues.slice(0, 60) },
  suspiciousTokens: { distinct: suspiciousTokens.length, samples: suspiciousTokens.slice(0, 120) },
  lenStats,
  repeatCopy,
  sensitiveHits: { count: sensitiveHits.length, samples: sensitiveHits.slice(0, 80) },
  englishHits: { count: englishHits.length, samples: englishHits.slice(0, 40) },
  leaks: { count: leaks.length, samples: leaks.slice(0, 40) },
  distinctWords: tokenCounts.size,
};
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ setUniq: { checked: out.setUniq.checked, bad: out.setUniq.bad, kinds: out.setUniq.kinds }, charIssues: out.charIssues.count, suspiciousTokens: out.suspiciousTokens.distinct, lenStats, sensitive: out.sensitiveHits.count, english: out.englishHits.count, leaks: out.leaks.count, distinctWords: out.distinctWords }, null, 1).slice(0, 6000));
loaded.cleanup();
