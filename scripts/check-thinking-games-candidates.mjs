import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  batches,
  candidateRoot,
  contentVersion,
  generatedAt,
  loadEngine,
  manifestPath,
  readEditorialRows,
  sha256,
  skillForCsv,
  sourceRepo,
  sourceUrl,
} from './generate-thinking-games-candidates.mjs';

export const auditDir = join(resolve(new URL('..', import.meta.url).pathname), 'plans/261021-daily-thinking-games/execution/content-candidate-audits');
const INITIAL_TRACKS = new Set(['age_6_8', 'age_9_12']);
const ALTERNATE_CANDIDATE_TYPES = new Set(['g02-t3', 'g04-t2', 'g05-t3', 'g06-t2', 'g06-t3', 'g07-t3', 'g08-t1']);
const REQUIRED_ALTERNATE_TYPES = new Set(['g07-t3']);
const FORBIDDEN_COPY = /\bIQ\b|chỉ số thông minh|nhanh nhất|chậm nhất|thua kém|kém cỏi|đần|ngốc|phải nhanh|tốc độ|ganh đua|áp lực|đua top|so bì/i;
const COPY_KEYS = new Set(['text', 'title', 'invitation', 'label', 'name']);

function answerKey(value) {
  return JSON.stringify(value);
}

function sameAnswer(left, right) {
  return answerKey(left) === answerKey(right);
}

function batchFileName(batch) {
  return `batch-${String(batch.number).padStart(2, '0')}-days-${String(batch.startDay).padStart(3, '0')}-${String(batch.endDay).padStart(3, '0')}.json`;
}

function batchPath(batch) {
  return join(candidateRoot, batchFileName(batch));
}

function auditPath(batch) {
  return join(auditDir, `p07-365-v1-batch-${String(batch.number).padStart(2, '0')}.json`);
}

function pushIssue(list, issue) {
  if (list.length < 250) list.push(issue);
}

function optionAnswers(board) {
  return Array.isArray(board?.options) ? board.options : [];
}

export function isMultiAnswer(item) {
  if (item.gameTypeId === 'g03-t1') return item.boardData?.mode === 'swapped';
  if (item.gameTypeId === 'g02-t3' || item.gameTypeId === 'g08-t1') return true;
  return REQUIRED_ALTERNATE_TYPES.has(item.gameTypeId);
}

function requiresAlternate(item) {
  if (item.gameTypeId === 'g03-t1') return item.boardData?.mode === 'swapped';
  return REQUIRED_ALTERNATE_TYPES.has(item.gameTypeId);
}

