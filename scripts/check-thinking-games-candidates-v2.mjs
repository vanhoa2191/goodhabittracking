import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  BATCHES,
  V2_CANDIDATE_ROOT,
  V2_CONTENT_VERSION,
  GENERATED_AT,
  loadEngine,
  readEditorialRows,
  sha256,
  skillForCsv,
} from './generate-thinking-games-candidates-v2.mjs';

export const auditDir = join(resolve(new URL('..', import.meta.url).pathname), 'plans/261021-daily-thinking-games/execution/content-candidate-audits');
const REQUIRED_ALTERNATE_TYPES = new Set(['g07-t3']);
const FORBIDDEN_COPY = /\bIQ\b|chỉ số thông minh|nhanh nhất|chậm nhất|thua kém|kém cỏi|đần|ngốc|phải nhanh|tốc độ|ganh đua|áp lực|đua top|so bì/i;
const COPY_KEYS = new Set(['text', 'title', 'invitation', 'label', 'name']);

// Game types with point array answers where order doesn't matter (set of points)
const POINT_SET_TYPES = new Set(['g08-t1']);

// Game types with string array answers where order doesn't matter (set of strings)
const STRING_SET_TYPES = new Set(['g07-t1', 'g08-t2', 'g05-t3']);

function answerKey(value) { return JSON.stringify(value); }
function sameAnswer(left, right) { return answerKey(left) === answerKey(right); }

function sameAnswerForAudit(left, right, gameTypeId) {
  if (POINT_SET_TYPES.has(gameTypeId)) {
    // Compare as sets of points
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    const leftSet = new Set(left.map((p) => `${p.x},${p.y}`));
    const rightSet = new Set(right.map((p) => `${p.x},${p.y}`));
    return leftSet.size === rightSet.size && [...leftSet].every((k) => rightSet.has(k));
  }
  if (STRING_SET_TYPES.has(gameTypeId)) {
    // Compare as sets of strings
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    const leftSet = new Set(left);
    const rightSet = new Set(right);
    return leftSet.size === rightSet.size && [...leftSet].every((k) => rightSet.has(k));
  }
  // Default: exact comparison (order matters)
  return answerKey(left) === answerKey(right);
}
function batchFileName(batch) { return `batch-${String(batch.number).padStart(2, '0')}-days-${String(batch.startDay).padStart(3, '0')}-${String(batch.endDay).padStart(3, '0')}.json`; }
function batchPath(batch) { return join(V2_CANDIDATE_ROOT, batchFileName(batch)); }
function auditPath(batch) { return join(auditDir, `p08-365-v2-batch-${String(batch.number).padStart(2, '0')}.json`); }
function pushIssue(list, issue) { if (list.length < 250) list.push(issue); }
function optionAnswers(board) { return Array.isArray(board?.options) ? board.options : []; }

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
    // Special handling for g04-t2: only test non-derivable options as wrong answers
    if (item.gameTypeId === 'g04-t2' && board.kind === 'reasoning-if-then') {
      const known = new Set(board.facts);
      const closure = new Set(board.facts);
      let changed = true;
      while (changed) {
        changed = false;
        for (const rule of board.rules) {
          if (closure.has(rule.if) && !closure.has(rule.then)) {
            closure.add(rule.then);
            changed = true;
          }
        }
      }
      // Only options that are NOT in closure and NOT initial facts are genuine wrong answers
      candidates.push(
        ...optionAnswers(board).filter(
          (option) => typeof option === 'string' && !known.has(option) && !closure.has(option)
        )
      );
      candidates.push('__not_an_answer__');
    } else {
      candidates.push(...optionAnswers(board).filter((option) => typeof option === 'string' && option !== solution));
      candidates.push('__not_an_answer__');
    }
  } else if (typeof solution === 'number') {
    candidates.push(solution + 1, solution - 1, solution + 2);
  } else if (Array.isArray(solution)) {
    const points = solution.length > 0 && solution.every((entry) => entry && Number.isInteger(entry.x) && Number.isInteger(entry.y));
    if (points) {
      if (item.gameTypeId === 'g08-t1') {
        const options = optionAnswers(board);
        const size = solution.length;
        const solKey = solution.map((p) => `${p.x},${p.y}`).sort().join(';');
        const build = (start, current) => {
          if (current.length === size) {
            const currKey = current.map((p) => `${p.x},${p.y}`).sort().join(';');
            if (currKey !== solKey) candidates.push([...current]);
            return;
          }
          for (let index = start; index < options.length; index += 1) build(index + 1, [...current, options[index]]);
        };
        build(0, []);
      } else {
        candidates.push([board.start], [board.start, board.goal], [board.goal]);
      }
    } else {
      // Skip permutation tests for set-based answer types (order doesn't matter)
      const isSetBasedStringArray = ['g07-t1', 'g08-t2', 'g05-t3'].includes(item.gameTypeId);
      const isMemorySwapped = item.gameTypeId === 'g03-t1' && board.mode === 'swapped';
      if (!isSetBasedStringArray && !isMemorySwapped) {
        const reversed = [...solution].reverse();
        if (!sameAnswer(reversed, solution)) candidates.push(reversed);
        if (solution.length > 1) {
          const swapped = [...solution]; swapped[0] = solution[1]; swapped[1] = solution[0];
          if (!sameAnswer(swapped, solution)) candidates.push(swapped);
        }
      }
    }
  }
  for (const candidate of candidates) {
    const checked = engine.checkAnswer(item, candidate);
    if (checked.ok && checked.correct) return { ok: false, candidate, message: 'wrong answer accepted by checker' };
  }
  return { ok: true };
}

