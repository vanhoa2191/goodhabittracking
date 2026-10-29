import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const csvPath = join(root, 'docs/research/2026-10-17-daily-thinking-games-365.csv');
const V2_CANDIDATE_ROOT = join(root, 'content/thinking-games/candidates/365-v2');
const V2_CONTENT_VERSION = 'p08-candidates-365-v2';
const GENERATED_AT = '2026-10-22T00:00:00.000Z';
const SOURCE_REPO = 'vanhoa2191/goodhabittracking';
const SOURCE_URL = 'https://github.com/vanhoa2191/goodhabittracking';
const LOCALE = 'vi';

const BATCHES = [
  { number: 1, startDay: 1, endDay: 28 },
  { number: 2, startDay: 29, endDay: 91 },
  { number: 3, startDay: 92, endDay: 182 },
  { number: 4, startDay: 183, endDay: 273 },
  { number: 5, startDay: 274, endDay: 365 },
];

const SKILLS = new Map([
  ['Quy luật', 'rule'],
  ['Không gian', 'spatial'],
  ['Trí nhớ', 'memory'],
  ['Suy luận', 'reasoning'],
  ['Số lượng', 'quantity'],
  ['Lập kế hoạch', 'planning'],
  ['Linh hoạt', 'flexibility'],
  ['Quan sát', 'observation'],
]);

const AGE_CODE = new Map([
  ['age_3_5', '35'],
  ['age_6_8', '68'],
  ['age_9_12', '912'],
  ['age_13_plus', '13p'],
]);

const PRAISE_KEYS = {
  correct: 'thinkingGames.praise.correct',
  retry: 'thinkingGames.praise.tryAgain',
};

const SAFE_MEMORY_HINTS = [
  'Nhớ lại vị trí chỗ trống trong dãy.',
  'Đọc thầm từ đứng trước và từ đứng sau chỗ trống.',
];

const ORIGINAL_TUTORIALS = {
  'g01-t1': 'Nhìn kỹ nhịp lặp hoặc bước tăng, rồi chọn phần tiếp theo.',
  'g03-t1': 'Nhìn dãy thật kỹ; khi dãy ẩn đi, bạn xếp lại đúng thứ tự.',
  'g06-t1': 'Đi từ ô bắt đầu đến ô đích, tránh tường và ghé điểm cần qua.',
};

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

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

function readEditorialRows() {
  const csvText = readFileSync(csvPath, 'utf8');
  const [header, ...rows] = parseCsv(csvText);
  const index = new Map((header ?? []).map((name, position) => [name.replace(/^\uFEFF/, ''), position]));
  const get = (row, name) => row[index.get(name)] ?? '';
  return {
    csvText,
    csvHash: sha256(csvText),
    rows: rows.map((row) => ({
      day: Number(get(row, 'day')),
      main: {
        slotId: get(row, 'main_id'),
        typeId: get(row, 'main_type_id'),
        skill: get(row, 'main_skill'),
        variant: get(row, 'main_rule_variant'),
        title: get(row, 'main_title'),
        invitation: get(row, 'main_invitation'),
        targetSeconds: Number(get(row, 'main_target_seconds')),
        status: get(row, 'main_status'),
      },
      bonus: {
        slotId: get(row, 'bonus_id'),
        typeId: get(row, 'bonus_type_id'),
        skill: get(row, 'bonus_skill'),
        variant: get(row, 'bonus_rule_variant'),
        title: get(row, 'bonus_title'),
        invitation: get(row, 'bonus_invitation'),
        targetSeconds: Number(get(row, 'bonus_target_seconds')),
        status: get(row, 'bonus_status'),
      },
    })),
  };
}

function skillForCsv(csvSkill) {
  return SKILLS.get(csvSkill);
}

async function loadEngine() {
  const indexPath = join(root, 'src/lib/thinking-games/index.ts');
  const temp = mkdtempSync(join(tmpdir(), 'thinking-games-candidates-'));
  const outfile = join(temp, 'engine.mjs');
  await build({
    entryPoints: [indexPath],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
    sourcemap: false,
    legalComments: 'none',
  });
  const bundle = readFileSync(outfile);
  const engineHash = sha256(bundle);
  const engine = await import(`${pathToFileURL(outfile).href}?v=${engineHash}`);
  return {
    engine,
    engineHash,
    engineVersion: `engine-${engineHash.slice(0, 16)}`,
    cleanup: () => { try { rmSync(temp, { recursive: true, force: true }); } catch {} },
  };
}