export function wrongAnswer(item, engine) {
  const solution = item.solution;
  const board = item.boardData;
  const candidates = [];
  if (typeof solution === 'string') {
    candidates.push(...optionAnswers(board).filter((option) => typeof option === 'string' && option !== solution));
    candidates.push('__not_an_answer__');
  } else if (typeof solution === 'number') {
    candidates.push(solution + 1, solution - 1, solution + 2);
  } else if (Array.isArray(solution)) {
    const points = solution.length > 0 && solution.every((entry) => entry && Number.isInteger(entry.x) && Number.isInteger(entry.y));
    if (points) {
      if (item.gameTypeId === 'g08-t1') {
        const options = optionAnswers(board);
        const size = solution.length;
        const build = (start, current) => {
          if (current.length === size) {
            candidates.push([...current]);
            return;
          }
          for (let index = start; index < options.length; index += 1) build(index + 1, [...current, options[index]]);
        };
        build(0, []);
      } else {
        candidates.push([board.start], [board.start, board.goal], [board.goal]);
      }
    } else {
      candidates.push([...solution].reverse());
      if (solution.length > 1) {
        const swapped = [...solution];
        [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
        candidates.push(swapped, [solution[0]]);
      }
      for (const option of optionAnswers(board)) {
        if (!solution.includes(option)) candidates.push([option]);
      }
      candidates.push([...solution, solution[0]]);
    }
  } else if (solution && typeof solution === 'object') {
    candidates.push({ ...solution, x: (solution.x ?? 0) + 1 });
    candidates.push({ ...solution, y: (solution.y ?? 0) + 1 });
    for (const option of optionAnswers(board)) {
      if (option && typeof option === 'object' && (option.x !== solution.x || option.y !== solution.y)) candidates.push(option);
    }
  }
  for (const candidate of candidates) {
    const checked = engine.checkAnswer(item, candidate);
    if (checked.ok && checked.correct === false) return { ok: true, answer: candidate };
  }
  return { ok: false };
}

function commandPermutations(ids) {
  const output = [];
  const walk = (prefix, rest) => {
    if (rest.length === 0) {
      output.push(prefix);
      return;
    }
    for (let index = 0; index < rest.length; index += 1) {
      walk([...prefix, rest[index]], rest.filter((_, position) => position !== index));
    }
  };
  walk([], ids);
  return output;
}

function alternatePath(board) {
  if (!board || board.kind !== 'flexibility-alternative') return null;
  const walls = new Set(board.walls.map((point) => `${point.x},${point.y}`));
  const goalKey = `${board.goal.x},${board.goal.y}`;
  const startKey = `${board.start.x},${board.start.y}`;
  const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  const maxSteps = board.width * board.height + 4;
  let visitedNodes = 0;
  const search = (point, path, seen) => {
    if (visitedNodes > 300000) return null;
    visitedNodes += 1;
    const key = `${point.x},${point.y}`;
    if (key === goalKey) return path.length > 1 ? path : null;
    if (path.length >= maxSteps) return null;
    for (const direction of directions) {
      const next = { x: point.x + direction.x, y: point.y + direction.y };
      if (next.x < 0 || next.y < 0 || next.x >= board.width || next.y >= board.height) continue;
      const nextKey = `${next.x},${next.y}`;
      if (walls.has(nextKey) || seen.has(nextKey)) continue;
      if (nextKey === startKey) continue;
      const found = search(next, [...path, next], new Set([...seen, nextKey]));
      if (found) return found;
    }
    return null;
  };
  return search(board.start, [board.start], new Set([startKey]));
}

export function alternateValidAnswer(item, engine) {
  const required = requiresAlternate(item);
  if (!required && !ALTERNATE_CANDIDATE_TYPES.has(item.gameTypeId)) return { applicable: false, ok: false };
  const board = item.boardData;
  const candidates = [];
  if (item.gameTypeId === 'g03-t1') {
    candidates.push([...item.solution].reverse());
  } else if (item.gameTypeId === 'g02-t3') {
    candidates.push(...optionAnswers(board));
  } else if (item.gameTypeId === 'g08-t1') {
    const options = optionAnswers(board);
    const size = item.solution.length;
    const build = (start, current) => {
      if (current.length === size) {
        candidates.push([...current]);
        return;
      }
      for (let index = start; index < options.length; index += 1) build(index + 1, [...current, options[index]]);
    };
    build(0, []);
  } else if (item.gameTypeId === 'g04-t2') {
    candidates.push(...optionAnswers(board).filter((option) => option !== item.solution));
  } else if (item.gameTypeId === 'g05-t3') {
    const ids = board.items.map((entry) => entry.id);
    const max = Math.min(board.maxItems ?? ids.length, 6);
    for (let size = 1; size <= max; size += 1) {
      const build = (start, current) => {
        if (current.length === size) {
          candidates.push([...current]);
          return;
        }
        for (let index = start; index < ids.length; index += 1) build(index + 1, [...current, ids[index]]);
      };
      build(0, []);
    }
  } else if (item.gameTypeId === 'g06-t2') {
    candidates.push(...commandPermutations(board.commands.map((entry) => entry.id)));
  } else if (item.gameTypeId === 'g06-t3') {
    candidates.push(...optionAnswers(board).map((entry) => entry.id));
  } else if (item.gameTypeId === 'g07-t3') {
    const path = alternatePath(board);
    if (path) candidates.push(path);
  }
  for (const candidate of candidates) {
    if (sameAnswer(candidate, item.solution)) continue;
    const checked = engine.checkAnswer(item, candidate);
    if (checked.ok && checked.correct) return { applicable: true, ok: true, answer: candidate, required };
  }
  return { applicable: required, ok: false, required };
}

function collectIds(value, ids = new Set()) {
  if (Array.isArray(value)) {
    for (const entry of value) collectIds(entry, ids);
  } else if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      if (key === 'id' && typeof entry === 'string') ids.add(entry);
      if (entry && typeof entry === 'object') collectIds(entry, ids);
    }
  }
  return ids;
}

