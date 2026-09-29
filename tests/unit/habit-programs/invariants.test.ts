import { describe, expect, it } from 'vitest';
import { addDays, buildOpportunities } from '@/lib/habit-programs/opportunities';
import { evaluateHabitPhase } from '@/lib/habit-programs/phase';
import { overloadSuggestion, suggestAdjustments } from '@/lib/habit-programs/suggestions';
import type { OpportunityInput } from '@/lib/habit-programs/opportunities';
import type { Opportunity, OpportunityOutcome, SupportLevel } from '@/lib/habit-programs/types';
import type { ActivityLog } from '@/types';

// A fixed seed keeps these randomized checks deterministic.
let seed = 12345;
const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
const childId = 'c1'; const activityId = 'a1';
const shuffle = <T,>(items: readonly T[]): T[] => { const copy = [...items]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(rand() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };

describe('habit program invariants on random histories', () => {
  it('opportunities are independent of log order and never throw', () => {
    for (let round = 0; round < 400; round += 1) {
      const since = addDays('2026-01-01', Math.floor(rand() * 300));
      const today = addDays(since, Math.floor(rand() * 120));
      const logs: ActivityLog[] = [];
      for (let d = since; d <= today; d = addDays(d, 1)) {
        const copies = rand() < 0.6 ? (rand() < 0.15 ? 2 : 1) : 0;
        for (let k = 0; k < copies; k += 1) logs.push({ id: `${d}-${k}`, activityId, childId, date: d, status: pick(['completed', 'approved', 'pending_approval', 'rejected'] as const), pointsAwarded: 1, completedAt: `${d}T0${Math.floor(rand() * 9)}:00:00.000Z` });
      }
      const support = new Map<string, SupportLevel>(logs.filter(() => rand() < 0.5).map((log) => [log.id, pick(['alone', 'prompted', 'together'] as const)]));
      for (const cadence of ['due-day', 'weekly'] as const) {
        const base: OpportunityInput = { activityId, childId, recurrence: { recurrenceType: pick(['daily', 'weekdays', 'weekends', 'custom'] as const), recurrenceDays: [1, 3, 5] }, cadence, since, today, logs, supportByLogId: support, deferrals: [], pausePeriods: [] };
        const a = buildOpportunities(base);
        const b = buildOpportunities({ ...base, logs: shuffle(logs) });
        expect(b).toEqual(a);
        for (let i = 1; i < a.length; i += 1) expect(a[i].date > a[i - 1].date).toBe(true);
        for (const o of a) expect(o.date >= (cadence === 'weekly' ? addDays(since, -6) : since) && o.date <= today).toBe(true);
      }
    }
  });

  it('keeps phase and suggestion invariants', () => {
    const outcomes: OpportunityOutcome[] = ['alone', 'prompted', 'together', 'unknown', 'missed'];
    for (let round = 0; round < 3000; round += 1) {
      const n = Math.floor(rand() * 90);
      const opportunities: Opportunity[] = Array.from({ length: n }, (_, i) => ({ date: addDays('2026-01-01', i), outcome: pick(outcomes) }));
      const cadence = pick(['due-day', 'weekly'] as const);
      const hasCuePlan = rand() < 0.9;
      const e = evaluateHabitPhase({ opportunities, hasCuePlan, cadence });
      expect(['anchor', 'build', 'fade', 'maintain']).toContain(e.phase);
      expect(e.completedInWindow).toBeLessThanOrEqual(e.windowSize);
      expect(e.aloneInWindow + e.promptedInWindow + e.unknownInWindow).toBeLessThanOrEqual(e.completedInWindow);
      expect(e.consecutiveMissed).toBeLessThanOrEqual(n);
      if (!hasCuePlan) expect(e.phase).toBe('anchor');
      if (e.phase === 'anchor') expect(e.enteredOn).toBeNull(); else expect(e.enteredOn).not.toBeNull();
      // Reaching fade or maintain takes at least the attempts to leave anchor plus one full window.
      if (e.phase !== 'anchor' && e.phase !== 'build') expect(n).toBeGreaterThanOrEqual(3 + e.windowSize);
      if (e.phase === 'maintain') expect(e.completedInWindow).toBeGreaterThanOrEqual(Math.ceil(0.6 * e.windowSize - 1e-9));
      const s = suggestAdjustments({ evaluation: e, complexity: pick(['simple', 'medium', 'complex'] as const), ageYears: Math.floor(rand() * 19), today: addDays('2026-01-01', n + Math.floor(rand() * 400)) });
      expect(s.length).toBeLessThanOrEqual(3);
      expect(new Set(s.map((x) => x.code)).size).toBe(s.length);
      if (e.phase === 'anchor') expect(s).toEqual([]);
    }
    expect(overloadSuggestion(Array(20).fill('build'), 10)?.code).toBe('too-many-new');
  });
});