function candidateId(slotId, ageTrack) {
  return `${slotId}-vi${AGE_CODE.get(ageTrack)}`;
}

function candidateSeed(slotId, ageTrack, variant, gameTypeId) {
  return `${V2_CONTENT_VERSION}|${slotId}|${ageTrack}|${LOCALE}|${gameTypeId}|${variant}`;
}

function asChecker(engine, typeId) {
  const mechanic = engine.getGameMechanic(typeId);
  if (!mechanic || !mechanic.checkerId || !mechanic.boardKind) {
    throw new Error(`missing implemented mechanic for ${typeId}`);
  }
  return mechanic;
}

function originalPayload(engine, slot, seed, ageTrack) {
  if (slot.typeId === 'g01-t1') {
    const board = engine.generateRuleSequencePuzzle({ seed, ageTrack, variant: slot.variant });
    return {
      boardData: board,
      solution: engine.solveRuleSequence(board),
      hints: engine.describeRuleSequenceBoard(board, { ageTrack, seed }).hints,
      explanation: engine.describeRuleSequenceBoard(board).explanation,
    };
  }
  if (slot.typeId === 'g03-t1') {
    const board = engine.generateMemorySequencePuzzle({ seed, ageTrack, variant: slot.variant });
    return {
      boardData: board,
      solution: engine.solveMemorySequence(board),
      hints: engine.describeMemorySequenceBoard(board, { ageTrack, seed }).hints,
      explanation: engine.describeMemorySequenceBoard(board).explanation,
    };
  }
  if (slot.typeId === 'g06-t1') {
    const board = engine.generatePathPuzzle({ seed, ageTrack, variant: slot.variant });
    return {
      boardData: board,
      solution: engine.solvePath(board),
      hints: engine.describePathBoard(board, { ageTrack, seed }).hints,
      explanation: engine.describePathBoard(board).explanation,
    };
  }
  throw new Error(`no original generator for ${slot.typeId}`);
}

function buildCandidate({ engine, slot, day, ageTrack, source, attempt = 0 }) {
  const mechanic = asChecker(engine, slot.typeId);
  const baseSeed = candidateSeed(slot.slotId, ageTrack, slot.variant, slot.typeId);
  const seed = attempt === 0 ? baseSeed : `${baseSeed}|attempt=${attempt}`;
  const original = ORIGINAL_TUTORIALS[slot.typeId] !== undefined;
  const generated = original ? null : engine.REMAINING_MECHANICS.find((entry) => entry.gameTypeId === slot.typeId)?.generate({ seed, ageTrack, variant: slot.variant });
  if (!original && !generated) throw new Error(`no remaining generator for ${slot.typeId}`);
  const payload = original ? originalPayload(engine, slot, seed, ageTrack) : { boardData: generated.board, solution: generated.solution, hints: generated.hints, explanation: generated.explanation };
  const fingerprint = engine.puzzleFingerprint(slot.typeId, payload.boardData);

  const invitation = typeof engine.getNaturalInvitation === 'function'
    ? engine.getNaturalInvitation(slot.typeId, day, seed, ageTrack)
    : slot.invitation;
  const tutorial = typeof engine.getNaturalTutorial === 'function'
    ? engine.getNaturalTutorial(slot.typeId, ageTrack, day, seed, payload.boardData)
    : (ORIGINAL_TUTORIALS[slot.typeId] ?? generated.tutorial);

  return {
    schemaVersion: 1,
    contentVersion: V2_CONTENT_VERSION,
    id: candidateId(slot.slotId, ageTrack),
    dayIndex: day,
    slotType: slot.slotId.endsWith('-bonus') ? 'bonus' : 'main',
    skillGroup: mechanic.skillGroup,
    gameTypeId: slot.typeId,
    ruleVariantId: `${slot.typeId}:${slot.variant}`,
    ageTrack,
    locale: LOCALE,
    title: slot.title,
    invitation,
    tutorial,
    explanation: payload.explanation,
    boardData: payload.boardData,
    solution: payload.solution,
    validSolutionPredicate: mechanic.checkerId,
    hints: payload.hints,
    praiseKeys: generated?.praiseKeys ?? PRAISE_KEYS,
    targetSeconds: engine.targetSecondsForAge(ageTrack, day <= 91 ? 0 : day <= 182 ? 1 : day <= 273 ? 2 : 3),
    status: 'design_only',
    fingerprint,
    source,
    editorial: null,
  };
}