export function alternateAnswer(item, engine) {
  if (!requiresAlternate(item)) return { ok: true, applicable: false };
  const solution = item.solution;
  if (!Array.isArray(solution)) return { ok: false, applicable: true, message: 'alternate required but solution not array' };
  const board = item.boardData;
  
  // Special handling for g07-t3 (flexibility-alternative): find alternate valid paths
  if (item.gameTypeId === 'g07-t3') {
    return findAlternatePath(board, solution, engine, item);
  }
  
  // Special handling for g03-t1 swapped mode: the alternate is the swapped sequence
  if (item.gameTypeId === 'g03-t1' && board.mode === 'swapped') {
    const swapped = [...solution];
    if (swapped.length >= 2) {
      const temp = swapped[0];
      swapped[0] = swapped[swapped.length - 1];
      swapped[swapped.length - 1] = temp;
    }
    if (!sameAnswer(swapped, solution)) {
      const checked = engine.checkAnswer(item, swapped);
      if (checked.ok && checked.correct) {
        return { ok: true, applicable: true, alternate: swapped };
      }
    }
    return { ok: false, applicable: true, message: 'swapped sequence not valid alternate' };
  }
  
  const options = optionAnswers(board);
  if (options.length === 0) return { ok: false, applicable: true, message: 'no options for alternate search' };
  const size = solution.length;
  const build = (start, current) => {
    if (current.length === size) {
      if (!sameAnswer(current, solution)) {
        const checked = engine.checkAnswer(item, current);
        if (checked.ok && checked.correct) return { ok: true, applicable: true, alternate: current };
      }
      return null;
    }
    for (let index = start; index < options.length; index += 1) {
      const result = build(index + 1, [...current, options[index]]);
      if (result) return result;
    }
    return null;
  };
  const found = build(0, []);
  if (!found) return { ok: false, applicable: true, message: 'no valid alternate found in options' };
  return { ok: true, applicable: true, alternate: found.alternate };
}

function findAlternatePath(board, solution, engine, item) {
  // Use BFS to find all valid paths from start to goal avoiding walls
  // We already know one valid path (solution), find another
  const width = board.width;
  const height = board.height;
  const start = board.start;
  const goal = board.goal;
  const wallSet = new Set(board.walls.map((w) => `${w.x},${w.y}`));
  
  const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
  
  // BFS to find all simple paths (up to a reasonable limit)
  const queue = [{ point: start, path: [start], visited: new Set([`${start.x},${start.y}`]) }];
  const validPaths = [];
  const maxPaths = 100; // Limit search
  
  while (queue.length > 0 && validPaths.length < maxPaths) {
    const current = queue.shift();
    if (!current) continue;
    if (current.point.x === goal.x && current.point.y === goal.y) {
      // Check if this path is different from knownPath and solution
      const pathKey = current.path.map((p) => `${p.x},${p.y}`).join(';');
      const knownKey = board.knownPath.map((p) => `${p.x},${p.y}`).join(';');
      const solKey = solution.map((p) => `${p.x},${p.y}`).join(';');
      if (pathKey !== knownKey && pathKey !== solKey) {
        // Verify with engine checker
        const checked = engine.checkAnswer({ ...item, boardData: board }, current.path);
        if (checked.ok && checked.correct) {
          return { ok: true, applicable: true, alternate: current.path };
        }
      }
      continue;
    }
    for (const dir of directions) {
      const next = { x: current.point.x + dir.x, y: current.point.y + dir.y };
      const nextKey = `${next.x},${next.y}`;
      if (next.x < 0 || next.y < 0 || next.x >= width || next.y >= height) continue;
      if (wallSet.has(nextKey)) continue;
      if (current.visited.has(nextKey)) continue;
      const newVisited = new Set(current.visited);
      newVisited.add(nextKey);
      queue.push({ point: next, path: [...current.path, next], visited: newVisited });
    }
  }
  return { ok: false, applicable: true, message: 'no valid alternate path found' };
}

export function malformedAnswer(item, engine) {
  const solution = item.solution;
  const malformed = [];
  if (typeof solution === 'string') malformed.push(123, [], {}, null, undefined);
  else if (typeof solution === 'number') malformed.push('not a number', [], {}, null, undefined);
  else if (Array.isArray(solution)) {
    const points = solution.length > 0 && solution.every((entry) => entry && Number.isInteger(entry.x) && Number.isInteger(entry.y));
    if (points) malformed.push('not an array', [{ x: 'a', y: 1 }], [{ x: 1 }], [{ x: 1, y: 2, z: 3 }], [1, 2], null, undefined);
    else malformed.push(123, 'not an array', { a: 1 }, null, undefined);
  }
  for (const candidate of malformed) {
    const checked = engine.checkAnswer(item, candidate);
    if (checked.ok && checked.correct) return { ok: false, candidate, message: 'malformed answer accepted as correct' };
  }
  return { ok: true };
}

export function copyCheck(item) {
  const issues = [];
  const checkValue = (value, path) => { if (typeof value !== 'string') return; if (FORBIDDEN_COPY.test(value)) issues.push({ code: 'copy_forbidden', path, snippet: value.slice(0, 120) }); };
  for (const key of COPY_KEYS) { if (key in item) checkValue(item[key], key); }
  if (item.hints && Array.isArray(item.hints)) { for (let index = 0; index < item.hints.length; index += 1) checkValue(item.hints[index], `hints[${index}]`); }
  if (item.explanation) checkValue(item.explanation, 'explanation');
  return issues;
}

const ASCII_ID_REGEX = /\b[a-z0-9à-ỹ]+-[a-z0-9à-ỹ]+\b/i;
const JSON_RAW_REGEX = /[{}[\]]|"x"/;
const ENGLISH_STOPWORDS = [
  'ahead', 'behind', 'left', 'right',
  'north', 'south', 'east', 'west',
  'step', 'steps',
  'item', 'items',
  'candidate', 'candidates',
  'shape', 'shapes',
  'turn', 'turns',
  'fact', 'facts',
  'scene', 'scenes',
  'fix', 'fixes',
  'undefined', 'null', 'nan', 'object', 'array', 'true', 'false',
  'red', 'blue', 'green', 'yellow', 'purple', 'orange',
  'circle', 'square', 'star', 'triangle',
];
const ENGLISH_STOPWORD_REGEX = new RegExp(`\\b(${ENGLISH_STOPWORDS.join('|')})\\b`, 'i');

