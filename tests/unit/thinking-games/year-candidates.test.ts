import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PuzzleItem, ThinkingGamesManifest } from '@/lib/thinking-games';

import * as v1Check from '../../../scripts/check-thinking-games-candidates.mjs';
import * as v1Gen from '../../../scripts/generate-thinking-games-candidates.mjs';
import * as v2Check from '../../../scripts/check-thinking-games-candidates-v2.mjs';
import * as v2Gen from '../../../scripts/generate-thinking-games-candidates-v2.mjs';

const TRACKS = ['age_3_5', 'age_6_8', 'age_9_12', 'age_13_plus'] as const;
const V1_CONTENT_VERSION = 'p07-candidates-365-v1';
const V1_ENGINE_HASH = '0f7da85273374e834be53d646d323f92ea366baebd486989f59bd9504f488750';
const V2_CONTENT_VERSION_EXPECTED = 'p08-candidates-365-v2';

let loadedV1: Awaited<ReturnType<typeof v1Gen.loadEngine>>;
let engineV1: typeof loadedV1.engine;
let manifestV1: ThinkingGamesManifest;
let metaV1: ReturnType<typeof v1Check.loadCandidateMeta>;

let loadedV2: Awaited<ReturnType<typeof v2Gen.loadEngine>>;
let engineV2: typeof loadedV2.engine;
let manifestV2: ThinkingGamesManifest;
let metaV2: ReturnType<typeof v2Check.loadCandidateMeta>;

beforeAll(async () => {
  loadedV1 = await v1Gen.loadEngine();
  engineV1 = loadedV1.engine;
  manifestV1 = v1Check.loadManifest() as ThinkingGamesManifest;
  metaV1 = v1Check.loadCandidateMeta();

  loadedV2 = await v2Gen.loadEngine();
  engineV2 = loadedV2.engine;
  manifestV2 = v2Check.loadManifest() as ThinkingGamesManifest;
  metaV2 = v2Check.loadCandidateMeta();
});

afterAll(() => {
  loadedV1.cleanup();
  loadedV2.cleanup();
});

