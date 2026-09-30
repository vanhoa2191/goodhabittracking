import { describe, expect, it } from 'vitest';
import { evaluateHabitPhase } from '@/lib/habit-programs/phase';
import { overloadSuggestion, rankChildSuggestions, stuckThresholdWeeks, suggestAdjustments } from '@/lib/habit-programs/suggestions';
import type { Opportunity, OpportunityOutcome } from '@/lib/habit-programs/types';

function run(pattern: string, dayZero = '2026-01-01'): Opportunity[] {
  const outcomes: Record<string, OpportunityOutcome> = { a: 'alone', p: 'prompted', t: 'together', u: 'unknown', x: 'missed' };
  return [...pattern].map((symbol, index) => {
    const date = new Date(`${dayZero}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), outcome: outcomes[symbol] };
  });
}

function suggest(pattern: string, options: { complexity?: 'simple' | 'medium' | 'complex'; ageYears?: number; today?: string } = {}) {
  const evaluation = evaluateHabitPhase({ opportunities: run(pattern), hasCuePlan: true, cadence: 'due-day' });
  return suggestAdjustments({
    evaluation,
    complexity: options.complexity ?? 'medium',
    ageYears: options.ageYears ?? 8,
    today: options.today ?? '2026-02-01',
  }).map((entry) => entry.code);
}

describe('stuck threshold', () => {
  it('scales by complexity and lengthens for children under six', () => {
    expect([stuckThresholdWeeks('simple', 8), stuckThresholdWeeks('medium', 8), stuckThresholdWeeks('complex', 8)]).toEqual([8, 14, 26]);
    expect([stuckThresholdWeeks('simple', 4), stuckThresholdWeeks('medium', 4), stuckThresholdWeeks('complex', 4)]).toEqual([12, 21, 39]);
  });
});

describe('per-habit suggestions', () => {
  it('check-in: three misses in a row while building', () => {
    expect(suggest('tttxxx')).toContain('check-in');
    expect(suggest('tttxx')).not.toContain('check-in');
  });

  it('stuck-building: still building after the threshold for its complexity', () => {
    const building = 'ttt' + 'txtxtxtxtx';
    expect(suggest(building, { complexity: 'simple', today: '2026-03-01' })).toContain('stuck-building');
    expect(suggest(building, { complexity: 'simple', today: '2026-01-20' })).not.toContain('stuck-building');
    expect(suggest(building, { complexity: 'complex', today: '2026-03-01' })).not.toContain('stuck-building');
  });

  it('step-back: three misses in the last five while fading support', () => {
    const intoFade = 'ttt' + 'tttttttttt';
    expect(suggest(intoFade + 'ttxxx')).toContain('step-back');
    expect(suggest(intoFade + 'ttxxt')).not.toContain('step-back');
  });

  it('prompt-reliance: six of the last ten needed a prompt while fading', () => {
    const intoFade = 'ttt' + 'tttttttttt';
    expect(suggest(intoFade + 'ppppppaaaa')).toContain('prompt-reliance');
    expect(suggest(intoFade + 'pppppaaaaa')).not.toContain('prompt-reliance');
  });

  it('routine-formed: a routine that has just formed, for one window only', () => {
    const intoMaintain = 'ttt' + 'tttttttttt' + 'aaaaaaaaaa';
    expect(suggest(intoMaintain)).toContain('routine-formed');
    expect(suggest(intoMaintain + 'aaaaaaaaaa')).not.toContain('routine-formed');
    expect(suggest(intoMaintain.slice(0, -1))).not.toContain('routine-formed');
  });

  it('record-support: support level mostly unrecorded near a phase change, but only when it matters', () => {
    expect(suggest('ttt' + 'uuuuuuuuu')).toContain('record-support');
    expect(suggest('ttt' + 'tttttttttt' + 'uuuuuuaaaa')).toContain('record-support');
    expect(suggest('ttt' + 'tttttttttt' + 'aaaaaauuuu')).not.toContain('record-support');
    expect(suggest('ttt' + 'tt')).not.toContain('record-support');
  });

  it('puts the most urgent suggestion of a habit first', () => {
    const codes = suggest('ttt' + 'tttttttttt' + 'ppuuxxx', { today: '2026-06-01' });
    expect(codes[0]).toBe('step-back');
  });
});

describe('suggestions for one child', () => {
  it('keeps the three most urgent across all habits and keeps input order for ties', () => {
    const entry = (habitId: string, code: Parameters<typeof rankChildSuggestions>[0][number]['suggestion']['code']) => ({ habitId, suggestion: { code, facts: {} } });
    const ranked = rankChildSuggestions([
      entry('a', 'record-support'),
      entry('b', 'routine-formed'),
      entry('c', 'check-in'),
      entry('d', 'step-back'),
      entry('e', 'check-in'),
    ]);
    expect(ranked.map((item) => `${item.habitId}:${item.suggestion.code}`)).toEqual(['c:check-in', 'e:check-in', 'd:step-back']);
  });

  it('puts the child-level overload warning before every per-habit suggestion', () => {
    const entry = (habitId: string | null, code: Parameters<typeof rankChildSuggestions>[0][number]['suggestion']['code']) => ({ habitId, suggestion: { code, facts: {} } });
    const ranked = rankChildSuggestions([
      entry('a', 'check-in'), entry('b', 'step-back'), entry('c', 'check-in'), entry(null, 'too-many-new'),
    ]);
    expect(ranked.map((item) => item.suggestion.code)).toEqual(['too-many-new', 'check-in', 'check-in']);
  });

  it('returns fewer than three when there is little to say', () => {
    expect(rankChildSuggestions([])).toEqual([]);
  });
});

describe('overload', () => {
  it('flags more habits being set up or built than the age allows', () => {
    expect(overloadSuggestion(['build', 'anchor', 'fade'], 2)).toEqual({ code: 'too-many-new', facts: { active: 2, limit: 1 } });
    expect(overloadSuggestion(['build', 'fade', 'maintain'], 2)).toBeNull();
    expect(overloadSuggestion(['build', 'build', 'anchor', 'build'], 16)).toBeNull();
    expect(overloadSuggestion(['build', 'build', 'anchor', 'build', 'anchor'], 16)).toEqual({ code: 'too-many-new', facts: { active: 5, limit: 4 } });
  });
});