function normalizeIds(value, ids, idMap) {
  if (Array.isArray(value)) return value.map((entry) => normalizeIds(entry, ids, idMap));
  if (value && typeof value === 'object') {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      const entry = value[key];
      if (key === 'id' && typeof entry === 'string') {
        if (!idMap.has(entry)) idMap.set(entry, `id${idMap.size}`);
        output[key] = idMap.get(entry);
      } else if (COPY_KEYS.has(key) && typeof entry === 'string') {
        output[key] = '@copy';
      } else {
        output[key] = normalizeIds(entry, ids, idMap);
      }
    }
    return output;
  }
  if (typeof value === 'string' && ids.has(value)) {
    if (!idMap.has(value)) idMap.set(value, `id${idMap.size}`);
    return idMap.get(value);
  }
  return value;
}

function isPoint(value) {
  return Boolean(value)
    && typeof value === 'object'
    && Object.keys(value).length === 2
    && Number.isInteger(value.x)
    && Number.isInteger(value.y);
}

function transformPoints(value, transform) {
  if (Array.isArray(value)) return value.map((entry) => transformPoints(entry, transform));
  if (isPoint(value)) return transform(value);
  if (value && typeof value === 'object') {
    const output = {};
    for (const [key, entry] of Object.entries(value)) output[key] = transformPoints(entry, transform);
    return output;
  }
  return value;
}

function rotations(board) {
  if (!board || typeof board !== 'object' || !Number.isInteger(board.width) || !Number.isInteger(board.height)) return [];
  if (board.commands || board.viewer || board.facing) return [];
  const { width: w, height: h } = board;
  const transforms = [
    { width: w, height: h, fn: (point) => ({ x: point.x, y: point.y }) },
    { width: w, height: h, fn: (point) => ({ x: w - 1 - point.x, y: point.y }) },
    { width: w, height: h, fn: (point) => ({ x: point.x, y: h - 1 - point.y }) },
    { width: w, height: h, fn: (point) => ({ x: w - 1 - point.x, y: h - 1 - point.y }) },
    { width: h, height: w, fn: (point) => ({ x: point.y, y: point.x }) },
    { width: h, height: w, fn: (point) => ({ x: w - 1 - point.y, y: point.x }) },
    { width: h, height: w, fn: (point) => ({ x: point.y, y: h - 1 - point.x }) },
    { width: h, height: w, fn: (point) => ({ x: w - 1 - point.y, y: h - 1 - point.x }) },
  ];
  return transforms.map(({ width, height, fn }) => ({ ...transformPoints(board, fn), width, height }));
}

export function normalizedStructuralSignature(item) {
  const ids = collectIds(item.boardData);
  const normalized = normalizeIds(item.boardData, ids, new Map());
  const variants = [normalized, ...rotations(normalized)];
  return `${item.gameTypeId}|${variants.map((entry) => JSON.stringify(entry)).sort()[0]}`;
}

function copyText(item) {
  return [item.title, item.invitation, item.tutorial, ...item.hints, item.explanation].join('\n');
}

function spacingFor(items) {
  const days = new Map();
  for (const item of items) {
    const values = days.get(item.gameTypeId) ?? new Set();
    values.add(item.dayIndex);
    days.set(item.gameTypeId, values);
  }
  let minimum = Number.POSITIVE_INFINITY;
  for (const values of days.values()) {
    const sorted = [...values].sort((a, b) => a - b);
    for (let index = 1; index < sorted.length; index += 1) {
      minimum = Math.min(minimum, sorted[index] - sorted[index - 1]);
    }
  }
  return Number.isFinite(minimum) ? minimum : 0;
}

function rollingCoverage(items) {
  const byDay = new Map();
  for (const item of items) {
    const skills = byDay.get(item.dayIndex) ?? new Set();
    skills.add(item.skillGroup);
    byDay.set(item.dayIndex, skills);
  }
  let windows = 0;
  let covered = 0;
  for (let start = 1; start + 7 <= 365; start += 1) {
    const skills = new Set();
    for (let day = start; day < start + 8; day += 1) {
      for (const skill of byDay.get(day) ?? []) skills.add(skill);
    }
    windows += 1;
    if (skills.size === 8) covered += 1;
  }
  return { windows, covered };
}

