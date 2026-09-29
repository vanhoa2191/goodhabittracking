import { describe, expect, it } from 'vitest';
import { evaluateHabitPhase } from '@/lib/habit-programs/phase';
import type { Cadence, Opportunity, OpportunityOutcome } from '@/lib/habit-programs/types';

/** 'a' alone, 'p' prompted, 't' together, 'u' unknown, 'x' missed; one character per opportunity. */
function run(pattern: string, dayZero = '2026-01-01'): Opportunity[] {
  const outcomes: Record<string, OpportunityOutcome> = { a: 'alone', p: 'prompted', t: 'together', u: 'unknown', x: 'missed' };
  return [...pattern].map((symbol, index) => {
    const date = new Date(`${dayZero}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return { date: date.toISOString().slice(0, 10), outcome: outcomes[symbol] };
  });
}

function phaseOf(pattern: string, options: { plan?: boolean; cadence?: Cadence } = {}) {
  return evaluateHabitPhase({ opportunities: run(pattern), hasCuePlan: options.plan ?? true, cadence: options.cadence ?? 'due-day' });
}

describe('anchor', () => {
  it('stays in anchor without a cue plan, however well the child does', () => {
    expect(phaseOf('aaaaaaaaaaaa', { plan: false }).phase).toBe('anchor');
    expect(phaseOf('aaaaaaaaaaaa', { plan: false }).enteredOn).toBeNull();
  });

  it('stays in anchor until the child has tried at least three times', () => {
    expect(phaseOf('tt').phase).toBe('anchor');
    expect(phaseOf('txt').phase).toBe('anchor');
    expect(phaseOf('ttt').phase).toBe('build');
  });
});

describe('build to fade', () => {
  it('waits for a full window in the phase before moving on', () => {
    expect(phaseOf('ttt' + 'tttttttt').phase).toBe('build');
    expect(phaseOf('ttt' + 'tttttttttt').phase).toBe('fade');
  });

  it('needs 7 of the last 10 completed, and one miss changes nothing', () => {
    expect(phaseOf('ttt' + 'ttttxtttxt').phase).toBe('fade');
    expect(phaseOf('ttt' + 'xxxttttttt').phase).toBe('fade');
    expect(phaseOf('ttt' + 'xxxxtttttt').phase).toBe('build');
    expect(phaseOf('ttt' + 'ttttttttxx').phase).toBe('fade');
  });

  it('counts opportunities with no recorded support as completed', () => {
    expect(phaseOf('uuu' + 'uuuuuuuuuu').phase).toBe('fade');
  });
});

describe('fade to maintain', () => {
  const intoFade = 'ttt' + 'tttttttttt';

  it('needs 8 of the last 10 done alone', () => {
    expect(phaseOf(intoFade + 'aaaaaaaaaa').phase).toBe('maintain');
    expect(phaseOf(intoFade + 'aaaaaaaapp').phase).toBe('maintain');
    expect(phaseOf(intoFade + 'aaaaaaappp').phase).toBe('fade');
  });

  it('does not count unknown support as done alone', () => {
    expect(phaseOf(intoFade + 'uuuuuuuuuu').phase).toBe('fade');
  });

  it('does not skip ahead before a full window has passed in fade', () => {
    expect(phaseOf(intoFade + 'aaaaaaaaa').phase).toBe('fade');
  });
});

describe('maintain', () => {
  const intoMaintain = 'ttt' + 'tttttttttt' + 'aaaaaaaaaa';

  it('holds through occasional misses', () => {
    expect(phaseOf(intoMaintain + 'xaxaxa').phase).toBe('maintain');
  });

  it('returns to fade when fewer than 6 of the last 10 were done', () => {
    expect(phaseOf(intoMaintain + 'xxxxx').phase).toBe('fade');
    expect(phaseOf(intoMaintain + 'xxxx').phase).toBe('maintain');
  });
});

describe('weekly cadence', () => {
  it('uses a window of 6 with thresholds 5, 5 and 4', () => {
    const intoFade = 'ttt' + 'tttttt';
    expect(phaseOf('ttt' + 'ttttt', { cadence: 'weekly' }).phase).toBe('build');
    expect(phaseOf(intoFade, { cadence: 'weekly' }).phase).toBe('fade');
    expect(phaseOf(intoFade + 'aaaaaa', { cadence: 'weekly' }).phase).toBe('maintain');
    expect(phaseOf(intoFade + 'aaaaap', { cadence: 'weekly' }).phase).toBe('maintain');
    expect(phaseOf(intoFade + 'aaaapp', { cadence: 'weekly' }).phase).toBe('fade');
    expect(phaseOf(intoFade + 'aaaaaa' + 'xxx', { cadence: 'weekly' }).phase).toBe('fade');
  });
});

describe('evaluation details', () => {
  it('reports the window counts, recent misses and the day the phase began', () => {
    const result = phaseOf('ttt' + 'tttttttttt' + 'aappxx');
    expect(result.phase).toBe('fade');
    expect(result.windowSize).toBe(10);
    expect(result.completedInWindow).toBe(8);
    expect(result.aloneInWindow).toBe(2);
    expect(result.promptedInWindow).toBe(2);
    expect(result.missedInLastFive).toBe(2);
    expect(result.consecutiveMissed).toBe(2);
    expect(result.opportunitiesInPhase).toBe(6);
    expect(result.enteredOn).toBe('2026-01-13');
  });

  it('is empty-safe', () => {
    const result = evaluateHabitPhase({ opportunities: [], hasCuePlan: true, cadence: 'due-day' });
    expect(result).toMatchObject({ phase: 'anchor', completedInWindow: 0, consecutiveMissed: 0 });
  });
});