// Letters or digits around "_" mean an internal token like "kích_cỡ" leaked into child text.
const UNDERSCORE_TOKEN_REGEX = /[\p{L}\p{N}]_[\p{L}\p{N}]/u;
// Function words that are never legitimately doubled in Vietnamese child copy ("ở ở", "và và").
const DUPLICATE_WORD_REGEX = /(?:^|\s)(ở|và|là|của|các|một|những|thì|để|với|trong|cho|nên)\s+\1(?=[\s.,!?;:]|$)/iu;

export const POSITION_BIAS_MAX_SHARE = 0.6;
export const POSITION_BIAS_MIN_ITEMS = 20;

export function correctOptionIndex(item) {
  const options = item.boardData?.options;
  if (!Array.isArray(options) || options.length < 2) return null;
  if (typeof item.solution !== 'string' && typeof item.solution !== 'number') return null;
  const index = options.findIndex((option) => (option !== null && typeof option === 'object' && 'id' in option ? option.id : option) === item.solution);
  return index < 0 ? null : index;
}

// Per gameType, no single option slot may hold more than 60% of the correct answers.
export function positionBiasErrors(items) {
  const byType = new Map();
  for (const item of items) {
    const index = correctOptionIndex(item);
    if (index === null) continue;
    const stats = byType.get(item.gameTypeId) ?? { total: 0, positions: new Map() };
    stats.total += 1;
    stats.positions.set(index, (stats.positions.get(index) ?? 0) + 1);
    byType.set(item.gameTypeId, stats);
  }
  const errors = [];
  for (const [gameTypeId, { total, positions }] of byType) {
    if (total < POSITION_BIAS_MIN_ITEMS) continue;
    for (const [position, count] of positions) {
      if (count / total > POSITION_BIAS_MAX_SHARE) {
        errors.push({
          code: 'answer_position_bias',
          id: gameTypeId,
          gameTypeId,
          message: `${gameTypeId}: correct answer is option #${position + 1} in ${count}/${total} items (> ${POSITION_BIAS_MAX_SHARE * 100}%)`,
        });
      }
    }
  }
  return errors;
}

export function copyAuditErrors(item) {
  const errors = [];
  const childTexts = [
    { path: 'title', value: item.title },
    { path: 'invitation', value: item.invitation },
    { path: 'tutorial', value: item.tutorial },
    { path: 'explanation', value: item.explanation },
  ];
  if (Array.isArray(item.hints)) {
    item.hints.forEach((hint, idx) => {
      childTexts.push({ path: `hints[${idx}]`, value: hint });
    });
  }

  for (const { path, value } of childTexts) {
    if (typeof value !== 'string') continue;

    const idMatch = value.match(ASCII_ID_REGEX);
    if (idMatch) {
      errors.push({
        code: 'copy_internal_id',
        path,
        message: `Internal id token "${idMatch[0]}" found in child text`,
        snippet: value.slice(0, 120),
      });
    }

    const jsonMatch = value.match(JSON_RAW_REGEX);
    if (jsonMatch) {
      errors.push({
        code: 'copy_raw_json',
        path,
        message: `Raw JSON/bracket/coord token "${jsonMatch[0]}" found in child text`,
        snippet: value.slice(0, 120),
      });
    }

    const underscoreMatch = value.match(UNDERSCORE_TOKEN_REGEX);
    if (underscoreMatch) {
      errors.push({
        code: 'copy_underscore_token',
        path,
        message: `Underscore token "${underscoreMatch[0]}" found in child text`,
        snippet: value.slice(0, 120),
      });
    }

    const duplicateMatch = value.match(DUPLICATE_WORD_REGEX);
    if (duplicateMatch) {
      errors.push({
        code: 'copy_duplicate_word',
        path,
        message: `Duplicated word "${duplicateMatch[1]} ${duplicateMatch[1]}" found in child text`,
        snippet: value.slice(0, 120),
      });
    }

    const enMatch = value.match(ENGLISH_STOPWORD_REGEX);
    if (enMatch) {
      errors.push({
        code: 'copy_english_word',
        path,
        message: `English stopword "${enMatch[0]}" found in child text`,
        snippet: value.slice(0, 120),
      });
    }
  }

  if (Array.isArray(item.hints) && item.hints.length > 0 && typeof item.hints[0] === 'string') {
    const hint1Clean = item.hints[0].trim().toLowerCase();
    const solClean = String(item.solution ?? '').trim().toLowerCase();
    if (hint1Clean.length > 0 && hint1Clean === solClean) {
      errors.push({
        code: 'copy_hint1_equals_answer',
        path: 'hints[0]',
        message: `Hint 1 is identical to solution: "${item.hints[0]}"`,
      });
    }
  }

  return errors;
}

export function normalizedStructuralSignature(item) {
  const board = item.boardData;
  const structural = { kind: board.kind };
  if (board.kind === 'rule-sequence') { structural.ruleKind = board.ruleKind; structural.period = board.period; structural.sequenceLength = board.sequence.length; structural.optionCount = board.options.length; }
  else if (board.kind === 'path-planning') { structural.width = board.width; structural.height = board.height; structural.wallCount = board.walls.length; structural.waypointCount = board.waypoints.length; structural.waypointOrder = board.waypointOrder; structural.shortestPathOnly = board.shortestPathOnly; }
  else if (board.kind === 'memory-sequence') { structural.mode = board.mode; structural.sequenceLength = board.sequence?.length ?? 0; structural.optionCount = board.options?.length ?? 0; structural.groupCount = board.groups?.length ?? 0; }
  else { structural.boardJson = JSON.stringify(board); }
  structural.solutionType = Array.isArray(item.solution) ? 'array' : typeof item.solution;
  return JSON.stringify(structural);
}