function boardComplexity(value) {
  if (Array.isArray(value)) return value.length + value.reduce((total, entry) => total + boardComplexity(entry), 0);
  if (value && typeof value === 'object') {
    let total = Object.keys(value).length;
    for (const entry of Object.values(value)) {
      if (typeof entry === 'number' && Number.isFinite(entry)) total += Math.min(Math.abs(entry), 12) * 0.05;
      else if (entry && typeof entry === 'object') total += boardComplexity(entry);
    }
    return total;
  }
  return 0;
}

export function addCoverageIssues(items, errors) {
  const days = new Set(items.map((item) => item.dayIndex));
  if (days.size !== 365 || [...days].some((day) => day < 1 || day > 365)) {
    pushIssue(errors, { code: 'day_coverage', message: `expected 365 continuous days, got ${days.size}` });
  }
  const skills = new Set(items.map((item) => item.skillGroup));
  if (skills.size !== 8) pushIssue(errors, { code: 'skill_count', message: `expected 8 skills, got ${skills.size}` });
  const types = new Set(items.map((item) => item.gameTypeId));
  if (types.size !== 24) pushIssue(errors, { code: 'type_count', message: `expected 24 types, got ${types.size}` });
  const variants = new Set(items.map((item) => item.ruleVariantId));
  if (variants.size !== 96) pushIssue(errors, { code: 'variant_count', message: `expected 96 variant pairs, got ${variants.size}` });
  for (const track of ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus']) {
    const trackItems = items.filter((item) => item.ageTrack === track);
    if (trackItems.length !== 730) pushIssue(errors, { code: 'track_count', message: `${track}: expected 730, got ${trackItems.length}` });
    const trackDays = new Set(trackItems.map((item) => item.dayIndex));
    if (trackDays.size !== 365) pushIssue(errors, { code: 'track_days', message: `${track}: expected 365 days, got ${trackDays.size}` });
    for (let day = 1; day <= 365; day += 1) {
      const slots = new Set(trackItems.filter((item) => item.dayIndex === day).map((item) => item.slotType));
      if (slots.size !== 2) pushIssue(errors, { code: 'track_slots', message: `${track}.${day}: expected main+bonus` });
      const main = trackItems.find((item) => item.dayIndex === day && item.slotType === 'main');
      const bonus = trackItems.find((item) => item.dayIndex === day && item.slotType === 'bonus');
      if (main && bonus && main.skillGroup === bonus.skillGroup) {
        pushIssue(errors, { code: 'equal_skill', message: `${track}.${day}: main/bonus skills are equal` });
      }
    }
    const rolling = rollingCoverage(trackItems);
    if (rolling.windows !== 358 || rolling.covered !== 358) {
      pushIssue(errors, { code: 'rolling_coverage', message: `${track}: ${rolling.covered}/${rolling.windows} windows covered` });
    }
    const spacing = spacingFor(trackItems);
    if (spacing < 11) pushIssue(errors, { code: 'type_spacing', message: `${track}: min type spacing ${spacing}, expected >= 11` });
  }
}

function typeMetrics(items, engine) {
  const output = [];
  for (const typeId of [...new Set(items.map((item) => item.gameTypeId))].sort()) {
    for (const variant of engine.getGameMechanic(typeId)?.variants ?? []) {
      const pairItems = items.filter((item) => item.gameTypeId === typeId && item.ruleVariantId === `${typeId}:${variant}`);
      const byTrack = {};
      for (const track of ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus']) {
        const values = pairItems.filter((item) => item.ageTrack === track);
        byTrack[track] = {
          count: values.length,
          uniqueStructural: new Set(values.map((item) => normalizedStructuralSignature(item))).size,
          averageComplexity: values.length === 0 ? 0 : Number((values.reduce((total, item) => total + boardComplexity(item.boardData), 0) / values.length).toFixed(2)),
        };
      }
      const monotonic = byTrack.age_13_plus.averageComplexity > byTrack.age_9_12.averageComplexity
        && byTrack.age_9_12.averageComplexity > byTrack.age_6_8.averageComplexity
        && byTrack.age_6_8.averageComplexity > byTrack.age_3_5.averageComplexity;
      output.push({ typeId, variant, byTrack, monotonic });
    }
  }
  return output;
}