function runCatalogTests(label: string, params: {
  manifest: () => ThinkingGamesManifest;
  meta: () => ReturnType<typeof v1Check.loadCandidateMeta>;
  engine: () => typeof engineV1;
  loaded: () => typeof loadedV1;
  batches: typeof v1Gen.batches;
  loadBatchFn: (batch: typeof v1Gen.batches[0]) => PuzzleItem[];
  readEditorialRowsFn: typeof v1Gen.readEditorialRows;
  skillForCsvFn: typeof v1Gen.skillForCsv;
  contentVersion: string;
  contentVersionExpected: string;
  expectedEngineHash: () => string;
  auditItemsFn: (items: PuzzleItem[], { engine, scope, manifest }: { engine: ReturnType<typeof engineV1>; scope: string; manifest: ThinkingGamesManifest | null }) => { errors: Array<{ code: string; id: string; message?: string }>; warnings: Array<{ code: string; [key: string]: unknown }>; metrics: unknown; checks: unknown; quality: unknown; releaseRejection: unknown };
  normalizedStructuralSignatureFn: typeof v1Check.normalizedStructuralSignature;
}) {
  describe(`${label} year candidate catalog`, () => {
    it('has 365 continuous days, four tracks, and all CSV slot mappings', () => {
      const manifest = params.manifest();
      const meta = params.meta();
      const engine = params.engine();
      const editorial = params.readEditorialRowsFn();
      expect(manifest.items).toHaveLength(2920);
      expect(manifest.ageTracks).toEqual([...TRACKS]);
      expect(manifest.coverage).toEqual({ dayCount: 365, slotsPerDay: 2, typeIds: 24, variantPairs: 96 });
      expect(meta.sourceHash).toBe(editorial.csvHash);
      expect(meta.engineHash).toBe(params.expectedEngineHash());
      expect(meta.source).toEqual(expect.objectContaining({
        repo: 'vanhoa2191/goodhabittracking',
        license: 'UNLICENSED',
      }));
      expect(meta.contentVersion).toBe(params.contentVersionExpected);
      expect(manifest.manifestVersion).toBe(params.contentVersionExpected);

      const csvPairs = new Map<string, string>();
      const csvSkills = new Map<string, string>();
      for (const row of editorial.rows) {
        for (const slot of [row.main, row.bonus]) {
          csvPairs.set(slot.slotId, `${slot.typeId}:${slot.variant}`);
          csvSkills.set(slot.slotId, params.skillForCsvFn(slot.skill));
        }
      }
      const slotIds = new Set<string>();
      for (const item of manifest.items) {
        const slotId = item.id.replace(/-vi(35|68|912|13p)$/, '');
        expect(item.id.startsWith(`D${String(item.dayIndex).padStart(3, '0')}-${item.slotType}-vi`)).toBe(true);
        expect(csvPairs.get(slotId)).toBe(item.ruleVariantId);
        expect(csvSkills.get(slotId)).toBe(item.skillGroup);
        expect(item.source?.commit).toBe(params.expectedEngineHash());
        expect(item.status).toBe('design_only');
        expect(item.editorial).toBeNull();
        expect(item.targetSeconds).toBe(engine.targetSecondsForAge(item.ageTrack));
        expect(item.contentVersion).toBe(params.contentVersion);
        slotIds.add(slotId);
      }
      expect(slotIds.size).toBe(730);

      for (const track of TRACKS) {
        const trackItems = manifest.items.filter((item) => item.ageTrack === track);
        expect(trackItems).toHaveLength(730);
        expect(new Set(trackItems.map((item) => item.dayIndex)).size).toBe(365);
        for (let day = 1; day <= 365; day += 1) {
          const dayItems = trackItems.filter((item) => item.dayIndex === day);
          expect(dayItems).toHaveLength(2);
          expect(new Set(dayItems.map((item) => item.slotType)).size).toBe(2);
          const main = dayItems.find((item) => item.slotType === 'main');
          const bonus = dayItems.find((item) => item.slotType === 'bonus');
          expect(main?.skillGroup).not.toBe(bonus?.skillGroup);
        }
      }
      expect(new Set(manifest.items.map((item) => item.gameTypeId)).size).toBe(24);
      expect(new Set(manifest.items.map((item) => item.ruleVariantId)).size).toBe(96);
      expect(new Set(manifest.items.map((item) => item.skillGroup)).size).toBe(8);
    });

    it('loads all batches with correct item counts', () => {
      let total = 0;
      for (const batch of params.batches) {
        const items = params.loadBatchFn(batch);
        const expectedDays = batch.endDay - batch.startDay + 1;
        expect(items).toHaveLength(expectedDays * 2 * 4);
        expect(new Set(items.map((item) => item.dayIndex)).size).toBe(expectedDays);
        total += items.length;
      }
      expect(total).toBe(2920);
    });

    it('enforces normalized fingerprints for cosmetic-only changes', () => {
      const manifest = params.manifest();
      const engine = params.engine();
      const base = structuredClone(manifest.items.find((item) => item.gameTypeId === 'g01-t1')!);
      const skin: PuzzleItem = {
        ...base,
        id: base.id.replace(/-vi(35|68|912|13p)$/, '-vi9z'),
        title: 'Bản sao chỉ đổi tên',
        invitation: 'Mình thử một cách gọi khác, bạn cùng xem nhé?',
        tutorial: 'Bản sao hướng dẫn chỉ đổi câu chữ.',
        hints: ['Bản sao gợi ý một.', 'Bản sao gợi ý hai.'],
        explanation: 'Bản sao lời giải chỉ đổi câu chữ.',
        fingerprint: engine.puzzleFingerprint(base.gameTypeId, base.boardData),
      };

      expect(params.normalizedStructuralSignatureFn(skin)).toBe(params.normalizedStructuralSignatureFn(base));
      const audit = params.auditItemsFn([base, skin], { engine, scope: 'batch', manifest: null });
      expect(audit.warnings.some((warning) => warning.code === 'normalized_skin_duplicate')).toBe(true);
    });
  });

  describe(`${label} candidate negative controls`, () => {
    it('rejects a missing day', () => {
      const manifest = params.manifest();
      const errors: { code: string }[] = [];
      v1Check.addCoverageIssues(manifest.items.filter((item) => item.dayIndex !== 1), errors);
      expect(errors.some((error) => ['day_coverage', 'track_count', 'track_days', 'track_slots'].includes(error.code))).toBe(true);
    });

    it('rejects duplicate, unknown-variant, and invalid-answer candidates', () => {
      const manifest = params.manifest();
      const engine = params.engine();
      const item = manifest.items[0]!;
      const duplicate = params.auditItemsFn([item, { ...item }], { engine, scope: 'batch', manifest: null });
      expect(duplicate.errors.some((error) => error.code === 'duplicate_id')).toBe(true);

      const unknown = params.auditItemsFn([{ ...item, ruleVariantId: 'g01-t1:không tồn tại' }], { engine, scope: 'batch', manifest: null });
      expect(unknown.errors.some((error) => error.code === 'schema')).toBe(true);

      const invalid = params.auditItemsFn([{ ...item, solution: '__sai__' }], { engine, scope: 'batch', manifest: null });
      expect(invalid.errors.some((error) => ['known_answer_rejected', 'invalid_puzzle', 'schema'].includes(error.code))).toBe(true);
    });

    it('rejects the unreviewed candidate manifest under the production release profile', { timeout: 30000 }, () => {
      const manifest = params.manifest();
      const engine = params.engine();
      const release = engine.validateManifest(manifest, { profile: 'release' }) as {
        ok: boolean;
        errors?: { code: string }[];
      };
      expect(release.ok).toBe(false);
      const codes = new Set((release.errors ?? []).map((error: { code: string }) => error.code));
      expect(codes.has('release_unapproved')).toBe(true);
      expect(codes.has('release_editorial')).toBe(true);
      expect(codes.has('release_editorial_item')).toBe(true);
    });
  });
}

