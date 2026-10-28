import { describe, expect, it } from 'vitest';

import {
  assertReleaseManifest,
  puzzleFingerprint,
  validateManifest,
} from '@/lib/thinking-games';
import { loadPilot, loadReleasePlaceholder } from './helpers';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const pilot = loadPilot() as {
  items: Array<Record<string, unknown>>;
  minFormatSpacingDays: number;
};

describe('manifest validation', () => {
  it('accepts the pilot only under the pilot profile', () => {
    const result = validateManifest(pilot, { profile: 'pilot' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.metrics).toMatchObject({
        coverageKind: 'pilot',
        dayCount: 7,
        itemCount: 28,
        typeIds: 3,
        skillCount: 3,
        equalSkillDays: 0,
      });
    }
    const rejected = validateManifest(pilot, { profile: 'release' });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.errors.map((entry) => entry.code)).toContain('pilot_fixture_not_release');
    const explicitlyAllowed = validateManifest(pilot, { profile: 'release', allowPilotProfile: true });
    expect(explicitlyAllowed.ok).toBe(true);
    if (explicitlyAllowed.ok) expect(explicitlyAllowed.metrics.coverageKind).toBe('pilot');
  });

  it('rejects missing items, wrong spacing, approval claims and unimplemented mechanics', () => {
    const missing = clone(pilot);
    missing.items.pop();
    expect(validateManifest(missing, { profile: 'pilot' }).ok).toBe(false);

    const spacing = clone(pilot);
    spacing.minFormatSpacingDays = 7;
    expect(validateManifest(spacing, { profile: 'pilot' }).ok).toBe(false);

    const approved = clone(pilot);
    approved.items[0]!.status = 'approved';
    expect(validateManifest(approved, { profile: 'pilot' }).ok).toBe(false);

    const unimplemented = clone(pilot);
    unimplemented.items[0] = {
      ...unimplemented.items[0]!,
      gameTypeId: 'g02-t1',
      skillGroup: 'spatial',
    };
    expect(validateManifest(unimplemented, { profile: 'pilot' }).ok).toBe(false);
  });

  it('rejects an equal-skill day on one age track even when the other track differs', () => {
    const manifest = clone(pilot) as unknown as { items: Array<Record<string, unknown>> };
    const olderDayOne = manifest.items.filter((item) => item.dayIndex === 1 && item.ageTrack === 'age_9_12');
    const main = olderDayOne.find((item) => item.slotType === 'main');
    const bonus = olderDayOne.find((item) => item.slotType === 'bonus');
    expect(main && bonus).toBeTruthy();
    if (!main || !bonus) return;
    const mainBoard = {
      kind: 'rule-sequence',
      sequence: ['ma1', 'ma2', 'ma1', 'ma2'],
      options: ['ma1', 'ma2', 'ma3'],
      ruleKind: 'alternating',
    };
    const bonusBoard = {
      kind: 'rule-sequence',
      sequence: ['mb1', 'mb2', 'mb1', 'mb2'],
      options: ['mb1', 'mb2', 'mb3'],
      ruleKind: 'alternating',
    };
    Object.assign(main, {
      gameTypeId: 'g01-t1',
      skillGroup: 'rule',
      ruleVariantId: 'g01-t1:lặp một thuộc tính',
      validSolutionPredicate: 'rule-sequence-v1',
      boardData: mainBoard,
      fingerprint: puzzleFingerprint('g01-t1', mainBoard),
      solution: 'ma1',
    });
    Object.assign(bonus, {
      gameTypeId: 'g01-t1',
      skillGroup: 'rule',
      ruleVariantId: 'g01-t1:lặp một thuộc tính',
      validSolutionPredicate: 'rule-sequence-v1',
      boardData: bonusBoard,
      fingerprint: puzzleFingerprint('g01-t1', bonusBoard),
      solution: 'mb1',
    });
    const result = validateManifest(manifest, { profile: 'pilot' });
    expect(result.ok).toBe(false);
    expect(result.metrics.equalSkillDays).toBe(1);
    if (!result.ok) {
      expect(result.errors).toContainEqual(expect.objectContaining({
        code: 'pilot_equal_skill',
        path: 'age_9_12.1',
      }));
    }
  });

  it('rejects a duplicate canonical board even when the id and seed differ', () => {
    const duplicate = clone(pilot);
    const copy = clone(duplicate.items[0]!);
    copy.id = 'D001-main-68x';
    duplicate.items.push(copy);
    const result = validateManifest(duplicate, { profile: 'pilot' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map((entry) => entry.code)).toContain('pilot_duplicate_fingerprint');
  });

  it('rejects the not-ready release placeholder and cannot be asserted as release', () => {
    const result = validateManifest(loadReleasePlaceholder(), { profile: 'release' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const codes = result.errors.map((entry) => entry.code);
      expect(codes).toContain('release_item_count');
      expect(codes).toContain('release_editorial');
    }
    expect(() => assertReleaseManifest(loadReleasePlaceholder())).toThrow();
  });
});