export function auditItems(items, { engine, scope, manifest }) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const fingerprints = new Map();
  const normalized = new Map();
  const copyHits = [];
  const sourceHits = [];
  let schemaPass = 0;
  let knownPass = 0;
  let solvePass = 0;
  let wrongPass = 0;
  let malformedPass = 0;
  let alternateApplicable = 0;
  let alternatePass = 0;
  const structuralDiversity = new Map();
  const canonicalSignatures = new Map();

  for (const item of items) {
    try {
      engine.parsePuzzleItem(item);
      const validation = engine.validatePuzzle(item);
      if (!validation.ok) {
        pushIssue(errors, { code: 'invalid_puzzle', id: item.id, message: validation.details.join('; ') });
        continue;
      }
      schemaPass += 1;
    } catch (error) {
      pushIssue(errors, { code: 'schema', id: item.id, message: error instanceof Error ? error.message : String(error) });
      continue;
    }
    if (item.contentVersion !== contentVersion) pushIssue(errors, { code: 'content_version', id: item.id, message: item.contentVersion });
    if (item.status !== 'design_only') pushIssue(errors, { code: 'status', id: item.id, message: item.status });
    if (item.editorial !== null) pushIssue(errors, { code: 'editorial_present', id: item.id, message: 'candidate must not claim human review' });
    if (!ids.has(item.id)) ids.add(item.id); else pushIssue(errors, { code: 'duplicate_id', id: item.id });
    if (!item.id.startsWith(`D${String(item.dayIndex).padStart(3, '0')}-${item.slotType}-vi`)) {
      pushIssue(errors, { code: 'csv_slot_mapping', id: item.id, message: 'id does not preserve CSV slot' });
    }
    const mechanic = engine.getGameMechanic(item.gameTypeId);
    if (!mechanic || mechanic.skillGroup !== item.skillGroup) {
      pushIssue(errors, { code: 'skill_mapping', id: item.id, message: item.skillGroup });
    }
    if (!item.source || item.source.repo !== sourceRepo || item.source.url !== sourceUrl || item.source.license !== 'UNLICENSED' || item.source.path !== 'docs/research/2026-10-17-daily-thinking-games-365.csv') {
      pushIssue(errors, { code: 'source_metadata', id: item.id, message: 'missing or inconsistent provenance' });
    } else {
      sourceHits.push(item.source);
    }
    const expectedFingerprint = engine.puzzleFingerprint(item.gameTypeId, item.boardData);
    if (expectedFingerprint !== item.fingerprint) pushIssue(errors, { code: 'fingerprint', id: item.id, message: item.fingerprint });
    const previousFingerprint = fingerprints.get(item.fingerprint);
    if (previousFingerprint) pushIssue(warnings, { code: 'duplicate_fingerprint', id: item.id, other: previousFingerprint });
    else fingerprints.set(item.fingerprint, item.id);
    const signature = normalizedStructuralSignature(item);
    canonicalSignatures.set(item.id, signature);
    const previousNormalized = normalized.get(signature);
    if (previousNormalized) pushIssue(warnings, { code: 'normalized_skin_duplicate', id: item.id, other: previousNormalized });
    else normalized.set(signature, item.id);
    const diversityKey = `${item.gameTypeId}|${item.ruleVariantId}|${item.ageTrack}`;
    const signatures = structuralDiversity.get(diversityKey) ?? new Set();
    signatures.add(signature);
    structuralDiversity.set(diversityKey, signatures);

    const checked = engine.checkAnswer(item, item.solution);
    if (checked.ok && checked.correct) knownPass += 1;
    else pushIssue(errors, { code: 'known_answer_rejected', id: item.id, message: JSON.stringify(checked) });
    const solved = engine.solvePuzzle(item);
    if (solved.ok && checked.ok && engine.checkAnswer(item, solved.solution).ok && engine.checkAnswer(item, solved.solution).correct) solvePass += 1;
    else pushIssue(errors, { code: 'solver_failure', id: item.id, message: JSON.stringify(solved) });
    if (!isMultiAnswer(item) && solved.ok && !sameAnswer(solved.solution, item.solution)) {
      pushIssue(errors, { code: 'single_answer_mismatch', id: item.id, message: 'solver returned a different single answer' });
    }
    const wrong = wrongAnswer(item, engine);
    if (wrong.ok) wrongPass += 1;
    else pushIssue(errors, { code: 'wrong_answer_accepted', id: item.id, message: 'no rejected wrong answer found' });
    const malformed = engine.checkAnswer(item, null);
    if (!malformed.ok || malformed.correct === false) malformedPass += 1;
    else pushIssue(errors, { code: 'malformed_answer_accepted', id: item.id });
    const alternate = alternateValidAnswer(item, engine);
    if (alternate.applicable) {
      alternateApplicable += 1;
      if (alternate.ok) alternatePass += 1;
      else pushIssue(warnings, { code: 'alternate_not_found', id: item.id, message: item.ruleVariantId });
    }
    const text = copyText(item);
    if (FORBIDDEN_COPY.test(text)) {
      copyHits.push({ id: item.id, text: text.match(FORBIDDEN_COPY)?.[0] });
    }
    if (!/mình/i.test(text) || !/bạn/i.test(text)) {
      copyHits.push({ id: item.id, text: 'missing mình/bạn voice' });
    }
    const explanation = String(item.explanation);
    if (!isMultiAnswer(item) && typeof item.solution !== 'object' && !explanation.includes(String(item.solution))) {
      pushIssue(warnings, { code: 'explanation_answer_missing', id: item.id, message: 'explanation does not name the single answer' });
    }
  }

  if (items.length !== new Set(items.map((item) => item.id)).size) {
    pushIssue(errors, { code: 'non_unique_ids', message: 'candidate ids are not unique' });
  }
  if (copyHits.length > 0) pushIssue(errors, { code: 'copy_review', count: copyHits.length, hits: copyHits.slice(0, 20) });
  if (sourceHits.length !== items.length) pushIssue(errors, { code: 'source_coverage', message: `${sourceHits.length}/${items.length}` });

  const tracks = Object.fromEntries(['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'].map((track) => [
    track,
    items.filter((item) => item.ageTrack === track).length,
  ]));
  const metrics = {
    itemCount: items.length,
    schemaPass,
    knownPass,
    solvePass,
    wrongPass,
    malformedPass,
    alternateApplicable,
    alternatePass,
    uniqueFingerprints: new Set(items.map((item) => item.fingerprint)).size,
    uniqueNormalized: new Set(items.map((item) => canonicalSignatures.get(item.id) ?? normalizedStructuralSignature(item))).size,
    tracks,
    initialTracks: items.filter((item) => INITIAL_TRACKS.has(item.ageTrack)).length,
    experimentalTracks: items.filter((item) => !INITIAL_TRACKS.has(item.ageTrack)).length,
    types: new Set(items.map((item) => item.gameTypeId)).size,
    variants: new Set(items.map((item) => item.ruleVariantId)).size,
    skills: new Set(items.map((item) => item.skillGroup)).size,
    minTypeSpacing: spacingFor(items),
    structuralReuseWarnings: [...structuralDiversity.entries()]
      .filter(([, count]) => count.size === 1)
      .map(([key]) => key)
      .slice(0, 50),
  };
  const ageWarnings = typeMetrics(items, engine)
    .filter((entry) => entry.byTrack.age_3_5.count > 0 && !entry.monotonic)
    .map((entry) => ({ typeId: entry.typeId, variant: entry.variant, byTrack: entry.byTrack, issue: 'complexity_not_monotonic' }));
  if (scope === 'catalog') addCoverageIssues(items, errors);
  if (ageWarnings.length > 0) {
    warnings.push({ code: 'age_complexity', count: ageWarnings.length, examples: ageWarnings.slice(0, 12) });
  }
  const duplicateCount = items.length - new Set(items.map((item) => item.fingerprint)).size;
  const normalizedCollisionCount = items.length - new Set(items.map((item) => canonicalSignatures.get(item.id) ?? normalizedStructuralSignature(item))).size;

  let releaseRejection = null;
  if (manifest) {
    const release = engine.validateManifest(manifest, { profile: 'release' });
    const codes = {};
    for (const issue of release.errors ?? []) codes[issue.code] = (codes[issue.code] ?? 0) + 1;
    releaseRejection = {
      rejected: release.ok === false,
      expected: release.ok === false && (codes.release_unapproved ?? 0) > 0 && (codes.release_editorial ?? 0) > 0,
      codes,
    };
    if (!releaseRejection.rejected) pushIssue(errors, { code: 'release_gate_accepted', message: 'candidate catalog unexpectedly passed release validation' });
    if (!releaseRejection.expected) pushIssue(warnings, { code: 'release_rejection_shape', message: JSON.stringify(codes) });
  }

  return {
    metrics,
    checks: {
      schema: schemaPass === items.length,
      knownAnswer: knownPass === items.length,
      solver: solvePass === items.length,
      wrongAnswerRejected: wrongPass === items.length,
      malformedRejected: malformedPass === items.length,
      alternateWhereApplicable: alternateApplicable === alternatePass,
      copy: copyHits.length === 0,
      provenance: sourceHits.length === items.length,
      fingerprintsUnique: metrics.uniqueFingerprints === items.length,
      normalizedUnique: metrics.uniqueNormalized === items.length,
    },
    quality: {
      duplicateFingerprints: duplicateCount,
      normalizedCollisions: normalizedCollisionCount,
      ageComplexityWarnings: ageWarnings.length,
      structuralReusePairs: metrics.structuralReuseWarnings.length,
      blocked: duplicateCount > 0 || normalizedCollisionCount > 0 || ageWarnings.length > 0,
    },
    releaseRejection,
    errors,
    warnings,
  };
}

