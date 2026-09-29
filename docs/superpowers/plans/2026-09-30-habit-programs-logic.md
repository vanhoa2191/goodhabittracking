# Habit Programs Logic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the pure, tested logic that turns a child's history with a habit into a phase (anchor, build, fade, maintain) and a short list of adjustment suggestions, without any storage or interface changes yet.

**Architecture:** A new module `src/lib/habit-programs/` holds four small pure units: shared types and tunable config, an opportunity builder (which days a habit could have been done, and how), a phase state machine that replays those opportunities in order, and a suggestion engine. The child dashboard and `habit-fire` are refactored only to share the "is this habit due today" and "is the family paused" checks. Nothing here reads or writes the database.

**Tech Stack:** TypeScript, Vitest (`tests/**/*.test.ts`, alias `@` = `src`), Next.js 16 app (unchanged).

**Spec:** `docs/superpowers/specs/2026-09-30-adaptive-habit-programs-design.md` (delivery stage 1). Rules and thresholds come from `docs/habit-science-and-adaptive-logic.md`, section 5.

**Later stages (their own plans, written when this one has landed):** data (migrations, commands, sync, backup), parent interface, programs content, child interface and translations, docs and public science page.

## Global Constraints

- Code identifiers, comments and commit messages are in English; commit messages use conventional commits and end with the line `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Do not put plan, phase-of-delivery or finding labels in code comments, test names or commit messages.
- Every threshold is a named value in `HABIT_PROGRAM_CONFIG`; no magic numbers elsewhere. Window 10 (due-day) or 6 (weekly); build to fade needs `ceil(0.7 x N)` completed; fade to maintain needs `ceil(0.8 x N)` done alone; maintain returns to fade below `ceil(0.6 x N)` completed; at least 3 completed attempts leave the anchor phase and a full window must pass in a phase before it can advance.
- A single missed opportunity never changes a phase. Days that are paused, deferred, awaiting approval, or today-not-yet-done are never counted as missed.
- `unknown` support (completed with no recorded level) counts as completed but never as done alone.
- Suggestion display limit is 3. Under-6s use 1.5 x the stuck-building weeks.
- The soft cap on habits being anchored or built at once is 1 (under 3), 2 (3 to under 6), 3 (6 to under 15), 4 (15 and over).
- Dates are local `YYYY-MM-DD` strings; weekday and week maths use UTC noon so results do not depend on the machine time zone. Tests must pass with `TZ=UTC`, `TZ=Asia/Ho_Chi_Minh` and `TZ=America/Los_Angeles`.
- The child dashboard's due-day behaviour must not change: `daily` always due, `weekdays` Monday to Friday, `weekends` Saturday and Sunday, `custom` uses `recurrenceDays`.
- Never commit `plans/` files; stage files explicitly (never `git add -A`).

## Review Focus

- A habit started today, or with fewer opportunities than one window, must stay in its early phase and produce no suggestions (tests: opportunities "habit started today", phase "waits for a full window").
- A day with two verified logs must count once, and undoing or deleting a log later must be able to lower the phase again (tests: opportunities "two verified logs"; phase replay is recomputed from history each time).
- Year, month and leap-day boundaries, and machines in UTC, Vietnam and US time zones, must give the same opportunities (tests: date helpers; Task 6 runs the suite in three zones).
- A rejected log counts as a miss, an awaiting-approval log is neutral, and another child's or another habit's logs are ignored (test: opportunities "rejected log" and ignoring others).
- A child with no logs, no cue plan, or only missed days must never crash and must never be praised: empty input returns the anchor phase with zero counts (test: phase "is empty-safe").

---

### Task 1: Types and configuration

**Files:**
- Create: `src/lib/habit-programs/types.ts`
- Create: `src/lib/habit-programs/config.ts`
- Test: `tests/unit/habit-programs/config.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `SupportLevel`, `HabitPhase`, `ComplexityClass`, `Cadence` (`'due-day' | 'weekly'`), `OpportunityOutcome`, `Opportunity` from `types.ts`; `HABIT_PROGRAM_CONFIG`, `requiredCount(ratio: number, windowSize: number): number`, `newHabitLimit(ageYears: number): number` from `config.ts`. In the content stage, framework cadences `D` and `S` both map to `'due-day'` and `W` maps to `'weekly'`.

- [ ] **Step 1: Write the failing test**

`tests/unit/habit-programs/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { HABIT_PROGRAM_CONFIG, newHabitLimit, requiredCount } from '@/lib/habit-programs/config';

describe('habit program config', () => {
  it('turns ratios into whole-opportunity thresholds for both cadences', () => {
    const { windowSize, buildToFadeRatio, fadeToMaintainAloneRatio, maintainRegressBelowRatio } = HABIT_PROGRAM_CONFIG;
    expect([buildToFadeRatio, fadeToMaintainAloneRatio, maintainRegressBelowRatio].map((ratio) => requiredCount(ratio, windowSize['due-day']))).toEqual([7, 8, 6]);
    expect([buildToFadeRatio, fadeToMaintainAloneRatio, maintainRegressBelowRatio].map((ratio) => requiredCount(ratio, windowSize.weekly))).toEqual([5, 5, 4]);
  });

  it('caps new habits by age', () => {
    expect([0, 2.9, 3, 5.9, 6, 14.9, 15, 18].map(newHabitLimit)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/habit-programs/config.test.ts`