// Titles come from a per-track system (name + frame picked by seed). A title may not repeat the
// previous day's titles of the same track, so the pick steps past anything in `avoid`.
function variedTitle({ engine, titleState, slot, ageTrack, day }) {
  const state = titleState.get(ageTrack) ?? { day: 0, previous: new Set(), current: new Set() };
  if (state.day !== day) {
    state.previous = state.day === day - 1 ? state.current : new Set();
    state.current = new Set();
    state.day = day;
  }
  const title = engine.getVariedTitle({
    gameTypeId: slot.typeId,
    theme: engine.themeOfTitle(slot.title),
    ageTrack,
    slotId: slot.slotId,
    avoid: new Set([...state.previous, ...state.current]),
  });
  state.current.add(title);
  titleState.set(ageTrack, state);
  return title;
}

function normalizedCandidateSignature(item) {
  const board = item.boardData;
  const normalized = board.kind === 'path-planning'
    ? { ...board, walls: [...board.walls].sort((a, b) => a.x - b.x || a.y - b.y), waypoints: [...board.waypoints].sort((a, b) => a.id.localeCompare(b.id)) }
    : 'options' in board && Array.isArray(board.options)
      ? { ...board, options: [...board.options].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) }
      : board;
  return JSON.stringify({ board: normalized, solutionType: Array.isArray(item.solution) ? 'array' : typeof item.solution });
}

function generateBatch({ engine, editorial, candidateSource, ageTracks, usedFingerprints = new Set(), usedNormalized = new Set(), titleState = new Map() }, batch) {
  const items = [];
  const mapping = [];
  const selectedRows = editorial.rows.filter((row) => row.day >= batch.startDay && row.day <= batch.endDay);
  for (const row of selectedRows) {
    for (const [slotType, slot] of [['main', row.main], ['bonus', row.bonus]]) {
      if (slot.status !== 'design_only') throw new Error(`${slot.slotId}: CSV status must stay design_only`);
      if (!slot.slotId.startsWith(`D${String(row.day).padStart(3, '0')}-${slotType}`)) {
        throw new Error(`${slot.slotId}: unexpected CSV slot id for day ${row.day} ${slotType}`);
      }
      if (skillForCsv(slot.skill) !== engine.getGameMechanic(slot.typeId)?.skillGroup) {
        throw new Error(`${slot.slotId}: CSV skill does not match registry`);
      }
      if (!engine.isRuleVariantForGame(slot.typeId, `${slot.typeId}:${slot.variant}`)) {
        throw new Error(`${slot.slotId}: unknown variant ${slot.typeId}:${slot.variant}`);
      }
      for (const ageTrack of ageTracks) {
        let item = null;
        let attempt = 0;
        let duplicateAfterAttempts = false;
        let fallback = null;
        let fallbackAttempt = 0;
        for (attempt = 0; attempt <= 20; attempt += 1) {
          item = buildCandidate({ engine, slot, day: row.day, ageTrack, source: candidateSource, attempt });
          const accepted = engine.checkAnswer(item, item.solution);
          if (!accepted.ok || !accepted.correct || usedFingerprints.has(item.fingerprint)) continue;
          if (!fallback) { fallback = item; fallbackAttempt = attempt; }
          if (!usedNormalized.has(normalizedCandidateSignature(item))) break;
        }
        if (attempt > 20 && fallback) {
          item = fallback;
          attempt = fallbackAttempt;
        }
        item.title = variedTitle({ engine, titleState, slot, ageTrack, day: row.day });
        if (usedFingerprints.has(item.fingerprint) || usedNormalized.has(normalizedCandidateSignature(item))) duplicateAfterAttempts = true;
        usedFingerprints.add(item.fingerprint);
        usedNormalized.add(normalizedCandidateSignature(item));
        items.push(item);
        mapping.push({
          day: row.day,
          slotType,
          slotId: slot.slotId,
          candidateId: item.id,
          ageTrack,
          gameTypeId: item.gameTypeId,
          ruleVariantId: item.ruleVariantId,
          seedAttempt: attempt,
          duplicateAfterAttempts,
        });
      }
    }
  }
  const batchPath = join(V2_CANDIDATE_ROOT, `batch-${String(batch.number).padStart(2, '0')}-days-${String(batch.startDay).padStart(3, '0')}-${String(batch.endDay).padStart(3, '0')}.json`);
  return {
    batchPath,
    document: {
      batchVersion: V2_CONTENT_VERSION,
      batch: batch.number,
      days: { start: batch.startDay, end: batch.endDay },
      contentVersion: V2_CONTENT_VERSION,
      generatedAt: GENERATED_AT,
      sourceHash: editorial.csvHash,
      engineVersion: '', // filled later
      seedPolicy: 'contentVersion|slotId|ageTrack|locale|gameTypeId|ruleVariant',
      items,
      mapping,
    },
  };
}