export function loadBatch(batch) {
  const path = batchPath(batch);
  return { path, document: JSON.parse(readFileSync(path, 'utf8')) };
}

export function loadManifest() {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function loadCandidateMeta() {
  return JSON.parse(readFileSync(join(candidateRoot, 'candidate-meta-v1.json'), 'utf8'));
}

export async function checkBatch(batch, { write = true } = {}) {
  const loaded = await loadEngine();
  try {
    const { path, document } = loadBatch(batch);
    const meta = loadCandidateMeta();
    const audit = auditItems(document.items, { engine: loaded.engine, scope: 'batch', manifest: null });
    const expectedDays = batch.endDay - batch.startDay + 1;
    const batchErrors = [];
    if (document.days.start !== batch.startDay || document.days.end !== batch.endDay) {
      pushIssue(batchErrors, { code: 'batch_range', message: JSON.stringify(document.days) });
    }
    if (document.items.length !== expectedDays * 2 * 4) {
      pushIssue(batchErrors, { code: 'batch_count', message: `${document.items.length}/${expectedDays * 2 * 4}` });
    }
    const days = new Set(document.items.map((item) => item.dayIndex));
    if (days.size !== expectedDays) pushIssue(batchErrors, { code: 'batch_days', message: `${days.size}/${expectedDays}` });
    if (document.mapping.length !== document.items.length) pushIssue(batchErrors, { code: 'mapping_count', message: 'mapping/item mismatch' });
    if (document.sourceHash !== meta.sourceHash) pushIssue(batchErrors, { code: 'source_hash', message: 'batch/meta source hash mismatch' });
    if (document.engineVersion !== meta.engineVersion) pushIssue(batchErrors, { code: 'engine_hash', message: 'batch/meta engine version mismatch' });
    const result = {
      auditVersion: 'p07-candidate-audit-v1',
      scope: 'batch',
      batch: batch.number,
      days: { start: batch.startDay, end: batch.endDay },
      generatedAt,
      contentVersion,
      sourceHash: document.sourceHash,
      engineVersion: document.engineVersion,
      inputSha256: sha256(readFileSync(path)),
      manifestSha256: sha256(readFileSync(manifestPath)),
      metrics: audit.metrics,
      checks: audit.checks,
      quality: audit.quality,
      batchChecks: { ok: batchErrors.length === 0, errors: batchErrors },
      releaseRejection: null,
      errors: [...audit.errors, ...batchErrors],
      warnings: audit.warnings,
      status: audit.errors.length > 0 || batchErrors.length > 0
        ? 'fail'
        : audit.quality.blocked ? 'review_blocked_quality' : 'pass_with_review_warnings',
    };
    if (write) {
      mkdirSync(auditDir, { recursive: true });
      writeFileSync(auditPath(batch), `${JSON.stringify(result, null, 2)}\n`);
    }
    return { path: auditPath(batch), result };
  } finally {
    loaded.cleanup();
  }
}

export async function checkAll({ write = true } = {}) {
  const loaded = await loadEngine();
  try {
    const manifest = loadManifest();
    const meta = loadCandidateMeta();
    const editorial = readEditorialRows();
    const audit = auditItems(manifest.items, { engine: loaded.engine, scope: 'catalog', manifest });
    const coverageErrors = [];
    addCoverageIssues(manifest.items, coverageErrors);
    if (manifest.items.length !== 2920) pushIssue(coverageErrors, { code: 'total_count', message: String(manifest.items.length) });
    if (manifest.coverage?.dayCount !== 365 || manifest.coverage?.slotsPerDay !== 2 || manifest.coverage?.typeIds !== 24 || manifest.coverage?.variantPairs !== 96) {
      pushIssue(coverageErrors, { code: 'coverage_claim', message: JSON.stringify(manifest.coverage) });
    }
    if (meta.sourceHash !== editorial.csvHash) pushIssue(coverageErrors, { code: 'csv_hash', message: 'meta source hash mismatch' });
    if (manifest.manifestVersion !== contentVersion) pushIssue(coverageErrors, { code: 'manifest_version', message: manifest.manifestVersion });
    const csvPairMap = new Map();
    for (const row of editorial.rows) {
      for (const slot of [row.main, row.bonus]) {
        csvPairMap.set(slot.slotId, `${slot.typeId}:${slot.variant}`);
        if (skillForCsv(slot.skill) !== loaded.engine.getGameMechanic(slot.typeId)?.skillGroup) {
          pushIssue(coverageErrors, { code: 'csv_skill', message: slot.slotId });
        }
      }
    }
    for (const item of manifest.items) {
      const slotId = item.id.replace(/-vi(35|68|912|13p)$/, '');
      const expectedPair = csvPairMap.get(slotId);
      if (expectedPair !== item.ruleVariantId) {
        pushIssue(coverageErrors, { code: 'csv_variant_mapping', id: item.id, message: `${expectedPair} != ${item.ruleVariantId}` });
      }
    }
    const result = {
      auditVersion: 'p07-candidate-audit-v1',
      scope: 'catalog',
      generatedAt,
      contentVersion,
      sourceHash: meta.sourceHash,
      engineVersion: meta.engineVersion,
      inputSha256: sha256(readFileSync(manifestPath)),
      csvSha256: editorial.csvHash,
      metrics: audit.metrics,
      checks: audit.checks,
      quality: audit.quality,
      catalogChecks: { ok: coverageErrors.length === 0, errors: coverageErrors },
      releaseRejection: audit.releaseRejection,
      errors: [...audit.errors, ...coverageErrors],
      warnings: audit.warnings,
      status: audit.errors.length > 0 || coverageErrors.length > 0
        ? 'fail'
        : audit.quality.blocked ? 'review_blocked_quality' : 'pass_with_review_warnings',
    };
    if (write) {
      mkdirSync(auditDir, { recursive: true });
      writeFileSync(join(auditDir, 'p07-365-v1-catalog.json'), `${JSON.stringify(result, null, 2)}\n`);
    }
    return { path: join(auditDir, 'p07-365-v1-catalog.json'), result };
  } finally {
    loaded.cleanup();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = new Set(process.argv.slice(2));
  const batchArg = process.argv.slice(2).find((argument) => argument.startsWith('--batch='));
  let output;
  if (batchArg) {
    const number = Number(batchArg.split('=')[1]);
    const batch = batches.find((entry) => entry.number === number);
    if (!batch) throw new Error(`unknown batch ${number}`);
    output = await checkBatch(batch);
  } else if (args.has('--all')) {
    output = await checkAll();
  } else {
    throw new Error('usage: node scripts/check-thinking-games-candidates.mjs --batch=1 | --all');
  }
  const { result } = output;
  console.log(JSON.stringify({
    ok: result.status !== 'fail',
    audit: output.path,
    scope: result.scope,
    batch: result.batch ?? null,
    status: result.status,
    metrics: result.metrics,
    checks: result.checks,
    quality: result.quality,
    batchChecks: result.batchChecks?.ok ?? result.catalogChecks?.ok,
    releaseRejection: result.releaseRejection,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    errors: result.errors.slice(0, 12),
    warnings: result.warnings.slice(0, 8),
  }, null, 2));
}
