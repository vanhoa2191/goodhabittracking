import { describe, expect, it } from 'vitest';

import {
  checkAnswer,
  parseManifest,
  resolveInternalPilotAssignment,
  solvePuzzle,
  toPublicPuzzle,
  validatePuzzle,
} from '@/lib/thinking-games';
import type { PuzzleItem } from '@/lib/thinking-games';
import { loadPilot } from './helpers';

const manifest = parseManifest(loadPilot());
const items = manifest.items as readonly PuzzleItem[];

describe('pilot content', () => {
  it('contains 28 playable, solvable items across 7 days and both tracks', () => {
    expect(items).toHaveLength(28);
    expect(new Set(items.map((item) => item.dayIndex))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7]));
    expect(new Set(items.map((item) => item.ageTrack))).toEqual(new Set(['age_6_8', 'age_9_12']));
    expect(new Set(items.map((item) => item.gameTypeId))).toEqual(new Set(['g01-t1', 'g03-t1', 'g06-t1']));
    expect(new Set(items.map((item) => item.skillGroup))).toEqual(new Set(['rule', 'memory', 'planning']));
    expect(new Set(items.map((item) => item.fingerprint)).size).toBe(28);
    for (const item of items) {
      expect(item.status).toBe('design_only');
      expect(item.editorial).toBeNull();
      expect(item.source).toBeNull();
      expect(item.hints).toHaveLength(2);
      expect(validatePuzzle(item)).toEqual({ ok: true });
      expect(solvePuzzle(item).ok).toBe(true);
      expect(checkAnswer(item, item.solution)).toEqual({ ok: true, correct: true });
      expect(toPublicPuzzle(item)).not.toHaveProperty('solution');
    }
  });

  it('keeps main and bonus skill groups different on every day and track', () => {
    for (const day of [1, 2, 3, 4, 5, 6, 7]) {
      for (const track of ['age_6_8', 'age_9_12']) {
        const dayItems = items.filter((item) => item.dayIndex === day && item.ageTrack === track);
        expect(dayItems).toHaveLength(2);
        const main = dayItems.find((item) => item.slotType === 'main');
        const bonus = dayItems.find((item) => item.slotType === 'bonus');
        expect(main).toBeDefined();
        expect(bonus).toBeDefined();
        expect(main?.skillGroup).not.toBe(bonus?.skillGroup);
      }
    }
  });

  it('varies age difficulty through structure, not skin', () => {
    const ruleYoung = items.find((item) => item.gameTypeId === 'g01-t1' && item.ageTrack === 'age_6_8');
    const ruleOlder = items.find((item) => item.gameTypeId === 'g01-t1' && item.ageTrack === 'age_9_12');
    const pathYoung = items.find((item) => item.gameTypeId === 'g06-t1' && item.ageTrack === 'age_6_8');
    const pathOlder = items.find((item) => item.gameTypeId === 'g06-t1' && item.ageTrack === 'age_9_12');
    const memoryYoung = items.find((item) => item.gameTypeId === 'g03-t1' && item.ageTrack === 'age_6_8');
    const memoryOlder = items.find((item) => item.gameTypeId === 'g03-t1' && item.ageTrack === 'age_9_12');
    expect(ruleYoung?.boardData.kind).toBe('rule-sequence');
    expect(ruleOlder?.boardData.kind).toBe('rule-sequence');
    if (ruleYoung?.boardData.kind === 'rule-sequence' && ruleOlder?.boardData.kind === 'rule-sequence') {
      expect(ruleYoung.boardData.sequence.length).toBeLessThanOrEqual(5);
      expect(ruleOlder.boardData.sequence.length).toBeGreaterThanOrEqual(5);
    }
    if (pathYoung?.boardData.kind === 'path-planning' && pathOlder?.boardData.kind === 'path-planning') {
      expect([pathYoung.boardData.width, pathYoung.boardData.height]).toEqual([5, 5]);
      expect([pathOlder.boardData.width, pathOlder.boardData.height]).toEqual([7, 7]);
      expect(pathYoung.boardData.waypoints).toHaveLength(0);
      expect(pathOlder.boardData.waypoints).toHaveLength(1);
    }
    if (memoryYoung?.boardData.kind === 'memory-sequence' && memoryOlder?.boardData.kind === 'memory-sequence') {
      expect(memoryYoung.boardData.sequence.length).toBeLessThanOrEqual(4);
      expect(memoryOlder.boardData.sequence.length).toBe(5);
      expect(memoryYoung.boardData.options.length).toBe(memoryYoung.boardData.sequence.length);
      expect(memoryOlder.boardData.options.length).toBeGreaterThan(memoryOlder.boardData.sequence.length);
    }
  });

  it('keeps numeric rule hints aligned with an increasing rule', () => {
    for (const item of items) {
      if (item.gameTypeId !== 'g01-t1' || item.boardData.kind !== 'rule-sequence') continue;
      if (item.boardData.ruleKind !== 'increment') continue;
      for (const hint of item.hints) {
        expect(hint.toLocaleLowerCase('vi')).not.toContain('lặp lại');
      }
      expect(item.explanation.endsWith(`${String(item.solution)}.`)).toBe(true);
    }
  });

  it('resolves every item by its exact key without rerolling', () => {
    for (const item of items) {
      const result = resolveInternalPilotAssignment({
        manifest,
        childId: 'child-1',
        dayIndex: item.dayIndex,
        slotType: item.slotType,
        ageTrack: item.ageTrack,
        locale: item.locale,
        contentVersion: item.contentVersion,
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.assignment.item.id).toBe(item.id);
    }
  });
});