function loadBatch(batch) { const document = JSON.parse(readFileSync(batchPath(batch), 'utf8')); return document.items; }
function loadManifest() { const manifestPath = join(V2_CANDIDATE_ROOT, 'candidate-manifest-v2.json'); return JSON.parse(readFileSync(manifestPath, 'utf8')); }
function loadCandidateMeta() { const metaPath = join(V2_CANDIDATE_ROOT, 'candidate-meta-v2.json'); return JSON.parse(readFileSync(metaPath, 'utf8')); }

function addCoverageIssues(items, errors, batch = null) {
  const dayTrackSlot = new Map(); const dayTrackType = new Map();
  for (const item of items) {
    const key = `${item.ageTrack}:${item.dayIndex}`;
    const slots = dayTrackSlot.get(key) ?? new Set(); slots.add(item.slotType); dayTrackSlot.set(key, slots);
    const types = dayTrackType.get(key) ?? new Set(); types.add(item.gameTypeId); dayTrackType.set(key, types);
  }
  for (const [key, slots] of dayTrackSlot.entries()) {
    const [ageTrack, dayStr] = key.split(':'); const day = Number(dayStr);
    if (slots.size !== 2) pushIssue(errors, { code: 'track_slots', path: `${ageTrack}.day${day}`, message: `expected 2 slots, found ${slots.size}` });
    const types = dayTrackType.get(key) ?? new Set();
    if (types.size !== 2) pushIssue(errors, { code: 'track_types', path: `${ageTrack}.day${day}`, message: `expected 2 distinct types, found ${types.size}` });
  }
  const trackDays = new Map();
  for (const item of items) { const days = trackDays.get(item.ageTrack) ?? new Set(); days.add(item.dayIndex); trackDays.set(item.ageTrack, days); }

  const startDay = batch ? batch.startDay : 1;
  const endDay = batch ? batch.endDay : 365;
  const expectedDays = endDay - startDay + 1;
  const expectedTrackItems = expectedDays * 2;

  for (const [ageTrack, days] of trackDays.entries()) {
    if (days.size !== expectedDays) pushIssue(errors, { code: 'track_days', path: ageTrack, message: `expected ${expectedDays} days, found ${days.size}` });
    for (let day = startDay; day <= endDay; day += 1) { if (!days.has(day)) pushIssue(errors, { code: 'day_coverage', path: `${ageTrack}.day${day}`, message: 'missing day' }); }
  }
  for (const ageTrack of trackDays.keys()) {
    const trackItems = items.filter((item) => item.ageTrack === ageTrack);
    if (trackItems.length !== expectedTrackItems) pushIssue(errors, { code: 'track_count', path: ageTrack, message: `expected ${expectedTrackItems} items, found ${trackItems.length}` });
  }
}

