import { describe, expect, it } from 'vitest';

import {
  GAME_MECHANICS,
  GAME_TYPE_IDS,
  IMPLEMENTED_GAME_TYPE_IDS,
  RULE_VARIANTS,
  getGameMechanic,
  isRuleVariantForGame,
  requireImplemented,
} from '@/lib/thinking-games';

describe('registry', () => {
  it('contains all 24 measured type ids and 96 variant pairs', () => {
    expect(GAME_MECHANICS).toHaveLength(24);
    expect(new Set(GAME_MECHANICS.map((mechanic) => mechanic.gameTypeId))).toEqual(new Set(GAME_TYPE_IDS));
    expect(RULE_VARIANTS).toHaveLength(96);
    expect(new Set(RULE_VARIANTS.map((variant) => variant.ruleVariantId)).size).toBe(96);
    expect(new Set(GAME_MECHANICS.map((mechanic) => mechanic.skillGroup)).size).toBe(8);
  });

  it('implements exactly the three authorized mechanics and returns unavailable for the other 21', () => {
    const implemented = GAME_MECHANICS.filter((mechanic) => mechanic.implemented);
    expect(implemented.map((mechanic) => mechanic.gameTypeId).sort()).toEqual([...IMPLEMENTED_GAME_TYPE_IDS].sort());
    for (const mechanic of GAME_MECHANICS) {
      const result = requireImplemented(mechanic.gameTypeId);
      if (IMPLEMENTED_GAME_TYPE_IDS.includes(mechanic.gameTypeId as typeof IMPLEMENTED_GAME_TYPE_IDS[number])) {
        expect(result.ok).toBe(true);
      } else {
        expect(result).toEqual({ ok: false, code: 'format_unavailable' });
      }
    }
    expect(requireImplemented('missing')).toEqual({ ok: false, code: 'format_unavailable' });
  });

  it('keeps the chosen checker and skill mapping', () => {
    expect(getGameMechanic('g01-t1')).toMatchObject({ skillGroup: 'rule', checkerId: 'rule-sequence-v1' });
    expect(getGameMechanic('g06-t1')).toMatchObject({ skillGroup: 'planning', checkerId: 'path-planning-v1' });
    expect(getGameMechanic('g03-t1')).toMatchObject({ skillGroup: 'memory', checkerId: 'memory-sequence-v1' });
    expect(isRuleVariantForGame('g01-t1', 'g01-t1:lặp một thuộc tính')).toBe(true);
    expect(isRuleVariantForGame('g01-t1', 'g06-t1:đến đích tránh chướng ngại')).toBe(false);
  });
});