async function generateV2() {
  const editorial = readEditorialRows();
  const loaded = await loadEngine();
  try {
    const engine = loaded.engine;
    const candidateSource = {
      repo: SOURCE_REPO,
      url: SOURCE_URL,
      commit: loaded.engineHash,
      license: 'UNLICENSED',
      path: 'docs/research/2026-10-17-daily-thinking-games-365.csv',
    };
    const ageTracks = engine.GAME_AGE_TRACKS;
    const usedFingerprints = new Set();
    const usedNormalized = new Set();
    const titleState = new Map();
    const allItems = [];
    const batchDocuments = [];
    for (const batch of BATCHES) {
      const { batchPath, document } = generateBatch({ engine, editorial, candidateSource, ageTracks, usedFingerprints, usedNormalized, titleState }, batch);
      document.engineVersion = loaded.engineVersion;
      batchDocuments.push({ batchPath, document });
      allItems.push(...document.items);
    }
    const manifest = {
      schemaVersion: 1,
      manifestVersion: V2_CONTENT_VERSION,
      generatedAt: GENERATED_AT,
      isPilotFixture: false,
      minFormatSpacingDays: 7,
      spacingException: null,
      locales: [LOCALE],
      ageTracks: [...ageTracks],
      coverage: {
        dayCount: 365,
        slotsPerDay: 2,
        typeIds: 24,
        variantPairs: 96,
      },
      items: allItems,
      editorialApproval: null,
      fingerprintIndexVersion: V2_CONTENT_VERSION,
      status: 'pending_human_review',
    };
    mkdirSync(V2_CANDIDATE_ROOT, { recursive: true });
    for (const { batchPath, document } of batchDocuments) {
      writeFileSync(batchPath, `${JSON.stringify(document, null, 2)}\n`);
    }
    const manifestPath = join(V2_CANDIDATE_ROOT, 'candidate-manifest-v2.json');
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const metaPath = join(V2_CANDIDATE_ROOT, 'candidate-meta-v2.json');
    writeFileSync(metaPath, `${JSON.stringify({
      contentVersion: V2_CONTENT_VERSION,
      generatedAt: GENERATED_AT,
      sourceHash: editorial.csvHash,
      engineVersion: loaded.engineVersion,
      engineHash: loaded.engineHash,
      seedPolicy: 'contentVersion|slotId|ageTrack|locale|gameTypeId|ruleVariant',
      source: candidateSource,
      candidateAuditProfile: 'p08-candidate-v2',
      releaseProfile: 'not-release-selectable',
    }, null, 2)}\n`);
    return { editorial, source: candidateSource, engineHash: loaded.engineHash, engineVersion: loaded.engineVersion, batches: batchDocuments, manifest };
  } finally {
    loaded.cleanup();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  generateV2().then((result) => {
    const tracks = Object.fromEntries(result.manifest.ageTracks.map((track) => [
      track,
      result.manifest.items.filter((item) => item.ageTrack === track).length,
    ]));
    console.log(JSON.stringify({
      ok: true,
      manifest: join(V2_CANDIDATE_ROOT, 'candidate-manifest-v2.json'),
      itemCount: result.manifest.items.length,
      batchCounts: result.batches.map(({ document }) => ({ batch: document.batch, items: document.items.length })),
      tracks,
      sourceHash: result.editorial.csvHash,
      engineVersion: result.engineVersion,
    }, null, 2));
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export {
  BATCHES,
  V2_CANDIDATE_ROOT,
  V2_CONTENT_VERSION,
  GENERATED_AT,
  SOURCE_REPO,
  SOURCE_URL,
  LOCALE,
  SKILLS,
  AGE_CODE,
  PRAISE_KEYS,
  SAFE_MEMORY_HINTS,
  ORIGINAL_TUTORIALS,
  sha256,
  parseCsv,
  readEditorialRows,
  skillForCsv,
  loadEngine,
  normalizedCandidateSignature,
  generateBatch,
  generateV2,
};