async function checkBatch(batch, { write = true } = {}) {
  const loaded = await loadEngine();
  try {
    const engine = loaded.engine;
    const editorial = readEditorialRows();
    const items = loadBatch(batch);
    const audit = {
      auditVersion: 'p08-candidate-audit-v2',
      scope: 'batch',
      generatedAt: GENERATED_AT,
      contentVersion: V2_CONTENT_VERSION,
      batch: batch.number,
      metrics: {
        itemCount: 0,
        schemaPass: 0,
        knownPass: 0,
        solvePass: 0,
        wrongPass: 0,
        malformedPass: 0,
        alternateApplicable: 0,
        alternatePass: 0,
        uniqueFingerprints: 0,
        uniqueNormalized: 0,
        tracks: {},
        initialTracks: 0,
        experimentalTracks: 0,
        types: 0,
        variants: 0,
        skills: 0,
        minTypeSpacing: 0,
        structuralReuseWarnings: [],
      },
      checks: {
        schema: false,
        knownAnswer: false,
        solver: false,
        wrongAnswerRejected: false,
        malformedRejected: false,
        alternateWhereApplicable: false,
        copy: false,
        provenance: false,
        fingerprintsUnique: false,
        normalizedUnique: false,
      },
      quality: {
        duplicateFingerprints: 0,
        normalizedCollisions: 0,
        ageComplexityWarnings: 0,
        structuralReusePairs: 0,
        blocked: false,
      },
      releaseRejection: null,
      errors: [],
      warnings: [],
    };
    const fingerprints = new Map();
    const normalized = new Map();
    const structuralReuse = new Map();
    const coverageErrors = [];
    const usedAlternate = new Set();
    for (const item of items) {
      audit.metrics.itemCount += 1;
      const validated = engine.validatePuzzle(item);
      if (!validated.ok) {
        pushIssue(audit.errors, { code: 'schema', id: item.id, message: validated.details.join('; ') });
      } else {
        audit.metrics.schemaPass += 1;
      }
      const solved = engine.solvePuzzle(item);
      if (!solved.ok || !sameAnswerForAudit(solved.solution, item.solution, item.gameTypeId)) {
        pushIssue(audit.errors, { code: 'known_answer_rejected', id: item.id, message: solved.ok ? 'solver mismatch' : solved.code });
      } else {
        audit.metrics.knownPass += 1;
      }
      const checked = engine.checkAnswer(item, item.solution);
      if (!checked.ok || !checked.correct) {
        pushIssue(audit.errors, { code: 'invalid_puzzle', id: item.id, message: 'solution fails checker' });
      } else {
        audit.metrics.solvePass += 1;
      }
      const wrong = wrongAnswer(item, engine);
      if (!wrong.ok) {
        pushIssue(audit.errors, { code: 'wrong_answer_accepted', id: item.id, message: wrong.message });
      } else {
        audit.metrics.wrongPass += 1;
      }
      const malformed = malformedAnswer(item, engine);
      if (!malformed.ok) {
        pushIssue(audit.errors, { code: 'malformed_accepted', id: item.id, message: malformed.message });
      } else {
        audit.metrics.malformedPass += 1;
      }
      // g04-t2 audit check: flag items with more than one rule-valid option
      if (item.gameTypeId === 'g04-t2' && item.boardData.kind === 'reasoning-if-then') {
        const board = item.boardData;
        const known = new Set(board.facts);
        const closure = new Set(board.facts);
        let changed = true;
        while (changed) {
          changed = false;
          for (const rule of board.rules) {
            if (closure.has(rule.if) && !closure.has(rule.then)) {
              closure.add(rule.then);
              changed = true;
            }
          }
        }
        const ruleValidOptions = board.options.filter((opt) => typeof opt === 'string' && !known.has(opt) && closure.has(opt));
        if (ruleValidOptions.length !== 1) {
          pushIssue(audit.errors, {
            code: 'g04_t2_multiple_valid_options',
            id: item.id,
            message: `g04-t2 item has ${ruleValidOptions.length} rule-valid options (expected 1): ${ruleValidOptions.join(', ')}`
          });
        }
      }
      const alternate = alternateAnswer(item, engine);
      if (alternate.applicable) {
        audit.metrics.alternateApplicable += 1;
        if (alternate.ok) {
          audit.metrics.alternatePass += 1;
          usedAlternate.add(item.id);
        } else {
          pushIssue(audit.errors, { code: 'alternate_missing', id: item.id, message: alternate.message });
        }
      }
      for (const issue of copyCheck(item)) {
        pushIssue(audit.warnings, { ...issue, id: item.id });
      }
      for (const error of copyAuditErrors(item)) {
        pushIssue(audit.errors, { ...error, id: item.id });
      }
      if (item.source?.commit !== loaded.engineHash) {
        pushIssue(audit.errors, { code: 'provenance', id: item.id, message: 'item engine hash mismatch' });
      } else {
        audit.metrics.provenance = true;
      }
      const fp = item.fingerprint;
      const existing = fingerprints.get(fp) ?? [];
      existing.push(item.id);
      fingerprints.set(fp, existing);
      const norm = normalizedStructuralSignature(item);
      const existingNorm = normalized.get(norm) ?? [];
      existingNorm.push(item.id);
      normalized.set(norm, existingNorm);
      if (!structuralReuse.has(item.ruleVariantId)) structuralReuse.set(item.ruleVariantId, new Set());
      const set = structuralReuse.get(item.ruleVariantId); if (set) set.add(`${item.ageTrack}:${item.dayIndex}`);
    }
    audit.metrics.uniqueFingerprints = fingerprints.size;
    audit.metrics.uniqueNormalized = normalized.size;
    for (const error of positionBiasErrors(items)) pushIssue(audit.errors, error);
    for (const ids of fingerprints.values()) {
      if (ids.length > 1) {
        audit.metrics.duplicateFingerprints += ids.length - 1;
        for (let index = 1; index < ids.length; index += 1) {
          pushIssue(audit.warnings, { code: 'duplicate_fingerprint', id: ids[index], other: ids[0] });
        }
      }
    }
    for (const ids of normalized.values()) {
      if (ids.length > 1) {
        audit.metrics.normalizedCollisions += ids.length - 1;
        for (let index = 1; index < ids.length; index += 1) {
          pushIssue(audit.warnings, { code: 'normalized_skin_duplicate', id: ids[index], other: ids[0] });
        }
      }
    }
    const trackComplexity = new Map();
    for (const item of items) {
      const target = engine.targetSecondsForAge(item.ageTrack);
      const key = `${item.gameTypeId}|${item.ruleVariantId}|${item.ageTrack}`;
      let stats = trackComplexity.get(key);
      if (!stats) { stats = { total: 0, within: 0, over: 0 }; trackComplexity.set(key, stats); }
      stats.total += 1;
      if (item.targetSeconds <= target) stats.within += 1;
      else stats.over += 1;
    }
    for (const [key, stats] of trackComplexity.entries()) {
      if (stats.over > 0) {
        audit.metrics.ageComplexityWarnings += 1;
        pushIssue(audit.warnings, { code: 'age_complexity', message: `${key}: ${stats.over}/${stats.total} over target` });
      }
    }
    const reuseWarnings = [];
    for (const [variant, dayTracks] of structuralReuse.entries()) {
      if (dayTracks.size > 1) {
        for (const dt of dayTracks) { reuseWarnings.push(`${variant}|${dt}`); }
        audit.metrics.structuralReusePairs += dayTracks.size - 1;
      }
    }
    audit.metrics.structuralReuseWarnings = reuseWarnings.sort();
    const tracks = {};
    for (const item of items) { tracks[item.ageTrack] = (tracks[item.ageTrack] ?? 0) + 1; }
    audit.metrics.tracks = tracks;
    audit.metrics.initialTracks = (tracks.age_6_8 ?? 0) + (tracks.age_9_12 ?? 0);
    audit.metrics.experimentalTracks = (tracks.age_3_5 ?? 0) + (tracks.age_13_plus ?? 0);
    audit.metrics.types = new Set(items.map((item) => item.gameTypeId)).size;
    audit.metrics.variants = new Set(items.map((item) => item.ruleVariantId)).size;
    audit.metrics.skills = new Set(items.map((item) => item.skillGroup)).size;
    const typeDays = new Map();
    for (const item of items) { const arr = typeDays.get(item.gameTypeId) ?? []; arr.push(item.dayIndex); typeDays.set(item.gameTypeId, arr); }
    let minSpacing = Number.POSITIVE_INFINITY;
    for (const days of typeDays.values()) {
      const sorted = [...new Set(days)].sort((a, b) => a - b);
      for (let index = 1; index < sorted.length; index += 1) { minSpacing = Math.min(minSpacing, sorted[index] - sorted[index - 1]); }
    }
    audit.metrics.minTypeSpacing = Number.isFinite(minSpacing) ? minSpacing : 0;
    audit.checks.schema = audit.metrics.schemaPass === items.length;
    audit.checks.knownAnswer = audit.metrics.knownPass === items.length;
    audit.checks.solver = audit.metrics.solvePass === items.length;
    audit.checks.wrongAnswerRejected = audit.metrics.wrongPass === items.length;
    audit.checks.malformedRejected = audit.metrics.malformedPass === items.length;
    audit.checks.alternateWhereApplicable = audit.metrics.alternatePass === audit.metrics.alternateApplicable;
    audit.checks.copy = audit.warnings.filter((w) => w.code === 'copy_forbidden').length === 0
      && audit.errors.filter((e) => e.code?.startsWith('copy_')).length === 0;
    audit.checks.provenance = audit.metrics.provenance === true;
    audit.checks.fingerprintsUnique = audit.metrics.duplicateFingerprints === 0;
    audit.checks.normalizedUnique = audit.metrics.normalizedCollisions === 0;
    audit.quality.blocked = audit.metrics.duplicateFingerprints > 0 || audit.metrics.normalizedCollisions > 0;
    addCoverageIssues(items, coverageErrors, batch);
    const result = {
      auditVersion: 'p08-candidate-audit-v2',
      scope: 'batch',
      generatedAt: GENERATED_AT,
      contentVersion: V2_CONTENT_VERSION,
      batch: batch.number,
      sourceHash: editorial.csvHash,
      engineVersion: loaded.engineVersion,
      engineHash: loaded.engineHash,
      inputSha256: sha256(readFileSync(batchPath(batch))),
      csvSha256: editorial.csvHash,
      metrics: audit.metrics,
      checks: audit.checks,
      quality: audit.quality,
      errors: [...audit.errors, ...coverageErrors],
      warnings: audit.warnings,
      status: audit.errors.length > 0 || coverageErrors.length > 0
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

async function checkAll({ write = true } = {}) {
  const loaded = await loadEngine();
  try {
    const engine = loaded.engine;
    const editorial = readEditorialRows();
    const manifest = loadManifest();
    const meta = loadCandidateMeta();
    const audit = {
      auditVersion: 'p08-candidate-audit-v2',
      scope: 'catalog',
      generatedAt: GENERATED_AT,
      contentVersion: V2_CONTENT_VERSION,
      metrics: {
        itemCount: 0,
        schemaPass: 0,
        knownPass: 0,
        solvePass: 0,
        wrongPass: 0,
        malformedPass: 0,
        alternateApplicable: 0,
        alternatePass: 0,
        uniqueFingerprints: 0,
        uniqueNormalized: 0,
        tracks: {},
        initialTracks: 0,
        experimentalTracks: 0,
        types: 0,
        variants: 0,
        skills: 0,
        minTypeSpacing: 0,
        structuralReuseWarnings: [],
      },
      checks: {
        schema: false,
        knownAnswer: false,
        solver: false,
        wrongAnswerRejected: false,
        malformedRejected: false,
        alternateWhereApplicable: false,
        copy: false,
        provenance: false,
        fingerprintsUnique: false,
        normalizedUnique: false,
      },
      quality: {
        duplicateFingerprints: 0,
        normalizedCollisions: 0,
        ageComplexityWarnings: 0,
        structuralReusePairs: 0,
        blocked: false,
      },
      releaseRejection: null,
      errors: [],
      warnings: [],
    };
    const fingerprints = new Map();
    const normalized = new Map();
    const structuralReuse = new Map();
    const allItems = manifest.items;
    const usedAlternate = new Set();
    for (const item of allItems) {
      audit.metrics.itemCount += 1;
      const validated = engine.validatePuzzle(item);
      if (!validated.ok) {
        pushIssue(audit.errors, { code: 'schema', id: item.id, message: validated.details.join('; ') });
      } else {
        audit.metrics.schemaPass += 1;
      }
      const solved = engine.solvePuzzle(item);
      if (!solved.ok || !sameAnswerForAudit(solved.solution, item.solution, item.gameTypeId)) {
        pushIssue(audit.errors, { code: 'known_answer_rejected', id: item.id, message: solved.ok ? 'solver mismatch' : solved.code });
      } else {
        audit.metrics.knownPass += 1;
      }
      const checked = engine.checkAnswer(item, item.solution);
      if (!checked.ok || !checked.correct) {
        pushIssue(audit.errors, { code: 'invalid_puzzle', id: item.id, message: 'solution fails checker' });
      } else {
        audit.metrics.solvePass += 1;
      }
      const wrong = wrongAnswer(item, engine);
      if (!wrong.ok) {
        pushIssue(audit.errors, { code: 'wrong_answer_accepted', id: item.id, message: wrong.message });
      } else {
        audit.metrics.wrongPass += 1;
      }
      const malformed = malformedAnswer(item, engine);
      if (!malformed.ok) {
        pushIssue(audit.errors, { code: 'malformed_accepted', id: item.id, message: malformed.message });
      } else {
        audit.metrics.malformedPass += 1;
      }
      // g04-t2 audit check: flag items with more than one rule-valid option
      if (item.gameTypeId === 'g04-t2' && item.boardData.kind === 'reasoning-if-then') {
        const board = item.boardData;
        const known = new Set(board.facts);
        const closure = new Set(board.facts);
        let changed = true;
        while (changed) {
          changed = false;
          for (const rule of board.rules) {
            if (closure.has(rule.if) && !closure.has(rule.then)) {
              closure.add(rule.then);
              changed = true;
            }
          }
        }
        const ruleValidOptions = board.options.filter((opt) => typeof opt === 'string' && !known.has(opt) && closure.has(opt));
        if (ruleValidOptions.length !== 1) {
          pushIssue(audit.errors, {
            code: 'g04_t2_multiple_valid_options',
            id: item.id,
            message: `g04-t2 item has ${ruleValidOptions.length} rule-valid options (expected 1): ${ruleValidOptions.join(', ')}`
          });
        }
      }
      const alternate = alternateAnswer(item, engine);
      if (alternate.applicable) {
        audit.metrics.alternateApplicable += 1;
        if (alternate.ok) {
          audit.metrics.alternatePass += 1;
          usedAlternate.add(item.id);
        } else {
          pushIssue(audit.errors, { code: 'alternate_missing', id: item.id, message: alternate.message });
        }
      }
      for (const issue of copyCheck(item)) {
        pushIssue(audit.warnings, { ...issue, id: item.id });
      }
      for (const error of copyAuditErrors(item)) {
        pushIssue(audit.errors, { ...error, id: item.id });
      }
      if (item.source?.commit !== loaded.engineHash) {
        pushIssue(audit.errors, { code: 'provenance', id: item.id, message: 'item engine hash mismatch' });
      } else {
        audit.metrics.provenance = true;
      }
      const fp = item.fingerprint;
      const existing = fingerprints.get(fp) ?? [];
      existing.push(item.id);
      fingerprints.set(fp, existing);
      const norm = normalizedStructuralSignature(item);
      const existingNorm = normalized.get(norm) ?? [];
      existingNorm.push(item.id);
      normalized.set(norm, existingNorm);
      if (!structuralReuse.has(item.ruleVariantId)) structuralReuse.set(item.ruleVariantId, new Set());
      const set = structuralReuse.get(item.ruleVariantId); if (set) set.add(`${item.ageTrack}:${item.dayIndex}`);
    }
    audit.metrics.uniqueFingerprints = fingerprints.size;
    audit.metrics.uniqueNormalized = normalized.size;
    for (const error of positionBiasErrors(allItems)) pushIssue(audit.errors, error);
    for (const ids of fingerprints.values()) {
      if (ids.length > 1) {
        audit.metrics.duplicateFingerprints += ids.length - 1;
        for (let index = 1; index < ids.length; index += 1) {
          pushIssue(audit.warnings, { code: 'duplicate_fingerprint', id: ids[index], other: ids[0] });
        }
      }
    }
    for (const ids of normalized.values()) {
      if (ids.length > 1) {
        audit.metrics.normalizedCollisions += ids.length - 1;
        for (let index = 1; index < ids.length; index += 1) {
          pushIssue(audit.warnings, { code: 'normalized_skin_duplicate', id: ids[index], other: ids[0] });
        }
      }
    }
    const trackComplexity = new Map();
    for (const item of allItems) {
      const target = engine.targetSecondsForAge(item.ageTrack);
      const key = `${item.gameTypeId}|${item.ruleVariantId}|${item.ageTrack}`;
      let stats = trackComplexity.get(key);
      if (!stats) { stats = { total: 0, within: 0, over: 0 }; trackComplexity.set(key, stats); }
      stats.total += 1;
      if (item.targetSeconds <= target) stats.within += 1;
      else stats.over += 1;
    }
    for (const [key, stats] of trackComplexity.entries()) {
      if (stats.over > 0) {
        audit.metrics.ageComplexityWarnings += 1;
        pushIssue(audit.warnings, { code: 'age_complexity', message: `${key}: ${stats.over}/${stats.total} over target` });
      }
    }
    const reuseWarnings = [];
    for (const [variant, dayTracks] of structuralReuse.entries()) {
      if (dayTracks.size > 1) {
        for (const dt of dayTracks) { reuseWarnings.push(`${variant}|${dt}`); }
        audit.metrics.structuralReusePairs += dayTracks.size - 1;
      }
    }
    audit.metrics.structuralReuseWarnings = reuseWarnings.sort();
    const tracks = {};
    for (const item of allItems) { tracks[item.ageTrack] = (tracks[item.ageTrack] ?? 0) + 1; }
    audit.metrics.tracks = tracks;
    audit.metrics.initialTracks = (tracks.age_6_8 ?? 0) + (tracks.age_9_12 ?? 0);
    audit.metrics.experimentalTracks = (tracks.age_3_5 ?? 0) + (tracks.age_13_plus ?? 0);
    audit.metrics.types = new Set(allItems.map((item) => item.gameTypeId)).size;
    audit.metrics.variants = new Set(allItems.map((item) => item.ruleVariantId)).size;
    audit.metrics.skills = new Set(allItems.map((item) => item.skillGroup)).size;
    const typeDays = new Map();
    for (const item of allItems) { const arr = typeDays.get(item.gameTypeId) ?? []; arr.push(item.dayIndex); typeDays.set(item.gameTypeId, arr); }
    let minSpacing = Number.POSITIVE_INFINITY;
    for (const days of typeDays.values()) {
      const sorted = [...new Set(days)].sort((a, b) => a - b);
      for (let index = 1; index < sorted.length; index += 1) { minSpacing = Math.min(minSpacing, sorted[index] - sorted[index - 1]); }
    }
    audit.metrics.minTypeSpacing = Number.isFinite(minSpacing) ? minSpacing : 0;
    audit.checks.schema = audit.metrics.schemaPass === allItems.length;
    audit.checks.knownAnswer = audit.metrics.knownPass === allItems.length;
    audit.checks.solver = audit.metrics.solvePass === allItems.length;
    audit.checks.wrongAnswerRejected = audit.metrics.wrongPass === allItems.length;
    audit.checks.malformedRejected = audit.metrics.malformedPass === allItems.length;
    audit.checks.alternateWhereApplicable = audit.metrics.alternatePass === audit.metrics.alternateApplicable;
    audit.checks.copy = audit.warnings.filter((w) => w.code === 'copy_forbidden').length === 0
      && audit.errors.filter((e) => e.code?.startsWith('copy_')).length === 0;
    audit.checks.provenance = audit.metrics.provenance === true;
    audit.checks.fingerprintsUnique = audit.metrics.duplicateFingerprints === 0;
    audit.checks.normalizedUnique = audit.metrics.normalizedCollisions === 0;
    audit.quality.blocked = audit.metrics.duplicateFingerprints > 0 || audit.metrics.normalizedCollisions > 0;
    const release = engine.validateManifest(manifest, { profile: 'release' });
    audit.releaseRejection = { ok: release.ok, errors: release.errors ?? [] };
    const coverageErrors = [];
    if (manifest.coverage?.dayCount !== 365 || manifest.coverage?.slotsPerDay !== 2 || manifest.coverage?.typeIds !== 24 || manifest.coverage?.variantPairs !== 96) {
      pushIssue(coverageErrors, { code: 'coverage_claim', message: JSON.stringify(manifest.coverage) });
    }
    if (meta.sourceHash !== editorial.csvHash) pushIssue(coverageErrors, { code: 'csv_hash', message: 'meta source hash mismatch' });
    if (manifest.manifestVersion !== V2_CONTENT_VERSION) pushIssue(coverageErrors, { code: 'manifest_version', message: manifest.manifestVersion });
    addCoverageIssues(manifest.items, coverageErrors);
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
      auditVersion: 'p08-candidate-audit-v2',
      scope: 'catalog',
      generatedAt: GENERATED_AT,
      contentVersion: V2_CONTENT_VERSION,
      sourceHash: meta.sourceHash,
      engineVersion: meta.engineVersion,
      inputSha256: sha256(readFileSync(join(V2_CANDIDATE_ROOT, 'candidate-manifest-v2.json'))),
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
      writeFileSync(join(auditDir, 'p08-365-v2-catalog.json'), `${JSON.stringify(result, null, 2)}\n`);
    }
    return { path: join(auditDir, 'p08-365-v2-catalog.json'), result };
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
    const batch = BATCHES.find((entry) => entry.number === number);
    if (!batch) throw new Error(`unknown batch ${number}`);
    output = await checkBatch(batch);
  } else if (args.has('--all')) {
    output = await checkAll();
  } else {
    throw new Error('usage: node scripts/check-thinking-games-candidates-v2.mjs --batch=1 | --all');
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

export { loadBatch, loadManifest, loadCandidateMeta, addCoverageIssues };
export function auditItems(items, { engine }) {
  const errors = [];
  const warnings = [];
  const fingerprints = new Map();
  const normalized = new Map();
  const ids = new Set();
  for (const item of items) {
    if (ids.has(item.id)) {
      errors.push({ code: 'duplicate_id', id: item.id });
    }
    ids.add(item.id);
    const validated = engine.validatePuzzle(item);
    if (!validated.ok) {
      errors.push({ code: 'schema', id: item.id, message: validated.details.join('; ') });
    } else {
      const checked = engine.checkAnswer(item, item.solution);
      if (!checked.ok || !checked.correct) {
        errors.push({ code: 'invalid_puzzle', id: item.id, message: 'solution fails checker' });
      }
    }
    for (const error of copyAuditErrors(item)) {
      errors.push({ ...error, id: item.id });
    }
    const fp = item.fingerprint;
    const existing = fingerprints.get(fp) ?? [];
    existing.push(item.id);
    fingerprints.set(fp, existing);
    const norm = normalizedStructuralSignature(item);
    const existingNorm = normalized.get(norm) ?? [];
    existingNorm.push(item.id);
    normalized.set(norm, existingNorm);
  }
  for (const idList of fingerprints.values()) {
    if (idList.length > 1) {
      for (let index = 1; index < idList.length; index += 1) {
        warnings.push({ code: 'duplicate_fingerprint', id: idList[index], other: idList[0] });
      }
    }
  }
  for (const idList of normalized.values()) {
    if (idList.length > 1) {
      for (let index = 1; index < idList.length; index += 1) {
        warnings.push({ code: 'normalized_skin_duplicate', id: idList[index], other: idList[0] });
      }
    }
  }
  errors.push(...positionBiasErrors(items));
  // Minimal metrics to satisfy V1 auditItems type compatibility
  const metrics = {
    itemCount: items.length,
    schemaPass: 0,
    knownPass: 0,
    solvePass: 0,
    wrongPass: 0,
    malformedPass: 0,
    alternateApplicable: 0,
    alternatePass: 0,
    uniqueFingerprints: 0,
    uniqueNormalized: 0,
    tracks: {},
    initialTracks: 0,
    experimentalTracks: 0,
    types: 0,
    variants: 0,
    skills: 0,
    minTypeSpacing: 0,
    structuralReuseWarnings: [],
    duplicateFingerprints: 0,
    normalizedCollisions: 0,
    ageComplexityWarnings: 0,
    structuralReusePairs: 0,
    provenance: false,
  };
  const releaseRejection = { rejected: false, expected: false, codes: {} };
  return { errors, warnings, metrics, checks: { schema: false, knownAnswer: false, solver: false, wrongAnswerRejected: false, malformedRejected: false, alternateWhereApplicable: false, copy: false, provenance: false, fingerprintsUnique: false, normalizedUnique: false }, quality: { duplicateFingerprints: 0, normalizedCollisions: 0, ageComplexityWarnings: 0, structuralReusePairs: 0, blocked: false }, releaseRejection };
}