runCatalogTests('V1 (archived)', {
  manifest: () => manifestV1,
  meta: () => metaV1,
  engine: () => engineV1,
  loaded: () => loadedV1,
  batches: v1Gen.batches,
  loadBatchFn: (batch) => v1Check.loadBatch(batch).document.items,
  readEditorialRowsFn: v1Gen.readEditorialRows,
  skillForCsvFn: v1Gen.skillForCsv,
  contentVersion: V1_CONTENT_VERSION,
  contentVersionExpected: V1_CONTENT_VERSION,
  expectedEngineHash: () => V1_ENGINE_HASH,
  auditItemsFn: v1Check.auditItems,
  normalizedStructuralSignatureFn: v1Check.normalizedStructuralSignature,
});

runCatalogTests('V2 (current)', {
  manifest: () => manifestV2,
  meta: () => metaV2,
  engine: () => engineV2,
  loaded: () => loadedV2,
  batches: v2Gen.BATCHES,
  loadBatchFn: v2Check.loadBatch,
  readEditorialRowsFn: v2Gen.readEditorialRows,
  skillForCsvFn: v2Gen.skillForCsv,
  contentVersion: v2Gen.V2_CONTENT_VERSION,
  contentVersionExpected: V2_CONTENT_VERSION_EXPECTED,
  expectedEngineHash: () => loadedV2.engineHash,
  auditItemsFn: v2Check.auditItems,
  normalizedStructuralSignatureFn: v2Check.normalizedStructuralSignature,
});

describe('V2 provenance integrity', () => {
  it('matches live canonical engine hash', () => {
    expect(metaV2.engineHash).toBe(loadedV2.engineHash);
    expect(metaV2.engineVersion).toBe(loadedV2.engineVersion);
    expect(metaV2.contentVersion).toBe(V2_CONTENT_VERSION_EXPECTED);
    expect(manifestV2.manifestVersion).toBe(V2_CONTENT_VERSION_EXPECTED);
    expect(metaV2.releaseProfile).toBe('not-release-selectable');
    expect(manifestV2.status).toBe('pending_human_review');
    expect(metaV2.candidateAuditProfile).toBe('p08-candidate-v2');
  });

  it('all 2920 items have correct provenance', () => {
    for (const item of manifestV2.items) {
      expect(item.source?.commit).toBe(loadedV2.engineHash);
      expect(item.contentVersion).toBe(v2Gen.V2_CONTENT_VERSION);
      expect(item.status).toBe('design_only');
      expect(item.editorial).toBeNull();
    }
  });
});

describe('V1 archive frozen', () => {
  it('retains original provenance and never-released status', () => {
    expect(metaV1.contentVersion).toBe(V1_CONTENT_VERSION);
    expect(metaV1.engineHash).toBe(V1_ENGINE_HASH);
    expect(metaV1.engineVersion).toBe('engine-0f7da85273374e83');
    expect(metaV1.releaseProfile).toBe('not-release-selectable');
    expect(metaV1.candidateAuditProfile).toBe('p07-candidate-v1');
    expect(manifestV1.manifestVersion).toBe(V1_CONTENT_VERSION);
    expect(manifestV1.status).toBe('pending_human_review');
  });

  it('engine hash differs from current (proves V1 is archived)', () => {
    expect(metaV1.engineHash).not.toBe(loadedV2.engineHash);
    expect(metaV1.engineVersion).not.toBe(loadedV2.engineVersion);
  });
});