Expected: FAIL with `Failed to resolve import "@/lib/habit-programs/config"`.

- [ ] **Step 3: Write the implementation**

`src/lib/habit-programs/types.ts`:

```ts
export type SupportLevel = 'alone' | 'prompted' | 'together';

export type HabitPhase = 'anchor' | 'build' | 'fade' | 'maintain';

export type ComplexityClass = 'simple' | 'medium' | 'complex';

/** `due-day` habits get one opportunity on every day they are due; `weekly` habits get one per calendar week. */
export type Cadence = 'due-day' | 'weekly';

export type OpportunityOutcome = SupportLevel | 'unknown' | 'missed';

export type Opportunity = {
  readonly date: string;
  readonly outcome: OpportunityOutcome;
};
```

`src/lib/habit-programs/config.ts`:

```ts
import type { Cadence, ComplexityClass } from './types';

/** Design parameters; see docs/habit-science-and-adaptive-logic.md, section 5. All are tunable hypotheses. */
export const HABIT_PROGRAM_CONFIG = {
  windowSize: { 'due-day': 10, weekly: 6 } satisfies Record<Cadence, number>,
  minAttemptsToBuild: 3,
  buildToFadeRatio: 0.7,
  fadeToMaintainAloneRatio: 0.8,
  maintainRegressBelowRatio: 0.6,
  promptedDependenceRatio: 0.6,
  stuckWeeks: { simple: 8, medium: 14, complex: 26 } satisfies Record<ComplexityClass, number>,
  youngStuckMultiplier: 1.5,
  youngAgeYears: 6,
  recentWindowForStepBack: 5,
  stepBackMisses: 3,
  consecutiveMissesForCheckIn: 3,
  missingSupportShare: 0.5,
  suggestionLimit: 3,
} as const;

/** Smallest count that reaches `ratio` of `windowSize`, e.g. 0.7 of 10 is 7 and 0.7 of 6 is 5. */
export function requiredCount(ratio: number, windowSize: number): number {
  return Math.ceil(ratio * windowSize - 1e-9);
}

/** Soft cap on habits that are still being set up or built at the same time. A design convention, not a finding. */
export function newHabitLimit(ageYears: number): number {
  if (ageYears < 3) return 1;
  if (ageYears < 6) return 2;
  if (ageYears < 15) return 3;
  return 4;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/habit-programs/config.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/habit-programs/types.ts src/lib/habit-programs/config.ts tests/unit/habit-programs/config.test.ts
git commit -m "feat(habits): add habit program types and tunable thresholds" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Share the family-pause check

**Files:**
- Modify: `src/lib/habit-fire.ts` (extract the inline `isPausedDay` closure into an exported function)
- Test: `tests/unit/habit-fire.test.ts` (append; also change the import line)

**Interfaces:**
- Consumes: `FamilyPausePeriod` from `@/lib/experience-state` (already imported in `habit-fire.ts`).
- Produces: `isFamilyPausedOn(day: string, pausePeriods: readonly FamilyPausePeriod[]): boolean`, used by Task 3.

- [ ] **Step 1: Write the failing test**

In `tests/unit/habit-fire.test.ts` change the import to `import { habitFireForChild, isFamilyPausedOn } from '@/lib/habit-fire';` and append:

```ts
describe('isFamilyPausedOn', () => {
  const pauses = [{ startedAt: '2026-09-21T00:00:00.000Z', endedAt: '2026-09-24T00:00:00.000Z' }];

  it('is true for days inside a pause and false for days clearly outside it', () => {
    expect(isFamilyPausedOn('2026-09-22', pauses)).toBe(true);
    expect(isFamilyPausedOn('2026-09-23', pauses)).toBe(true);
    expect(isFamilyPausedOn('2026-09-18', pauses)).toBe(false);
    expect(isFamilyPausedOn('2026-09-27', pauses)).toBe(false);
  });

  it('treats a pause without an end as still running', () => {
    expect(isFamilyPausedOn('2026-12-01', [{ startedAt: '2026-09-21T00:00:00.000Z', endedAt: null }])).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/habit-fire.test.ts`
Expected: FAIL (`isFamilyPausedOn is not a function`).

- [ ] **Step 3: Write the implementation**

In `src/lib/habit-fire.ts`, add this function directly above `export function habitFireForChild(`:

```ts
/** True when any family pause overlaps the given local day (YYYY-MM-DD). */
export function isFamilyPausedOn(day: string, pausePeriods: readonly FamilyPausePeriod[]): boolean {
  const dayStart = new Date(`${day}T00:00:00`);
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);
  return pausePeriods.some(({ startedAt, endedAt }) =>
    new Date(startedAt) < nextDay && (endedAt === null || new Date(endedAt) > dayStart));
}
```

Then inside `habitFireForChild`, replace the whole `const isPausedDay = (day: string) => { ... };` block with:

```ts
  const isPausedDay = (day: string) => isFamilyPausedOn(day, pausePeriods);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/habit-fire.test.ts`
Expected: PASS (7 tests: the 5 existing streak tests plus 2 new ones).

- [ ] **Step 5: Commit**

```bash
git add src/lib/habit-fire.ts tests/unit/habit-fire.test.ts
git commit -m "refactor(habits): expose the family pause check for reuse" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Opportunities

**Files:**
- Create: `src/lib/habit-programs/opportunities.ts`
- Modify: `src/components/KidDashboard.tsx` (use `isActivityDueOn` for the due-today filter)
- Test: `tests/unit/habit-programs/opportunities.test.ts`

**Interfaces:**
- Consumes: `isFamilyPausedOn` (Task 2), `Opportunity`, `Cadence`, `SupportLevel` (Task 1), `ActivityLog` and `HabitActivity` from `@/types`, `FamilyPausePeriod` from `@/lib/experience-state`.
- Produces: `isActivityDueOn(recurrence, date): boolean`, `addDays(date, days): string`, `weekStart(date): string`, `buildOpportunities(input: OpportunityInput): Opportunity[]`, types `DeferralRow` and `OpportunityInput` (fields: `activityId`, `childId`, `recurrence`, `cadence`, `since`, `today`, `logs`, `supportByLogId`, `deferrals`, `pausePeriods`).

- [ ] **Step 1: Write the failing test**

`tests/unit/habit-programs/opportunities.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { addDays, buildOpportunities, isActivityDueOn, weekStart } from '@/lib/habit-programs/opportunities';
import type { OpportunityInput } from '@/lib/habit-programs/opportunities';
import type { SupportLevel } from '@/lib/habit-programs/types';
import type { ActivityLog } from '@/types';

const childId = '11111111-1111-4111-8111-111111111111';
const activityId = '22222222-2222-4222-8222-222222222222';

function log(date: string, status: ActivityLog['status'] = 'completed', id = `log-${date}`): ActivityLog {
  return { id, activityId, childId, date, status, pointsAwarded: 10, completedAt: `${date}T08:00:00.000Z` };
}

function input(overrides: Partial<OpportunityInput> = {}): OpportunityInput {
  return {
    activityId,
    childId,
    recurrence: { recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6] },
    cadence: 'due-day',
    since: '2026-09-21',
    today: '2026-09-25',
    logs: [],
    supportByLogId: new Map<string, SupportLevel>(),
    deferrals: [],
    pausePeriods: [],
    ...overrides,
  };
}

describe('date helpers', () => {
  it('finds the Monday of a week and adds days across month ends', () => {
    expect(weekStart('2026-09-27')).toBe('2026-09-21');
    expect(weekStart('2026-09-21')).toBe('2026-09-21');
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(weekStart('2027-01-01')).toBe('2026-12-28');
  });

  it('follows the recurrence rules the child dashboard uses', () => {
    const daily = { recurrenceType: 'daily', recurrenceDays: [] } as const;
    expect(isActivityDueOn(daily, '2026-09-27')).toBe(true);
    expect(isActivityDueOn({ recurrenceType: 'weekdays', recurrenceDays: [] }, '2026-09-26')).toBe(false);
    expect(isActivityDueOn({ recurrenceType: 'weekdays', recurrenceDays: [] }, '2026-09-25')).toBe(true);
    expect(isActivityDueOn({ recurrenceType: 'weekends', recurrenceDays: [] }, '2026-09-27')).toBe(true);
    expect(isActivityDueOn({ recurrenceType: 'custom', recurrenceDays: [1, 3] }, '2026-09-23')).toBe(true);
    expect(isActivityDueOn({ recurrenceType: 'custom', recurrenceDays: [1, 3] }, '2026-09-24')).toBe(false);
  });
});

describe('due-day opportunities', () => {
  it('marks done days by support level and past empty days as missed, and skips today until it is done', () => {
    const result = buildOpportunities(input({
      logs: [log('2026-09-21'), log('2026-09-22'), log('2026-09-24')],
      supportByLogId: new Map<string, SupportLevel>([['log-2026-09-21', 'alone'], ['log-2026-09-22', 'prompted']]),
    }));
    expect(result).toEqual([
      { date: '2026-09-21', outcome: 'alone' },
      { date: '2026-09-22', outcome: 'prompted' },
      { date: '2026-09-23', outcome: 'missed' },
      { date: '2026-09-24', outcome: 'unknown' },
    ]);
  });

  it('counts a day once even when it has two verified logs, and does nothing for a habit started today', () => {
    expect(buildOpportunities(input({
      since: '2026-09-24',
      today: '2026-09-24',
      logs: [log('2026-09-24', 'completed', 'a'), log('2026-09-24', 'approved', 'b')],
    }))).toEqual([{ date: '2026-09-24', outcome: 'unknown' }]);
    expect(buildOpportunities(input({ since: '2026-09-25', today: '2026-09-25' }))).toEqual([]);
  });

  it('counts today once it has been done', () => {
    const result = buildOpportunities(input({ logs: [log('2026-09-25')], since: '2026-09-25' }));
    expect(result).toEqual([{ date: '2026-09-25', outcome: 'unknown' }]);
  });

  it('never counts paused, deferred or awaiting-approval days as misses', () => {
    const result = buildOpportunities(input({
      logs: [log('2026-09-22', 'pending_approval')],
      deferrals: [{ child_id: childId, activity_id: activityId, local_date: '2026-09-23' }],
      pausePeriods: [{ startedAt: '2026-09-21T00:00:00+07:00', endedAt: '2026-09-21T23:59:00+07:00' }],
    }));
    expect(result).toEqual([{ date: '2026-09-24', outcome: 'missed' }]);
  });

  it('treats a rejected log as a miss and ignores other children and habits', () => {
    const result = buildOpportunities(input({
      since: '2026-09-23',
      today: '2026-09-24',
      logs: [
        log('2026-09-23', 'rejected'),
        { ...log('2026-09-23', 'completed', 'other-child'), childId: 'someone-else' },
        { ...log('2026-09-23', 'completed', 'other-habit'), activityId: 'another' },
      ],
    }));
    expect(result).toEqual([{ date: '2026-09-23', outcome: 'missed' }]);
  });

  it('only creates opportunities on due days', () => {
    const result = buildOpportunities(input({
      recurrence: { recurrenceType: 'custom', recurrenceDays: [1, 3] },
      today: '2026-09-27',
    }));
    expect(result.map((entry) => entry.date)).toEqual(['2026-09-21', '2026-09-23']);
  });
});

describe('weekly opportunities', () => {
  it('gives one opportunity per calendar week and keeps the current week open', () => {
    const result = buildOpportunities(input({
      cadence: 'weekly',
      since: '2026-09-07',
      today: '2026-09-24',
      logs: [log('2026-09-09'), log('2026-09-10', 'completed', 'later')],
      supportByLogId: new Map<string, SupportLevel>([['later', 'alone']]),
    }));
    expect(result).toEqual([
      { date: '2026-09-07', outcome: 'alone' },
      { date: '2026-09-14', outcome: 'missed' },
    ]);
  });

  it('skips a week that was fully paused', () => {
    const result = buildOpportunities(input({
      cadence: 'weekly',
      since: '2026-09-07',
      today: '2026-09-24',
      pausePeriods: [{ startedAt: '2026-09-07T00:00:00+07:00', endedAt: '2026-09-14T00:00:00+07:00' }],
    }));
    expect(result).toEqual([{ date: '2026-09-14', outcome: 'missed' }]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/habit-programs/opportunities.test.ts`
Expected: FAIL with `Failed to resolve import "@/lib/habit-programs/opportunities"`.

- [ ] **Step 3: Write the implementation**

`src/lib/habit-programs/opportunities.ts`:

```ts
import type { FamilyPausePeriod } from '@/lib/experience-state';
import { isFamilyPausedOn } from '@/lib/habit-fire';
import type { ActivityLog, HabitActivity } from '@/types';
import type { Cadence, Opportunity, SupportLevel } from './types';

type Recurrence = {
  readonly recurrenceType: HabitActivity['recurrenceType'];
  readonly recurrenceDays: readonly number[];
};

export type DeferralRow = {
  readonly child_id: string;
  readonly activity_id: string;
  readonly local_date: string;
};

export type OpportunityInput = {
  readonly activityId: string;
  readonly childId: string;
  readonly recurrence: Recurrence;
  readonly cadence: Cadence;
  /** First local day (YYYY-MM-DD) that may count, usually the day the habit was started. */
  readonly since: string;
  /** Today's local day; today only counts once the habit has been done. */
  readonly today: string;
  readonly logs: readonly ActivityLog[];
  readonly supportByLogId: ReadonlyMap<string, SupportLevel>;
  readonly deferrals: readonly DeferralRow[];
  readonly pausePeriods: readonly FamilyPausePeriod[];
};

export function isActivityDueOn(recurrence: Recurrence, date: string): boolean {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  switch (recurrence.recurrenceType) {
    case 'weekdays': return weekday >= 1 && weekday <= 5;
    case 'weekends': return weekday === 0 || weekday === 6;
    case 'custom': return recurrence.recurrenceDays.includes(weekday);
    default: return true;
  }
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/** Monday of the calendar week that contains `date`. */
export function weekStart(date: string): string {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7));
}

function isVerified(log: ActivityLog): boolean {
  return log.status === 'completed' || log.status === 'approved';
}

/**
 * The chronological list of chances a child had to do a habit, oldest first.
 * Days that are paused, deferred, still awaiting approval or not over yet are left out
 * so they never count as a miss.
 */
export function buildOpportunities(input: OpportunityInput): Opportunity[] {
  const own = input.logs.filter((log) => log.childId === input.childId && log.activityId === input.activityId);
  const outcomeOf = (log: ActivityLog) => input.supportByLogId.get(log.id) ?? 'unknown';
  return input.cadence === 'weekly' ? weeklyOpportunities(input, own, outcomeOf) : dueDayOpportunities(input, own, outcomeOf);
}

type Outcomes = (log: ActivityLog) => Opportunity['outcome'];

function dueDayOpportunities(input: OpportunityInput, own: readonly ActivityLog[], outcomeOf: Outcomes): Opportunity[] {
  const deferred = new Set(input.deferrals
    .filter((row) => row.child_id === input.childId && row.activity_id === input.activityId)
    .map((row) => row.local_date));
  const result: Opportunity[] = [];
  for (let date = input.since; date <= input.today; date = addDays(date, 1)) {
    if (!isActivityDueOn(input.recurrence, date)) continue;
    const onDay = own.filter((log) => log.date === date);
    const verified = onDay.find(isVerified);
    if (verified) {
      result.push({ date, outcome: outcomeOf(verified) });
      continue;
    }
    if (onDay.some((log) => log.status === 'pending_approval')) continue;
    if (isFamilyPausedOn(date, input.pausePeriods) || deferred.has(date) || date === input.today) continue;
    result.push({ date, outcome: 'missed' });
  }
  return result;
}

function weeklyOpportunities(input: OpportunityInput, own: readonly ActivityLog[], outcomeOf: Outcomes): Opportunity[] {
  const result: Opportunity[] = [];
  const currentWeek = weekStart(input.today);
  for (let start = weekStart(input.since); start <= currentWeek; start = addDays(start, 7)) {
    const days = Array.from({ length: 7 }, (_, index) => addDays(start, index))
      .filter((day) => day >= input.since && day <= input.today);
    const inWeek = own.filter((log) => days.includes(log.date));
    const verified = inWeek.filter(isVerified).sort((a, b) => a.date.localeCompare(b.date));
    const latest = verified[verified.length - 1];
    if (latest) {
      result.push({ date: start, outcome: outcomeOf(latest) });
      continue;
    }
    if (start === currentWeek || inWeek.some((log) => log.status === 'pending_approval')) continue;
    if (days.every((day) => isFamilyPausedOn(day, input.pausePeriods))) continue;
    result.push({ date: start, outcome: 'missed' });
  }
  return result;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/habit-programs/opportunities.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Reuse the due-day check in the child dashboard**

In `src/components/KidDashboard.tsx` add `import { isActivityDueOn } from '@/lib/habit-programs/opportunities';` after the `BadgeCelebration` import, then replace this block:

```tsx
  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Filter activities for active child & day
  const dueActivities = activities.filter((act) => {
    if (!act.isActive) return false;
    if (act.childId !== null && act.childId !== activeChild.id) return false;

    if (act.recurrenceType === 'daily') return true;
    if (act.recurrenceType === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (act.recurrenceType === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6;
    if (act.recurrenceType === 'custom') {
      return act.recurrenceDays && act.recurrenceDays.includes(dayOfWeek);
    }
    return true;
  }).map(
```

with:

```tsx
  // Filter activities for active child & day
  const dueActivities = activities.filter((act) => {
    if (!act.isActive) return false;
    if (act.childId !== null && act.childId !== activeChild.id) return false;
    return isActivityDueOn(act, dateStr);
  }).map(
```

(`dateStr` is already `localDayKey(selectedDate)`, defined earlier in the component. If `BadgeCelebration` is not imported on your branch, place the new import with the other `@/lib` imports.)

- [ ] **Step 6: Verify the dashboard behaviour is unchanged**

Run: `rm -rf .next/dev/types && npx tsc --noEmit && npx eslint src/components/KidDashboard.tsx src/lib/habit-programs && CI=1 npx playwright test smoke entry-journey quest-deferral --project=chromium --retries=0`
Expected: TypeScript and ESLint report no problems; all Playwright tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/habit-programs/opportunities.ts tests/unit/habit-programs/opportunities.test.ts src/components/KidDashboard.tsx
git commit -m "feat(habits): build the list of chances a child had to do a habit" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Phase evaluation

**Files:**
- Create: `src/lib/habit-programs/phase.ts`
- Test: `tests/unit/habit-programs/phase.test.ts`

**Interfaces:**
- Consumes: `HABIT_PROGRAM_CONFIG`, `requiredCount` (Task 1); `Opportunity`, `HabitPhase`, `Cadence` (Task 1).
- Produces: `evaluateHabitPhase(input: PhaseInput): PhaseEvaluation`; `PhaseInput = { opportunities, hasCuePlan, cadence }`; `PhaseEvaluation` fields `phase`, `windowSize`, `opportunitiesInPhase`, `enteredOn`, `completedInWindow`, `aloneInWindow`, `promptedInWindow`, `unknownInWindow`, `missedInLastFive`, `consecutiveMissed`.

- [ ] **Step 1: Write the failing test**

`tests/unit/habit-programs/phase.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/habit-programs/phase.test.ts`
Expected: FAIL with `Failed to resolve import "@/lib/habit-programs/phase"`.

- [ ] **Step 3: Write the implementation**

`src/lib/habit-programs/phase.ts`:

```ts
import { HABIT_PROGRAM_CONFIG, requiredCount } from './config';
import type { Cadence, HabitPhase, Opportunity } from './types';

export type PhaseInput = {
  /** Oldest first, as produced by buildOpportunities. */
  readonly opportunities: readonly Opportunity[];
  /** A saved "if this, then that" plan means the cue has been anchored. */
  readonly hasCuePlan: boolean;
  readonly cadence: Cadence;
};

export type PhaseEvaluation = {
  readonly phase: HabitPhase;
  readonly windowSize: number;
  /** Opportunities seen since the current phase began. */
  readonly opportunitiesInPhase: number;
  /** Day the current phase began, or null while the cue is still being anchored. */
  readonly enteredOn: string | null;
  readonly completedInWindow: number;
  readonly aloneInWindow: number;
  readonly promptedInWindow: number;
  readonly unknownInWindow: number;
  readonly missedInLastFive: number;
  readonly consecutiveMissed: number;
};

const isCompleted = (entry: Opportunity) => entry.outcome !== 'missed';
const count = (entries: readonly Opportunity[], test: (entry: Opportunity) => boolean) => entries.filter(test).length;

/**
 * Replays the opportunities in order so the phase depends only on what the child did.
 * A single miss never changes the phase on its own; only the share of recent opportunities does.
 */
export function evaluateHabitPhase(input: PhaseInput): PhaseEvaluation {
  const config = HABIT_PROGRAM_CONFIG;
  const windowSize = config.windowSize[input.cadence];
  const { opportunities } = input;

  let phase: HabitPhase = 'anchor';
  let enteredOn: string | null = null;
  let inPhase = 0;

  if (input.hasCuePlan) {
    let attempts = 0;
    let index = 0;
    for (; index < opportunities.length; index += 1) {
      if (isCompleted(opportunities[index])) attempts += 1;
      if (attempts >= config.minAttemptsToBuild) break;
    }
    if (attempts >= config.minAttemptsToBuild) {
      phase = 'build';
      enteredOn = opportunities[index].date;
      for (let step = index + 1; step < opportunities.length; step += 1) {
        inPhase += 1;
        const window = opportunities.slice(Math.max(0, step + 1 - windowSize), step + 1);
        const next = nextPhase(phase, window, inPhase, windowSize);
        if (next !== phase) {
          phase = next;
          enteredOn = opportunities[step].date;
          inPhase = 0;
        }
      }
    }
  }

  const window = opportunities.slice(-windowSize);
  const lastFive = opportunities.slice(-config.recentWindowForStepBack);
  let consecutiveMissed = 0;
  for (let step = opportunities.length - 1; step >= 0 && !isCompleted(opportunities[step]); step -= 1) consecutiveMissed += 1;

  return {
    phase,
    windowSize,
    opportunitiesInPhase: inPhase,
    enteredOn,
    completedInWindow: count(window, isCompleted),
    aloneInWindow: count(window, (entry) => entry.outcome === 'alone'),
    promptedInWindow: count(window, (entry) => entry.outcome === 'prompted'),
    unknownInWindow: count(window, (entry) => entry.outcome === 'unknown'),
    missedInLastFive: count(lastFive, (entry) => entry.outcome === 'missed'),
    consecutiveMissed,
  };
}

function nextPhase(
  phase: HabitPhase,
  window: readonly Opportunity[],
  inPhase: number,
  windowSize: number,
): HabitPhase {
  const config = HABIT_PROGRAM_CONFIG;
  const completed = count(window, isCompleted);
  const alone = count(window, (entry) => entry.outcome === 'alone');
  if (phase === 'build' && inPhase >= windowSize && completed >= requiredCount(config.buildToFadeRatio, windowSize)) return 'fade';
  if (phase === 'fade' && inPhase >= windowSize && alone >= requiredCount(config.fadeToMaintainAloneRatio, windowSize)) return 'maintain';
  if (phase === 'maintain' && completed < requiredCount(config.maintainRegressBelowRatio, windowSize)) return 'fade';
  return phase;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/habit-programs/phase.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/habit-programs/phase.ts tests/unit/habit-programs/phase.test.ts
git commit -m "feat(habits): evaluate the phase of a habit from what the child did" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Suggestions

**Files:**
- Create: `src/lib/habit-programs/suggestions.ts`
- Test: `tests/unit/habit-programs/suggestions.test.ts`

**Interfaces:**
- Consumes: `HABIT_PROGRAM_CONFIG`, `newHabitLimit`, `requiredCount` (Task 1); `addDays` (Task 3); `PhaseEvaluation` (Task 4); `ComplexityClass`, `HabitPhase` (Task 1).
- Produces: `SuggestionCode` (`'stuck-building' | 'prompt-reliance' | 'too-many-new' | 'routine-formed' | 'step-back' | 'check-in' | 'record-support'`), `Suggestion = { code, facts }`, `SuggestionInput = { evaluation, complexity, ageYears, today }`, `stuckThresholdWeeks(complexity, ageYears): number`, `suggestAdjustments(input): Suggestion[]`, `overloadSuggestion(phases: readonly HabitPhase[], ageYears: number): Suggestion | null`.

The codes correspond to the spec's rules: stuck-building = S1, prompt-reliance = S2, too-many-new = S3, routine-formed = S4, step-back = S5, check-in = S6, record-support = N1 (see `docs/habit-science-and-adaptive-logic.md`, section 5.5).

- [ ] **Step 1: Write the failing test**

`tests/unit/habit-programs/suggestions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { evaluateHabitPhase } from '@/lib/habit-programs/phase';
import { overloadSuggestion, stuckThresholdWeeks, suggestAdjustments } from '@/lib/habit-programs/suggestions';
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

  it('shows at most three suggestions, most urgent first', () => {
    const codes = suggest('ttt' + 'tttttttttt' + 'ppuuxxx', { today: '2026-06-01' });
    expect(codes.length).toBeLessThanOrEqual(3);
    expect(codes[0]).toBe('step-back');
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/habit-programs/suggestions.test.ts`
Expected: FAIL with `Failed to resolve import "@/lib/habit-programs/suggestions"`.

- [ ] **Step 3: Write the implementation**

`src/lib/habit-programs/suggestions.ts`:

```ts
import { HABIT_PROGRAM_CONFIG, newHabitLimit, requiredCount } from './config';
import { addDays } from './opportunities';
import type { PhaseEvaluation } from './phase';
import type { ComplexityClass, HabitPhase } from './types';

export type SuggestionCode =
  | 'stuck-building' // stuck while building: make it smaller, change the cue or add a weekend plan
  | 'prompt-reliance' // relies on prompts while fading support: use a visual cue or let the child set the reminder
  | 'too-many-new' // too many new habits at once
  | 'routine-formed' // just became a routine: switch to verbal recognition
  | 'step-back' // slipping while fading: step back one level of support
  | 'check-in' // three misses in a row while building: check how it is being done
  | 'record-support'; // support level often not recorded: ask gently

export type Suggestion = {
  readonly code: SuggestionCode;
  /** Numbers the interface can quote in the reason, e.g. how many of the last opportunities. */
  readonly facts: Readonly<Record<string, number>>;
};

export type SuggestionInput = {
  readonly evaluation: PhaseEvaluation;
  readonly complexity: ComplexityClass;
  readonly ageYears: number;
  /** Today's local day, used to measure how long the habit has been in its phase. */
  readonly today: string;
};

/** Weeks in the build phase after which "stuck" is suggested; longer for children under 6. */
export function stuckThresholdWeeks(complexity: ComplexityClass, ageYears: number): number {
  const base = HABIT_PROGRAM_CONFIG.stuckWeeks[complexity];
  return ageYears < HABIT_PROGRAM_CONFIG.youngAgeYears ? Math.ceil(base * HABIT_PROGRAM_CONFIG.youngStuckMultiplier) : base;
}

function weeksBetween(from: string, to: string): number {
  let weeks = 0;
  while (addDays(from, (weeks + 1) * 7) <= to) weeks += 1;
  return weeks;
}

const PRIORITY: readonly SuggestionCode[] = ['check-in', 'step-back', 'stuck-building', 'prompt-reliance', 'too-many-new', 'routine-formed', 'record-support'];

/** Per-habit suggestions, most useful first, capped at the display limit. */
export function suggestAdjustments(input: SuggestionInput): Suggestion[] {
  const config = HABIT_PROGRAM_CONFIG;
  const { evaluation, today } = input;
  const { phase, windowSize } = evaluation;
  const found: Suggestion[] = [];

  if (phase === 'build' && evaluation.consecutiveMissed >= config.consecutiveMissesForCheckIn) {
    found.push({ code: 'check-in', facts: { missedInARow: evaluation.consecutiveMissed } });
  }
  if (phase === 'fade' && evaluation.missedInLastFive >= config.stepBackMisses) {
    found.push({ code: 'step-back', facts: { missed: evaluation.missedInLastFive, of: config.recentWindowForStepBack } });
  }
  if (phase === 'build' && evaluation.enteredOn) {
    const weeks = weeksBetween(evaluation.enteredOn, today);
    const limit = stuckThresholdWeeks(input.complexity, input.ageYears);
    if (weeks >= limit) found.push({ code: 'stuck-building', facts: { weeks, limit } });
  }
  if (phase === 'fade' && evaluation.promptedInWindow >= requiredCount(config.promptedDependenceRatio, windowSize)) {
    found.push({ code: 'prompt-reliance', facts: { prompted: evaluation.promptedInWindow, of: windowSize } });
  }
  if (phase === 'maintain' && evaluation.opportunitiesInPhase < windowSize) {
    found.push({ code: 'routine-formed', facts: { alone: evaluation.aloneInWindow, of: windowSize } });
  }
  if (needsSupportRecords(evaluation)) {
    found.push({ code: 'record-support', facts: { unrecorded: evaluation.unknownInWindow, of: evaluation.completedInWindow } });
  }
  return found.sort((a, b) => PRIORITY.indexOf(a.code) - PRIORITY.indexOf(b.code)).slice(0, config.suggestionLimit);
}

/**
 * The support level is unrecorded for over half of the completed opportunities while the habit
 * is close to a phase change that would use it.
 */
function needsSupportRecords(evaluation: PhaseEvaluation): boolean {
  const config = HABIT_PROGRAM_CONFIG;
  const { phase, windowSize, completedInWindow, unknownInWindow, aloneInWindow } = evaluation;
  if (completedInWindow === 0 || unknownInWindow <= completedInWindow * config.missingSupportShare) return false;
  if (phase === 'build') return completedInWindow >= requiredCount(config.buildToFadeRatio, windowSize) - 1;
  if (phase === 'fade') return aloneInWindow + unknownInWindow >= requiredCount(config.fadeToMaintainAloneRatio, windowSize);
  return false;
}

/** too-many-new: more habits are still being set up or built than the child's age allows. */
export function overloadSuggestion(phases: readonly HabitPhase[], ageYears: number): Suggestion | null {
  const active = phases.filter((phase) => phase === 'anchor' || phase === 'build').length;
  const limit = newHabitLimit(ageYears);
  return active > limit ? { code: 'too-many-new', facts: { active, limit } } : null;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/habit-programs/suggestions.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/habit-programs/suggestions.ts tests/unit/habit-programs/suggestions.test.ts
git commit -m "feat(habits): suggest adjustments from a habit's recent history" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Public entry point and full verification

**Files:**
- Create: `src/lib/habit-programs/index.ts`

**Interfaces:**
- Consumes: everything from Tasks 1 to 5.
- Produces: one import path, `@/lib/habit-programs`, that re-exports the functions and types the later stages use.

- [ ] **Step 1: Create the entry point**

`src/lib/habit-programs/index.ts`:

```ts
export { HABIT_PROGRAM_CONFIG, newHabitLimit, requiredCount } from './config';
export { addDays, buildOpportunities, isActivityDueOn, weekStart } from './opportunities';
export type { DeferralRow, OpportunityInput } from './opportunities';
export { evaluateHabitPhase } from './phase';
export type { PhaseEvaluation, PhaseInput } from './phase';
export { overloadSuggestion, stuckThresholdWeeks, suggestAdjustments } from './suggestions';
export type { Suggestion, SuggestionCode, SuggestionInput } from './suggestions';
export type { Cadence, ComplexityClass, HabitPhase, Opportunity, OpportunityOutcome, SupportLevel } from './types';
```

- [ ] **Step 2: Verify in three time zones, then the whole project**

Run each and expect all to pass:

```bash
for tz in UTC Asia/Ho_Chi_Minh America/Los_Angeles; do TZ=$tz npx vitest run tests/unit/habit-programs tests/unit/habit-fire.test.ts; done
rm -rf .next/dev/types && npx tsc --noEmit
npx eslint src/lib/habit-programs src/lib/habit-fire.ts src/components/KidDashboard.tsx tests/unit/habit-programs tests/unit/habit-fire.test.ts
npx vitest run
CI=1 npx playwright test smoke entry-journey quest-deferral kid-hero --project=chromium --retries=0
```

Expected: each time-zone run passes (41 tests); TypeScript and ESLint report no problems; the full unit run passes; Playwright passes.

- [ ] **Step 3: Commit and open the pull request**

```bash
git add src/lib/habit-programs/index.ts
git commit -m "feat(habits): export the habit program logic from one entry point" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -u origin HEAD
```

Open a pull request against `main` titled `feat(habits): add the pure logic behind adaptive habit programs`. In the body (Vietnamese, ending with the `Generated with Claude Code` line) list what was added, that nothing reads or writes stored data yet, that the child dashboard's due-day behaviour is unchanged, and the verification results. Do not merge without the project owner's approval.
