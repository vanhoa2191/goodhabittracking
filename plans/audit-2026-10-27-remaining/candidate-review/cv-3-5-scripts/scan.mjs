// Read-only scan of the age_3_5 track of the thinking-games V2 candidates.
// Reuses the repo's own engine bundle and pure audit helpers; writes JSON to argv[2].
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadEngine, V2_CANDIDATE_ROOT, BATCHES } from '../../../../scripts/generate-thinking-games-candidates-v2.mjs';
import {
  copyCheck, malformedAnswer, wrongAnswer, alternateAnswer, isMultiAnswer,
  positionBiasErrors, crossTrackHintErrors, titleRepeatErrors,
} from '../../../../scripts/check-thinking-games-candidates-v2.mjs';

const TRACK = 'age_3_5';
const here = dirname(fileURLToPath(import.meta.url));
const outPath = process.argv[2] ?? join(here, 'cv-3-5-scan.json');

const manifest = JSON.parse(readFileSync(join(V2_CANDIDATE_ROOT, 'candidate-manifest-v2.json'), 'utf8'));
const batchItems = BATCHES.flatMap((b) => JSON.parse(readFileSync(join(V2_CANDIDATE_ROOT, `batch-${String(b.number).padStart(2, '0')}-days-${String(b.startDay).padStart(3, '0')}-${String(b.endDay).padStart(3, '0')}.json`), 'utf8')).items);

const allItems = manifest.items;
const items = allItems.filter((x) => x.ageTrack === TRACK);
const batchTrack = batchItems.filter((x) => x.ageTrack === TRACK);
const byId = new Map(batchTrack.map((x) => [x.id, x]));
const mismatch = items.filter((x) => JSON.stringify(byId.get(x.id)) !== JSON.stringify(x)).map((x) => x.id);

const loaded = await loadEngine();
const engine = loaded.engine;
const result = {
  engineVersion: loaded.engineVersion,
  counts: { manifestAllTracks: allItems.length, track: items.length, batchTrackItems: batchTrack.length, manifestBatchMismatch: mismatch.length },
  days: new Set(items.map((x) => x.dayIndex)).size,
  perDay: {},
};

// 1. Engine schema/semantic validation
const validateFail = [];
for (const it of items) {
  let v;
  try { v = engine.validatePuzzle(it); } catch (e) { v = { ok: false, error: String(e) }; }
  const ok = v === true || v?.ok === true || v?.valid === true || (v && v.errors === undefined && v.ok === undefined && v.valid === undefined && v !== false);
  if (!ok) validateFail.push({ id: it.id, detail: JSON.stringify(v).slice(0, 300) });
}
result.validatePuzzle = { failed: validateFail.length, samples: validateFail.slice(0, 20) };
result.validatePuzzleSample = JSON.stringify(engine.validatePuzzle(items[0])).slice(0, 200);

// 2. Solution accepted and single correct option
const solutionRejected = [];
const multiOptionCorrect = [];
const noCorrectOption = [];
const uniqueness = { single: 0, multi: 0, skippedNoOptions: 0 };
const alternatesFail = [];
const wrongAccepted = [];
for (const it of items) {
  const board = it.boardData;
  const sol = it.solution;
  const checkSol = engine.checkAnswer(it, sol);
  if (!(checkSol.ok && checkSol.correct)) solutionRejected.push({ id: it.id, detail: JSON.stringify(checkSol).slice(0, 200) });
  const w = wrongAnswer(it, engine);
  if (!w.ok) wrongAccepted.push({ id: it.id, candidate: JSON.stringify(w.candidate), message: w.message });
  const alt = alternateAnswer(it, engine);
  if (alt && alt.ok === false) alternatesFail.push({ id: it.id, message: alt.message });
  if (isMultiAnswer(it)) { uniqueness.multi += 1; continue; }
  const opts = Array.isArray(board?.options) ? board.options : null;
  if (!opts || opts.length === 0) { uniqueness.skippedNoOptions += 1; continue; }
  uniqueness.single += 1;
  const correctOpts = [];
  for (const o of opts) {
    const cand = typeof o === 'object' && o !== null && 'id' in o ? o.id : o;
    const r = engine.checkAnswer(it, cand);
    if (r.ok && r.correct) correctOpts.push(JSON.stringify(cand));
  }
  if (correctOpts.length > 1) multiOptionCorrect.push({ id: it.id, kind: board.kind, correctOptions: correctOpts });
  if (correctOpts.length === 0) noCorrectOption.push({ id: it.id, kind: board.kind });
}
result.solution = { rejected: solutionRejected.length, rejectedSamples: solutionRejected.slice(0, 20) };
result.uniqueness = { ...uniqueness, multiOptionCorrect: multiOptionCorrect.length, multiSamples: multiOptionCorrect.slice(0, 40), noCorrectOption: noCorrectOption.length, noCorrectSamples: noCorrectOption.slice(0, 20) };
result.wrongAnswerAccepted = { count: wrongAccepted.length, samples: wrongAccepted.slice(0, 20) };
result.alternateFail = { count: alternatesFail.length, samples: alternatesFail.slice(0, 20) };

// 3. Repo's own copy/malformed/bias/title/cross-track helpers (filtered to track)
const copyIssues = items.flatMap((x) => copyCheck(x).map((i) => ({ id: x.id, ...i })));
const malformed = items.map((x) => ({ id: x.id, r: malformedAnswer(x, engine) })).filter((x) => x.r && x.r.ok === false);
const bias = positionBiasErrors(allItems, engine).filter((e) => JSON.stringify(e).includes(TRACK) || e.ageTrack === TRACK);
const cross = crossTrackHintErrors(allItems).filter((e) => JSON.stringify(e).includes(TRACK));
const titles = titleRepeatErrors(allItems).filter((e) => JSON.stringify(e).includes(TRACK));
result.repoHelpers = {
  copyIssues: copyIssues.length, copySamples: copyIssues.slice(0, 20),
  malformed: malformed.length, malformedSamples: malformed.slice(0, 10),
  positionBias: bias.length, positionBiasSamples: bias.slice(0, 10),
  crossTrackHint: cross.length, crossTrackSamples: cross.slice(0, 10),
  titleRepeat: titles.length, titleRepeatSamples: titles.slice(0, 10),
};

writeFileSync(outPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ counts: result.counts, validate: result.validatePuzzle.failed, solRejected: result.solution.rejected, uniq: { single: uniqueness.single, multi: uniqueness.multi, multiOptionCorrect: multiOptionCorrect.length, noCorrect: noCorrectOption.length }, wrongAccepted: wrongAccepted.length, alternateFail: alternatesFail.length, repo: { copy: copyIssues.length, malformed: malformed.length, bias: bias.length, cross: cross.length, title: titles.length } }, null, 2));
loaded.cleanup();
