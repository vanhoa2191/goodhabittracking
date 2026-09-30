# Habit Programs Store Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the habit program data to the app's store so that the next plan can build the interface: parents and paired child devices load the new rows, the store can record how a habit was done and save cue plans in every mode (demo, signed-in parent, paired child), and one pure function turns a child's plans and history into the phases and suggestions the interface will show.

**Architecture:** Small, separately tested units around the existing store: a shared "table not created yet" helper so new code can deploy before its migration is applied, tolerant cloud reads, a merge that never loses a save made while a load was in flight, injected-dependency action creators (same style as `createHabitActions`), a per-habit traits table (draft complexity and cadence for the 47 framework habits) and `summarizeChildHabits`. `store.tsx` only gets thin glue. No interface, copy or feature flag is added here.

**Tech Stack:** TypeScript, React 19 store (`src/lib/store.tsx`), Zod 4, Vitest (`tests/**/*.test.ts`, alias `@` = `src`).

**Spec:** `docs/superpowers/specs/2026-09-30-adaptive-habit-programs-design.md` (delivery stage 3, store part). Builds on stage 1 (`src/lib/habit-programs/`) and stage 2 (tables, commands, `ExperienceState` rows).

**Next plan (written after this lands):** the parent interface (feature flag, "Con làm thế nào?" chip, cue plan editor, weekly summary with suggestions, gentle nudge) with its nine-language copy and end-to-end tests.

## Global Constraints

- **Precondition:** the stage 2 pull request is merged into `main` (this plan edits `src/app/api/domain/experience/route.ts`, `src/lib/experience-state.ts` and uses `readCloudFamilyRows`/tables from that work). Start from an up-to-date `main`.
- Nothing here is visible to users: no components, no copy, no flag. Existing behaviour must not change (older stored state loads, other experience routes unchanged).
- The habit program migration may not be applied yet in a given database; reading its two tables must then behave as "no rows" (missing-table codes `PGRST205` and `42P01` only), while any other error still fails the read. Never apply the migration from this plan.
- A paired child device may record how a habit was done for its own child's completed or approved log and may load its own rows, but may not save cue plans. A parent signed in to the cloud may do both. Demo sessions keep everything on the device and attribute records to the parent. With none of these, actions resolve `false` without sending a request.
- Every save is validated before any request is sent (`cuePlanInputSchema`) and the server's answer is checked against the request before the state changes; failures, mismatches and network errors resolve `false` and leave the state untouched.
- A load must never remove or downgrade a row: merging keeps everything already held and prefers the row with the later `recorded_at` or `updated_at`.
- Only habits with a cue plan take part in the summary. A plan's start day is the device-local day of its `created_at`; that day is never counted as a miss. Complexity and cadence come from `FRAMEWORK_HABIT_TRAITS` (draft, awaiting the owner's review) and default to medium and due-day for the family's own habits. Age comes from `age`, else `birthYear`, else the middle of `ageStage`, else 9.
- Time-dependent tests must pass with `TZ=UTC`, `TZ=Asia/Ho_Chi_Minh` and `TZ=America/Los_Angeles`; use fixture timestamps around noon UTC so the local day is the same in all three.
- Commit messages are conventional commits ending with the line `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; no plan or finding labels in code, tests or commits. Stage files explicitly; never commit files under `plans/`.

## Review Focus

- A family whose database lacks the two new tables must still load for parents (state read and cloud sync), but a different error on those tables, or a missing older table, must still fail (tests: sync reader "not created yet" and "any other error"; route tests from stage 2).
- A slow load finishing after a newer save must not overwrite it, and a load must never delete a row (tests: merge "keeps the newer version", "never drops", "same state when nothing changes").
- A paired child must not be able to save a plan, record for another child's log, or record for a log that is pending or rejected (tests: actions "never lets a paired child device save a plan", "refuses without a request ...").
- Invalid text, a time cue without a time, an inactive habit or another child's habit must never reach the network (tests: actions "refuses without a request for invalid text ...").
- The day a plan was made, days the family paused and other children's plans must not create misses, and a small child with several new habits must be told so (tests: summary "does not count the day the plan was made", "does not count days the family paused", "ignores plans for other children", "warns when a small child ...").
- The same data must give the same result in every time zone (Task 7 runs the unit suite in three zones).

---

### Task 1: Reading a table that does not exist yet

**Files:**
- Create: `src/lib/supabase/missing-table.ts`
- Modify: `src/app/api/domain/experience/route.ts`
- Test: `tests/unit/missing-table.test.ts`

**Interfaces:**
- Consumes: the local `isMissingTable` helper that stage 2 left inside the experience route.
- Produces: `isMissingTable(error): boolean` and `emptyWhenTableMissing(result)` from `@/lib/supabase/missing-table`.

- [ ] **Step 1: Write the failing test**

`tests/unit/missing-table.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emptyWhenTableMissing, isMissingTable } from '@/lib/supabase/missing-table';

describe('missing table handling', () => {
  it('recognises the PostgREST and PostgreSQL codes for an unknown table only', () => {
    expect(isMissingTable({ code: 'PGRST205' })).toBe(true);
    expect(isMissingTable({ code: '42P01' })).toBe(true);
    expect(isMissingTable({ code: '23503' })).toBe(false);
    expect(isMissingTable({})).toBe(false);
    expect(isMissingTable(null)).toBe(false);
    expect(isMissingTable(undefined)).toBe(false);
  });

  it('turns a missing table into an empty list and leaves every other result alone', () => {
    expect(emptyWhenTableMissing({ data: null, error: { code: 'PGRST205' } })).toEqual({ data: [], error: null });
    const rows = { data: [{ id: 1 }], error: null };
    expect(emptyWhenTableMissing(rows)).toBe(rows);
    const failure = { data: null, error: { code: '42501' } };
    expect(emptyWhenTableMissing(failure)).toBe(failure);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/missing-table.test.ts`
Expected: FAIL (`Failed to resolve import "@/lib/supabase/missing-table"`).

- [ ] **Step 3: Write the helper and use it in the route**

`src/lib/supabase/missing-table.ts`:

```ts
type RowResult<Row> = {
  readonly data: Row[] | null;
  readonly error: { readonly code?: string } | null;
};

/** PostgREST reports an unknown table as PGRST205 and PostgreSQL as 42P01. */
export function isMissingTable(error: { readonly code?: string } | null | undefined): boolean {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

/**
 * Reading a table that a migration has not created yet should not break everything else,
 * so that new code can be deployed just before the migration is applied.
 */
export function emptyWhenTableMissing<Row, Result extends RowResult<Row>>(
  result: Result,
): Result | { data: Row[]; error: null } {
  return isMissingTable(result.error) ? { data: [], error: null } : result;
}
```

In `src/app/api/domain/experience/route.ts` delete the local `isMissingTable` function (with its comment) and add this import next to the other `@/lib` imports:

```ts
import { isMissingTable } from '@/lib/supabase/missing-table';
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/missing-table.test.ts tests/api/experience.test.ts`
Expected: PASS (2 tests, then the existing 20 experience route tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/missing-table.ts tests/unit/missing-table.test.ts src/app/api/domain/experience/route.ts
git commit -m "refactor(habits): share the check for a table that is not created yet" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Cloud sync reads the new tables

**Files:**
- Modify: `src/lib/store/cloud-family-sync.ts`
- Test: `tests/unit/cloud-family-rows.test.ts`

**Interfaces:**
- Consumes: `emptyWhenTableMissing` (Task 1), the experience rows added in stage 2.
- Produces: `readCloudFamilyRows(userId, supabase?)` is now exported and takes an optional client (defaults to `getSupabase()`); `experience.supportObservations` and `experience.cuePlans` are part of what it returns.

- [ ] **Step 1: Write the failing test**

`tests/unit/cloud-family-rows.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readCloudFamilyRows } from '@/lib/store/cloud-family-sync';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const activityId = '33333333-3333-4333-8333-333333333333';
const observation = {
  log_id: '44444444-4444-4444-8444-444444444444', family_id: familyId, child_id: childId, activity_id: activityId,
  support_level: 'alone', recorded_by: 'parent', recorded_at: '2026-09-30T09:00:00.000Z',
};

type TableResult = { data: unknown; error: { code: string } | null };

/** A query builder that answers every chained call and resolves to the table's canned result. */
function fakeSupabase(tables: Record<string, TableResult>) {
  const resultFor = (table: string): TableResult => {
    if (table === 'family_memberships') return { data: { family_id: familyId, role: 'owner' }, error: null };
    return tables[table] ?? { data: table === 'user_subscriptions' || table === 'family_engagement_settings' ? null : [], error: null };
  };
  return {
    from(table: string) {
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        maybeSingle: async () => resultFor(table),
        then: (resolve: (value: TableResult) => unknown) => Promise.resolve(resultFor(table)).then(resolve),
      };
      return query;
    },
  } as unknown as NonNullable<Parameters<typeof readCloudFamilyRows>[1]>;
}

describe('cloud family rows', () => {
  it('reads support observations and cue plans into the experience state', async () => {
    const rows = await readCloudFamilyRows('user-1', fakeSupabase({
      habit_support_observations: { data: [observation], error: null },
    }));
    expect(rows.experience).toMatchObject({ supportObservations: [observation], cuePlans: [] });
  });

  it('still loads the family when the habit program tables are not created yet', async () => {
    const rows = await readCloudFamilyRows('user-1', fakeSupabase({
      habit_support_observations: { data: null, error: { code: 'PGRST205' } },
      habit_cue_plans: { data: null, error: { code: '42P01' } },
    }));
    expect(rows.experience).toMatchObject({ supportObservations: [], cuePlans: [] });
  });

  it('still fails for any other error on those tables and for other tables', async () => {
    await expect(readCloudFamilyRows('user-1', fakeSupabase({
      habit_cue_plans: { data: null, error: { code: '42501' } },
    }))).rejects.toMatchObject({ code: '42501' });
    await expect(readCloudFamilyRows('user-1', fakeSupabase({
      child_task_deferrals: { data: null, error: { code: 'PGRST205' } },
    }))).rejects.toMatchObject({ code: 'PGRST205' });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/cloud-family-rows.test.ts`
Expected: FAIL (`readCloudFamilyRows is not a function`).

- [ ] **Step 3: Write the implementation**

In `src/lib/store/cloud-family-sync.ts`:

(a) Add the import after `import { getSupabase } from '@/lib/supabase';`:

```ts
import { emptyWhenTableMissing } from '@/lib/supabase/missing-table';
```

(b) Replace the head of `readCloudFamilyRows`:

```ts
async function readCloudFamilyRows(userId: string): Promise<CloudFamilyRows> {
  const supabase = getSupabase();
  if (!supabase) {
```

with:

```ts
export async function readCloudFamilyRows(
  userId: string,
  supabase: ReturnType<typeof getSupabase> = getSupabase(),
): Promise<CloudFamilyRows> {
  if (!supabase) {
```

(c) In the destructuring list of the big `Promise.all`, add `supportObservationsResult,` and `cuePlansResult,` after `deferredTasksResult,` (and again in the `failedResult` array literal further down, in the same position).

(d) In the `Promise.all` call itself add these two lines after the `child_task_deferrals` query:

```ts
    supabase.from('habit_support_observations').select('*').eq('family_id', familyId).then(emptyWhenTableMissing),
    supabase.from('habit_cue_plans').select('*').eq('family_id', familyId).then(emptyWhenTableMissing),
```

(e) In the returned `experience` object add after `deferredTasks`:

```ts
      supportObservations: supportObservationsResult.data ?? [],
      cuePlans: cuePlansResult.data ?? [],
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/cloud-family-rows.test.ts tests/unit/cloud-family-sync.test.ts`
Expected: PASS (3 new tests plus the existing sync tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/cloud-family-sync.ts tests/unit/cloud-family-rows.test.ts
git commit -m "feat(habits): sync support observations and cue plans for signed-in parents" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Merging rows a child device loaded

**Files:**
- Modify: `src/lib/experience-state.ts`
- Test: `tests/unit/experience-state.test.ts`

**Interfaces:**
- Consumes: `ExperienceState`, `SupportObservation`, `CuePlan` (stage 2).
- Produces: `mergeHabitPrograms(state, loaded: { supportObservations, cuePlans }): ExperienceState`.

- [ ] **Step 1: Write the failing test**

In `tests/unit/experience-state.test.ts` add `mergeHabitPrograms,` to the import list from `@/lib/experience-state` (after `setSupportObservation,` is fine, keep the list alphabetical) and append:

```ts
describe('merging habit programs loaded from a paired child device', () => {
  it('adds new rows, keeps the newer version of a row and never drops what is already here', () => {
    const newerLocal = { ...observation, support_level: 'alone' as const, recorded_at: '2026-09-30T12:00:00+07:00' };
    const olderLoaded = { ...observation, support_level: 'together' as const, recorded_at: '2026-09-30T09:00:00+07:00' };
    const extraLoaded = { ...observation, log_id: '66666666-6666-4666-8666-666666666666' };
    const localOnly = { ...observation, log_id: '77777777-7777-4777-8777-777777777777' };
    const start = { ...emptyExperienceState, supportObservations: [newerLocal, localOnly] };
    const merged = mergeHabitPrograms(start, { supportObservations: [olderLoaded, extraLoaded], cuePlans: [] });
    expect(merged.supportObservations).toHaveLength(3);
    expect(merged.supportObservations.find((row) => row.log_id === logId)?.support_level).toBe('alone');
    expect(merged.supportObservations.map((row) => row.log_id)).toContain(extraLoaded.log_id);
    expect(merged.supportObservations.map((row) => row.log_id)).toContain(localOnly.log_id);
  });

  it('prefers a loaded row that is newer and merges cue plans by child and habit', () => {
    const olderLocal = { ...cuePlan, cue_text: 'Old', updated_at: '2026-09-29T09:00:00+07:00' };
    const newerLoaded = { ...cuePlan, cue_text: 'New', updated_at: '2026-09-30T09:00:00+07:00' };
    const merged = mergeHabitPrograms({ ...emptyExperienceState, cuePlans: [olderLocal] }, { supportObservations: [], cuePlans: [newerLoaded] });
    expect(merged.cuePlans).toEqual([newerLoaded]);
  });

  it('returns the same state when nothing changes', () => {
    const start = { ...emptyExperienceState, supportObservations: [observation], cuePlans: [cuePlan] };
    expect(mergeHabitPrograms(start, { supportObservations: [observation], cuePlans: [cuePlan] })).toBe(start);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/experience-state.test.ts`
Expected: FAIL for the three new tests (`mergeHabitPrograms is not a function`).

- [ ] **Step 3: Write the implementation**

Append to `src/lib/experience-state.ts`:

```ts
function newest<Row>(current: Row | undefined, incoming: Row, stamp: (row: Row) => string): Row {
  if (!current) return incoming;
  return Date.parse(stamp(incoming)) > Date.parse(stamp(current)) ? incoming : current;
}

/**
 * Adds what a paired child device loaded without dropping anything already here, so a save
 * that finished while the request was in flight is not lost. The newer version of a row wins.
 */
export function mergeHabitPrograms(
  state: ExperienceState,
  loaded: { readonly supportObservations: readonly SupportObservation[]; readonly cuePlans: readonly CuePlan[] },
): ExperienceState {
  const observations = new Map(state.supportObservations.map((row) => [row.log_id, row]));
  for (const row of loaded.supportObservations) {
    observations.set(row.log_id, newest(observations.get(row.log_id), row, (item) => item.recorded_at));
  }
  const plans = new Map(state.cuePlans.map((row) => [`${row.child_id}:${row.activity_id}`, row]));
  for (const row of loaded.cuePlans) {
    const key = `${row.child_id}:${row.activity_id}`;
    plans.set(key, newest(plans.get(key), row, (item) => item.updated_at));
  }
  const supportObservations = [...observations.values()];
  const cuePlans = [...plans.values()];
  const unchanged = supportObservations.length === state.supportObservations.length
    && cuePlans.length === state.cuePlans.length
    && supportObservations.every((row) => state.supportObservations.includes(row))
    && cuePlans.every((row) => state.cuePlans.includes(row));
  return unchanged ? state : { ...state, supportObservations, cuePlans };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/experience-state.test.ts`
Expected: PASS (18 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/experience-state.ts tests/unit/experience-state.test.ts
git commit -m "feat(habits): merge habit program rows without losing a newer save" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: One definition of what a cue plan may contain

**Files:**
- Create: `src/lib/habit-programs/cue-plan-input.ts`
- Modify: `src/app/api/domain/experience/route.ts`
- Test: existing `tests/api/experience.test.ts` (unchanged; it already pins the limits)

**Interfaces:**
- Consumes: nothing new.
- Produces: `cuePlanFields` (Zod shape), `timeMatchesKind(value)`, `cuePlanInputSchema`, type `CuePlanInput = { cueKind, cueText, cueTime, placeText, weekendVariantText }`.

- [ ] **Step 1: Confirm the behaviour to preserve**

Run: `npx vitest run tests/api/experience.test.ts`
Expected: PASS (20 tests). These include "rejects a time cue without a time, an event cue with one, and over-long text", which must keep passing after the refactor.

- [ ] **Step 2: Write the shared definition**

`src/lib/habit-programs/cue-plan-input.ts`:

```ts
import { z } from 'zod';

/** What a person may type for a cue plan; shared by the form, the store and the server route. */
export const cuePlanFields = {
  cueKind: z.enum(['event', 'time']),
  cueText: z.string().trim().min(1).max(200),
  cueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  placeText: z.string().trim().max(120).nullable(),
  weekendVariantText: z.string().trim().max(200).nullable(),
};

/** A time cue needs a time of day; an event cue ("after dinner") must not have one. */
export function timeMatchesKind(value: { cueKind: string; cueTime: string | null }): boolean {
  return (value.cueKind === 'time') === (value.cueTime !== null);
}

export const cuePlanInputSchema = z.object(cuePlanFields).strict().refine(timeMatchesKind);

export type CuePlanInput = z.infer<typeof cuePlanInputSchema>;
```

- [ ] **Step 3: Use it in the route**

In `src/app/api/domain/experience/route.ts` add `import { cuePlanFields, timeMatchesKind } from '@/lib/habit-programs/cue-plan-input';` after the experience-flags import, and replace the whole `saveCuePlan` entry of `commandSchema` with:

```ts
  z.object({
    type: z.literal('saveCuePlan'),
    childId: z.string().uuid(),
    activityId: z.string().uuid(),
    ...cuePlanFields,
  }).strict().refine(timeMatchesKind),
```

- [ ] **Step 4: Run the tests to verify nothing changed**

Run: `npx vitest run tests/api/experience.test.ts && rm -rf .next/dev/types && npx tsc --noEmit`
Expected: PASS (20 tests); TypeScript reports no problems.

- [ ] **Step 5: Commit**

```bash
git add src/lib/habit-programs/cue-plan-input.ts src/app/api/domain/experience/route.ts
git commit -m "refactor(habits): define the cue plan input once for the form, store and server" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Habit traits and the child summary

**Files:**
- Create: `src/lib/habit-programs/habit-traits.ts`
- Create: `src/lib/habit-programs/summary.ts`
- Modify: `src/lib/habit-programs/suggestions.ts` (one type)
- Modify: `src/lib/habit-programs/index.ts` (replace with the version below)
- Test: `tests/unit/habit-programs/habit-traits.test.ts`
- Test: `tests/unit/habit-programs/summary.test.ts`

**Interfaces:**
- Consumes: everything from the stage 1 module; `ExperienceState`, `supportLevelsByLogId` (stage 2); `localDayKey` from `@/lib/habit-fire`.
- Produces: `FRAMEWORK_HABIT_TRAITS`, `DEFAULT_HABIT_TRAITS`, `habitTraits(frameworkHabitId | undefined): { complexity, cadence }`; `childAgeYears(child, today)`; `summarizeChildHabits({ child, activities, logs, experience, today }): { ageYears, habits: HabitSummary[], suggestions: HabitSuggestion[] }`, where `HabitSummary = { activityId, title, complexity, cadence, since, evaluation, suggestions }`. `HabitSuggestion.habitId` becomes `string | null` (null for suggestions about the whole child).

- [ ] **Step 1: Write the failing tests**

`tests/unit/habit-programs/habit-traits.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { HABIT_FRAMEWORK_CATALOG } from '@/lib/habit-framework/catalog';
import { DEFAULT_HABIT_TRAITS, FRAMEWORK_HABIT_TRAITS, habitTraits } from '@/lib/habit-programs/habit-traits';

describe('habit traits', () => {
  it('classifies every framework habit and nothing else', () => {
    expect(Object.keys(FRAMEWORK_HABIT_TRAITS).sort()).toEqual(HABIT_FRAMEWORK_CATALOG.map((habit) => habit.id).sort());
  });

  it('follows the reviewed draft for a few known habits', () => {
    expect(habitTraits('GD1-SK-02')).toEqual({ complexity: 'simple', cadence: 'due-day' });
    expect(habitTraits('GD3-TC-01')).toEqual({ complexity: 'medium', cadence: 'weekly' });
    expect(habitTraits('GD5-NT-02')).toEqual({ complexity: 'complex', cadence: 'weekly' });
  });

  it('treats the family\'s own habits as medium and unknown ids the same way', () => {
    expect(habitTraits(undefined)).toBe(DEFAULT_HABIT_TRAITS);
    expect(habitTraits('not-a-framework-id')).toBe(DEFAULT_HABIT_TRAITS);
    expect(DEFAULT_HABIT_TRAITS).toEqual({ complexity: 'medium', cadence: 'due-day' });
  });
});
```

`tests/unit/habit-programs/summary.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emptyExperienceState } from '@/lib/experience-state';
import type { CuePlan, ExperienceState } from '@/lib/experience-state';
import { childAgeYears, summarizeChildHabits } from '@/lib/habit-programs/summary';
import type { ActivityLog, ChildProfile, HabitActivity } from '@/types';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const otherChildId = '33333333-3333-4333-8333-333333333333';
const readingId = '44444444-4444-4444-8444-444444444444';
const brushingId = '55555555-5555-4555-8555-555555555555';

function activity(id: string, overrides: Partial<HabitActivity> = {}): HabitActivity {
  return {
    id, childId: null, title: `Habit ${id.slice(0, 4)}`, icon: '✓', category: 'study', points: 10,
    recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6], timeOfDay: 'anytime',
    requiresApproval: false, isActive: true, createdAt: '2026-01-01T00:00:00.000Z', ...overrides,
  };
}

function plan(activityId: string, overrides: Partial<CuePlan> = {}): CuePlan {
  return {
    family_id: familyId, child_id: childId, activity_id: activityId, cue_kind: 'event', cue_text: 'After dinner',
    cue_time: null, place_text: null, weekend_variant_text: null,
    created_at: '2026-01-01T12:00:00.000Z', updated_at: '2026-01-01T12:00:00.000Z', ...overrides,
  };
}

function log(activityId: string, date: string, status: ActivityLog['status'] = 'completed', id = `${activityId}-${date}`): ActivityLog {
  return { id, activityId, childId, date, status, pointsAwarded: 10, completedAt: `${date}T12:00:00.000Z` };
}

function state(overrides: Partial<ExperienceState>): ExperienceState {
  return { ...emptyExperienceState, ...overrides };
}

const child = { id: childId, age: 8 } as Pick<ChildProfile, 'id' | 'age' | 'birthYear' | 'ageStage'>;
const days = (from: string, count: number) =>
  Array.from({ length: count }, (_, index) => new Date(Date.UTC(2026, 0, Number(from.slice(-2)) + index, 12)).toISOString().slice(0, 10));

describe('child age', () => {
  it('prefers the stored age, then the birth year, then the middle of the age stage', () => {
    expect(childAgeYears({ age: 7, birthYear: 2000, ageStage: '12-18' }, '2026-09-30')).toBe(7);
    expect(childAgeYears({ birthYear: 2019, ageStage: '12-18' }, '2026-09-30')).toBe(7);
    expect(childAgeYears({ ageStage: '3-6' }, '2026-09-30')).toBe(4);
    expect(childAgeYears({ ageStage: '12-18' }, '2026-09-30')).toBe(15);
    expect(childAgeYears({}, '2026-09-30')).toBe(9);
  });
});

describe('summarizeChildHabits', () => {
  it('has nothing to say about a child with no cue plans', () => {
    const result = summarizeChildHabits({ child, activities: [activity(readingId)], logs: [], experience: emptyExperienceState, today: '2026-02-01' });
    expect(result.habits).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  it('evaluates each planned habit from the day the plan was made', () => {
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId, { frameworkHabitId: 'GD3-HT-02' })],
      logs: days('2026-01-02', 4).map((date) => log(readingId, date)),
      experience: state({ cuePlans: [plan(readingId)] }),
      today: '2026-01-10',
    });
    expect(result.habits).toHaveLength(1);
    expect(result.habits[0]).toMatchObject({ activityId: readingId, complexity: 'medium', cadence: 'due-day', since: '2026-01-01' });
    expect(result.habits[0].evaluation.phase).toBe('build');
  });

  it('does not count the day the plan was made as a miss', () => {
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId)],
      logs: [],
      experience: state({ cuePlans: [plan(readingId, { created_at: '2026-01-05T12:00:00.000Z' })] }),
      today: '2026-01-06',
    });
    expect(result.habits[0].evaluation.consecutiveMissed).toBe(0);
    expect(result.habits[0].evaluation.phase).toBe('anchor');
  });

  it('feeds recorded support levels into the evaluation', () => {
    const logs = days('2026-01-02', 14).map((date) => log(readingId, date));
    const supportObservations = logs.map((entry) => ({
      log_id: entry.id, family_id: familyId, child_id: childId, activity_id: readingId,
      support_level: 'alone' as const, recorded_by: 'parent' as const, recorded_at: '2026-01-20T09:00:00+07:00',
    }));
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId)],
      logs,
      experience: state({ cuePlans: [plan(readingId)], supportObservations }),
      today: '2026-01-16',
    });
    expect(result.habits[0].evaluation.aloneInWindow).toBe(10);
    expect(result.habits[0].evaluation.phase).toBe('fade');
  });

  it('does not count days the family paused as missed', () => {
    const settings = {
      family_id: familyId, paused_at: null, pause_reason: null,
      pause_periods: [{ startedAt: '2026-01-03T00:00:00+07:00', endedAt: '2026-01-07T00:00:00+07:00' }],
    };
    const result = summarizeChildHabits({
      child,
      activities: [activity(readingId)],
      logs: [log(readingId, '2026-01-02')],
      experience: state({ cuePlans: [plan(readingId)], settings }),
      today: '2026-01-08',
    });
    expect(result.habits[0].evaluation.consecutiveMissed).toBe(1);
    expect(result.habits[0].evaluation.missedInLastFive).toBe(1);
  });

  it('ignores plans for other children, inactive habits and habits assigned to someone else', () => {
    const result = summarizeChildHabits({
      child,
      activities: [
        activity(readingId, { isActive: false }),
        activity(brushingId, { childId: otherChildId }),
      ],
      logs: [],
      experience: state({ cuePlans: [
        plan(readingId),
        plan(brushingId),
        plan(readingId, { child_id: otherChildId }),
        plan('66666666-6666-4666-8666-666666666666'),
      ] }),
      today: '2026-01-10',
    });
    expect(result.habits).toEqual([]);
  });

  it('warns when a small child is setting up too many habits and ranks the most urgent first', () => {
    const young = { id: childId, age: 2 } as typeof child;
    const result = summarizeChildHabits({
      child: young,
      activities: [activity(readingId), activity(brushingId)],
      logs: [],
      experience: state({ cuePlans: [plan(readingId), plan(brushingId)] }),
      today: '2026-01-10',
    });
    expect(result.suggestions.map((entry) => entry.suggestion.code)).toContain('too-many-new');
    expect(result.suggestions.length).toBeLessThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/habit-programs/habit-traits.test.ts tests/unit/habit-programs/summary.test.ts`
Expected: FAIL (`Failed to resolve import` for `habit-traits` and `summary`).

- [ ] **Step 3: Write the implementation**

`src/lib/habit-programs/habit-traits.ts`:

```ts
import type { Cadence, ComplexityClass } from './types';

export type HabitTraits = {
  readonly complexity: ComplexityClass;
  readonly cadence: Cadence;
};

/**
 * How hard each framework habit is to make automatic and how often it comes round.
 * Draft classification awaiting the project owner's review; see the design spec, appendix A.
 * Framework cadences "daily" and "several times a week" both follow the habit's own schedule (`due-day`).
 */
export const FRAMEWORK_HABIT_TRAITS: Readonly<Record<string, HabitTraits>> = {
  'GD1-NT-01': { complexity: 'medium', cadence: 'due-day' }, // Vòng lặp phát–đáp
  'GD1-NT-02': { complexity: 'medium', cadence: 'due-day' }, // Nếp ngày êm và tự trấn an
  'GD1-SK-01': { complexity: 'medium', cadence: 'due-day' }, // Ngủ lành, ngủ đủ
  'GD1-SK-02': { complexity: 'simple', cadence: 'due-day' }, // Vận động thô và vui chơi
  'GD1-MQH-01': { complexity: 'simple', cadence: 'due-day' }, // Ba nghi thức lễ nền
  'GD1-MQH-02': { complexity: 'medium', cadence: 'due-day' }, // Sẻ chia và luân phiên
  'GD1-HT-01': { complexity: 'simple', cadence: 'due-day' }, // Ngôn ngữ sống và sách mỗi ngày
  'GD1-TC-01': { complexity: 'medium', cadence: 'due-day' }, // Trật tự và chờ đợi ngắn
  'GD2-NT-01': { complexity: 'medium', cadence: 'due-day' }, // Gọi tên cảm xúc và 3 nhịp thở
  'GD2-NT-02': { complexity: 'complex', cadence: 'due-day' }, // Nói thật và dũng cảm nhận lỗi
  'GD2-SK-01': { complexity: 'medium', cadence: 'due-day' }, // Ngủ đủ và nghi thức tắt màn hình
  'GD2-SK-02': { complexity: 'medium', cadence: 'due-day' }, // Vận động 180 phút và kỹ năng thể chất
  'GD2-MQH-01': { complexity: 'simple', cadence: 'due-day' }, // Bảy bố thí phiên bản mầm
  'GD2-MQH-02': { complexity: 'medium', cadence: 'due-day' }, // Xin phép, chọn bạn, hòa giải
  'GD2-HT-01': { complexity: 'medium', cadence: 'due-day' }, // Đọc, kể lại, hỏi "vì sao"
  'GD2-TC-01': { complexity: 'medium', cadence: 'weekly' }, // Ba lọ tiền đầu tiên
  'GD2-HT-02': { complexity: 'simple', cadence: 'due-day' }, // Việc nhà thuộc về con
  'GD3-NT-01': { complexity: 'medium', cadence: 'due-day' }, // Nhật ký biết ơn và lời khen tối
  'GD3-NT-02': { complexity: 'complex', cadence: 'due-day' }, // Tự đặt mục tiêu và giữ một thói quen
  'GD3-SK-01': { complexity: 'medium', cadence: 'due-day' }, // Ngủ 9–12 giờ, không màn hình
  'GD3-SK-02': { complexity: 'medium', cadence: 'due-day' }, // 60 phút vận động và một môn có chỉ số
  'GD3-MQH-01': { complexity: 'complex', cadence: 'due-day' }, // Giao tiếp thông thái
  'GD3-MQH-02': { complexity: 'complex', cadence: 'weekly' }, // Nhận diện 9 dạng người, giữ nhân duyên
  'GD3-HT-01': { complexity: 'complex', cadence: 'due-day' }, // Phương pháp học chủ động
  'GD3-HT-02': { complexity: 'medium', cadence: 'due-day' }, // Học sâu 25 phút và ngân hàng thời gian
  'GD3-TC-01': { complexity: 'medium', cadence: 'weekly' }, // Ngân sách 4 phong bì
  'GD3-TC-02': { complexity: 'complex', cadence: 'weekly' }, // Việc lớn hơn và kiếm tiền bằng giá trị
  'GD4-NT-01': { complexity: 'complex', cadence: 'due-day' }, // Nhật ký nhận thức
  'GD4-NT-02': { complexity: 'complex', cadence: 'due-day' }, // Luật sắt bản thân (cấp 1)
  'GD4-NT-03': { complexity: 'complex', cadence: 'due-day' }, // Tự điều hòa cảm xúc dưới áp lực
  'GD4-SK-01': { complexity: 'medium', cadence: 'due-day' }, // Ngủ 8–10 giờ, giờ ngủ trước 23h
  'GD4-SK-02': { complexity: 'complex', cadence: 'due-day' }, // Tập sức mạnh và dinh dưỡng cơ bản
  'GD4-MQH-01': { complexity: 'complex', cadence: 'weekly' }, // Dẫn dắt một nhóm nhỏ
  'GD4-MQH-02': { complexity: 'complex', cadence: 'due-day' }, // Xin lỗi, cảm ơn, phản hồi 3 lớp
  'GD4-HT-01': { complexity: 'complex', cadence: 'due-day' }, // Học tự chủ: kế hoạch, tự đánh giá
  'GD4-HT-02': { complexity: 'complex', cadence: 'due-day' }, // Đọc sâu, tranh luận hai phía
  'GD4-TC-01': { complexity: 'complex', cadence: 'weekly' }, // Tài chính teen: ghi chép, thu nhập đầu
  'GD5-NT-01': { complexity: 'complex', cadence: 'weekly' }, // Luật sắt bản thân (cấp 2)
  'GD5-NT-02': { complexity: 'complex', cadence: 'weekly' }, // Nhận thức sứ mệnh, ước mơ đủ lớn
  'GD5-NT-03': { complexity: 'complex', cadence: 'weekly' }, // Thấu hiểu nhân sinh, bố thí có chủ đích
  'GD5-SK-01': { complexity: 'complex', cadence: 'due-day' }, // Sức khỏe cấp vận động viên
  'GD5-SK-02': { complexity: 'complex', cadence: 'due-day' }, // Quản trị thân và hình thể
  'GD5-MQH-01': { complexity: 'complex', cadence: 'weekly' }, // Trở thành duyên lành
  'GD5-MQH-02': { complexity: 'complex', cadence: 'weekly' }, // Truyền thông cá nhân
  'GD5-HT-01': { complexity: 'complex', cadence: 'due-day' }, // Tự học chuyên sâu và sản phẩm tri thức
  'GD5-TC-01': { complexity: 'complex', cadence: 'weekly' }, // Quản trị tài chính cá nhân
  'GD5-HT-03': { complexity: 'complex', cadence: 'weekly' }, // Lộ trình nghề ước mơ
};

/** Habits the family made themselves are treated as medium and follow their own schedule. */
export const DEFAULT_HABIT_TRAITS: HabitTraits = { complexity: 'medium', cadence: 'due-day' };

export function habitTraits(frameworkHabitId: string | undefined): HabitTraits {
  return (frameworkHabitId && FRAMEWORK_HABIT_TRAITS[frameworkHabitId]) || DEFAULT_HABIT_TRAITS;
}
```

`src/lib/habit-programs/summary.ts`:

```ts
import type { ExperienceState } from '@/lib/experience-state';
import { supportLevelsByLogId } from '@/lib/experience-state';
import { localDayKey } from '@/lib/habit-fire';
import type { ActivityLog, ChildProfile, HabitActivity } from '@/types';
import { habitTraits } from './habit-traits';
import { buildOpportunities } from './opportunities';
import { evaluateHabitPhase } from './phase';
import type { PhaseEvaluation } from './phase';
import { overloadSuggestion, rankChildSuggestions, suggestAdjustments } from './suggestions';
import type { HabitSuggestion, Suggestion } from './suggestions';
import type { Cadence, ComplexityClass } from './types';

export type HabitSummary = {
  readonly activityId: string;
  readonly title: string;
  readonly complexity: ComplexityClass;
  readonly cadence: Cadence;
  /** First day that counts for this habit: the day its cue plan was made. */
  readonly since: string;
  readonly evaluation: PhaseEvaluation;
  readonly suggestions: readonly Suggestion[];
};

export type ChildHabitSummary = {
  readonly ageYears: number;
  readonly habits: readonly HabitSummary[];
  /** The few suggestions worth showing for this child, most urgent first. */
  readonly suggestions: readonly HabitSuggestion[];
};

export type SummaryInput = {
  readonly child: Pick<ChildProfile, 'id' | 'age' | 'birthYear' | 'ageStage'>;
  readonly activities: readonly HabitActivity[];
  readonly logs: readonly ActivityLog[];
  readonly experience: ExperienceState;
  /** Today's local day, YYYY-MM-DD. */
  readonly today: string;
};

const STAGE_AGE_YEARS: Readonly<Record<NonNullable<ChildProfile['ageStage']>, number>> = {
  '0-3': 2,
  '3-6': 4,
  '6-12': 9,
  '12-18': 15,
};
const UNKNOWN_AGE_YEARS = 9;

export function childAgeYears(
  child: Pick<ChildProfile, 'age' | 'birthYear' | 'ageStage'>,
  today: string,
): number {
  if (child.age !== undefined) return child.age;
  if (child.birthYear !== undefined) return Math.max(0, Number(today.slice(0, 4)) - child.birthYear);
  return child.ageStage ? STAGE_AGE_YEARS[child.ageStage] : UNKNOWN_AGE_YEARS;
}

/**
 * Where each of a child's planned habits stands and what to suggest.
 * Only habits with a cue plan take part: making the plan is what starts the habit's journey.
 */
export function summarizeChildHabits(input: SummaryInput): ChildHabitSummary {
  const { child, experience, today } = input;
  const ageYears = childAgeYears(child, today);
  const supportByLogId = supportLevelsByLogId(experience, child.id);
  const pausePeriods = experience.settings?.pause_periods ?? [];

  const plans = experience.cuePlans
    .filter((plan) => plan.child_id === child.id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const habits: HabitSummary[] = [];
  for (const plan of plans) {
    const activity = input.activities.find((candidate) => candidate.id === plan.activity_id);
    if (!activity?.isActive || (activity.childId !== null && activity.childId !== child.id)) continue;

    const traits = habitTraits(activity.frameworkHabitId);
    const since = localDayKey(new Date(plan.created_at));
    const opportunities = buildOpportunities({
      activityId: activity.id,
      childId: child.id,
      recurrence: activity,
      cadence: traits.cadence,
      since,
      today,
      logs: input.logs,
      supportByLogId,
      deferrals: experience.deferredTasks,
      pausePeriods,
    }).filter((entry, index) => !(index === 0 && entry.date === since && entry.outcome === 'missed'));

    const evaluation = evaluateHabitPhase({ opportunities, hasCuePlan: true, cadence: traits.cadence });
    habits.push({
      activityId: activity.id,
      title: activity.title,
      complexity: traits.complexity,
      cadence: traits.cadence,
      since,
      evaluation,
      suggestions: suggestAdjustments({ evaluation, complexity: traits.complexity, ageYears, today }),
    });
  }

  const overload = overloadSuggestion(habits.map((habit) => habit.evaluation.phase), ageYears);
  const suggestions = rankChildSuggestions([
    ...habits.flatMap((habit) => habit.suggestions.map((suggestion) => ({ habitId: habit.activityId, suggestion }))),
    ...(overload ? [{ habitId: null, suggestion: overload }] : []),
  ]);
  return { ageYears, habits, suggestions };
}
```

In `src/lib/habit-programs/suggestions.ts` replace the `HabitSuggestion` type with:

```ts
export type HabitSuggestion = {
  /** The habit the suggestion is about, or null when it concerns the child as a whole. */
  readonly habitId: string | null;
  readonly suggestion: Suggestion;
};
```

Replace `src/lib/habit-programs/index.ts` with:

```ts
export { HABIT_PROGRAM_CONFIG, newHabitLimit, requiredCount } from './config';
export { cuePlanFields, cuePlanInputSchema, timeMatchesKind } from './cue-plan-input';
export type { CuePlanInput } from './cue-plan-input';
export { DEFAULT_HABIT_TRAITS, FRAMEWORK_HABIT_TRAITS, habitTraits } from './habit-traits';
export type { HabitTraits } from './habit-traits';
export { addDays, buildOpportunities, isActivityDueOn, weekStart } from './opportunities';
export type { DeferralRow, OpportunityInput } from './opportunities';
export { evaluateHabitPhase } from './phase';
export type { PhaseEvaluation, PhaseInput } from './phase';
export { childAgeYears, summarizeChildHabits } from './summary';
export type { ChildHabitSummary, HabitSummary, SummaryInput } from './summary';
export { overloadSuggestion, rankChildSuggestions, stuckThresholdWeeks, suggestAdjustments } from './suggestions';
export type { HabitSuggestion, Suggestion, SuggestionCode, SuggestionInput } from './suggestions';
export type { Cadence, ComplexityClass, HabitPhase, Opportunity, OpportunityOutcome, SupportLevel } from './types';
```

- [ ] **Step 4: Run the tests to verify they pass, in three time zones**

Run each and expect all to pass:

```bash
for tz in UTC Asia/Ho_Chi_Minh America/Los_Angeles; do TZ=$tz npx vitest run tests/unit/habit-programs; done
rm -rf .next/dev/types && npx tsc --noEmit
```

Expected: PASS (57 tests per zone at the time of writing); TypeScript reports no problems.

- [ ] **Step 5: Commit**

```bash
git add src/lib/habit-programs/habit-traits.ts src/lib/habit-programs/summary.ts src/lib/habit-programs/suggestions.ts src/lib/habit-programs/index.ts tests/unit/habit-programs/habit-traits.test.ts tests/unit/habit-programs/summary.test.ts
git commit -m "feat(habits): summarize where each planned habit stands and what to suggest" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Actions and store glue

**Files:**
- Create: `src/lib/store/habit-program-actions.ts`
- Modify: `src/lib/store.tsx`
- Test: `tests/unit/habit-program-actions.test.ts`

**Interfaces:**
- Consumes: `cuePlanInputSchema`, `CuePlanInput` (Task 4); `mergeHabitPrograms` (Task 3); `loadChildHabitPrograms` (stage 2); `setSupportObservation`, `setCuePlan`, `parseSupportObservation`, `parseCuePlan` (stage 2).
- Produces: `createHabitProgramActions(dependencies): { recordSupport(logId, level): Promise<boolean>, saveCuePlan(activityId, input): Promise<boolean> }`; the store value gains `recordHabitSupport(logId, level)` and `saveHabitCuePlan(activityId, input)`.

- [ ] **Step 1: Write the failing test**

`tests/unit/habit-program-actions.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { emptyExperienceState } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
import type { CuePlanInput } from '@/lib/habit-programs/cue-plan-input';
import { createHabitProgramActions } from '@/lib/store/habit-program-actions';
import type { HabitProgramActionDependencies } from '@/lib/store/habit-program-actions';
import type { ActivityLog, HabitActivity } from '@/types';

const familyId = '11111111-1111-4111-8111-111111111111';
const childId = '22222222-2222-4222-8222-222222222222';
const otherChildId = '33333333-3333-4333-8333-333333333333';
const activityId = '44444444-4444-4444-8444-444444444444';
const logId = '55555555-5555-4555-8555-555555555555';
const now = new Date('2026-09-30T05:00:00.000Z');

const activity: HabitActivity = {
  id: activityId, childId: null, title: 'Read', icon: '📚', category: 'study', points: 10,
  recurrenceType: 'daily', recurrenceDays: [0, 1, 2, 3, 4, 5, 6], timeOfDay: 'anytime',
  requiresApproval: false, isActive: true, createdAt: '2026-01-01T00:00:00.000Z',
};
const doneLog: ActivityLog = {
  id: logId, activityId, childId, date: '2026-09-30', status: 'completed', pointsAwarded: 10, completedAt: '2026-09-30T01:00:00.000Z',
};
const cueInput: CuePlanInput = { cueKind: 'event', cueText: 'After dinner', cueTime: null, placeText: null, weekendVariantText: null };

function harness(overrides: Partial<HabitProgramActionDependencies> = {}, respond?: () => Response | Promise<Response>) {
  let experience: ExperienceState = emptyExperienceState;
  const request = vi.fn(async () => (respond ? respond() : new Response('{}', { status: 500 })));
  const actions = createHabitProgramActions({
    activeChildId: childId,
    familyId,
    isDemoSession: false,
    isSignedInParent: true,
    isPairedChild: false,
    logs: [doneLog],
    activities: [activity],
    setExperience: (update) => { experience = typeof update === 'function' ? update(experience) : update; },
    request,
    now: () => now,
    ...overrides,
  });
  return { actions, request, experience: () => experience };
}

const observationRow = (level: 'alone' | 'prompted' | 'together', by: 'parent' | 'child' = 'parent') => ({
  log_id: logId, family_id: familyId, child_id: childId, activity_id: activityId,
  support_level: level, recorded_by: by, recorded_at: '2026-09-30T05:00:00.000Z',
});
const cueRow = (overrides: Record<string, unknown> = {}) => ({
  family_id: familyId, child_id: childId, activity_id: activityId, cue_kind: 'event', cue_text: 'After dinner',
  cue_time: null, place_text: null, weekend_variant_text: null,
  created_at: '2026-09-01T05:00:00.000Z', updated_at: '2026-09-30T05:00:00.000Z', ...overrides,
});

describe('recording how a habit was done', () => {
  it('refuses without a request when there is nothing valid to record', async () => {
    for (const overrides of [
      { activeChildId: null },
      { logs: [] },
      { logs: [{ ...doneLog, status: 'pending_approval' as const }] },
      { logs: [{ ...doneLog, status: 'rejected' as const }] },
      { logs: [{ ...doneLog, childId: otherChildId }] },
      { isSignedInParent: false, isPairedChild: false },
    ]) {
      const { actions, request } = harness(overrides);
      await expect(actions.recordSupport(logId, 'alone')).resolves.toBe(false);
      expect(request).not.toHaveBeenCalled();
    }
  });

  it('keeps a demo record on the device, attributed to the parent', async () => {
    const { actions, request, experience } = harness({ isDemoSession: true, isSignedInParent: false });
    await expect(actions.recordSupport(logId, 'prompted')).resolves.toBe(true);
    expect(request).not.toHaveBeenCalled();
    expect(experience().supportObservations).toEqual([expect.objectContaining({
      log_id: logId, child_id: childId, activity_id: activityId, support_level: 'prompted', recorded_by: 'parent',
    })]);
  });

  it('lets a signed-in parent record it and stores the row the server returns', async () => {
    const { actions, request, experience } = harness({}, () => Response.json({ success: true, changed: true, observation: observationRow('alone') }));
    await expect(actions.recordSupport(logId, 'alone')).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/api/domain/experience', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ type: 'recordSupport', logId, level: 'alone' }),
    }));
    expect(experience().supportObservations).toEqual([observationRow('alone')]);
  });

  it('lets a paired child device record it through its own route', async () => {
    const { actions, request, experience } = harness(
      { isSignedInParent: false, isPairedChild: true },
      () => Response.json({ changed: true, observation: observationRow('together', 'child') }),
    );
    await expect(actions.recordSupport(logId, 'together')).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/api/child/habit-programs', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ logId, level: 'together' }),
    }));
    expect(experience().supportObservations[0].recorded_by).toBe('child');
  });

  it('does not claim success when the request fails or the saved row is not the one asked for', async () => {
    const failed = harness({}, () => new Response('{}', { status: 503 }));
    await expect(failed.actions.recordSupport(logId, 'alone')).resolves.toBe(false);
    const mismatch = harness({}, () => Response.json({ success: true, changed: true, observation: observationRow('prompted') }));
    await expect(mismatch.actions.recordSupport(logId, 'alone')).resolves.toBe(false);
    const garbage = harness({}, () => Response.json({ success: true }));
    await expect(garbage.actions.recordSupport(logId, 'alone')).resolves.toBe(false);
    const offline = harness({}, () => { throw new Error('offline'); });
    await expect(offline.actions.recordSupport(logId, 'alone')).resolves.toBe(false);
    for (const attempt of [failed, mismatch, garbage, offline]) expect(attempt.experience().supportObservations).toEqual([]);
  });
});

describe('saving a cue plan', () => {
  it('refuses without a request for invalid text, an unknown or inactive habit, or another child\'s habit', async () => {
    const cases: [Partial<HabitProgramActionDependencies>, CuePlanInput][] = [
      [{}, { ...cueInput, cueText: '   ' }],
      [{}, { ...cueInput, cueKind: 'time' }],
      [{}, { ...cueInput, cueKind: 'event', cueTime: '19:00' }],
      [{ activities: [] }, cueInput],
      [{ activities: [{ ...activity, isActive: false }] }, cueInput],
      [{ activities: [{ ...activity, childId: otherChildId }] }, cueInput],
      [{ activeChildId: null }, cueInput],
    ];
    for (const [overrides, input] of cases) {
      const { actions, request } = harness(overrides);
      await expect(actions.saveCuePlan(activityId, input)).resolves.toBe(false);
      expect(request).not.toHaveBeenCalled();
    }
  });

  it('keeps a demo plan on the device and keeps its first-saved time when it is edited', async () => {
    let clock = now;
    const { actions, experience } = harness({ isDemoSession: true, isSignedInParent: false, now: () => clock });
    await expect(actions.saveCuePlan(activityId, cueInput)).resolves.toBe(true);
    const first = experience().cuePlans[0];
    expect(first).toMatchObject({ child_id: childId, activity_id: activityId, cue_text: 'After dinner', created_at: now.toISOString() });
    clock = new Date('2026-10-05T05:00:00.000Z');
    await expect(actions.saveCuePlan(activityId, { ...cueInput, cueText: 'After brushing teeth' })).resolves.toBe(true);
    expect(experience().cuePlans).toHaveLength(1);
    expect(experience().cuePlans[0]).toMatchObject({
      cue_text: 'After brushing teeth', created_at: now.toISOString(), updated_at: '2026-10-05T05:00:00.000Z',
    });
  });

  it('lets a signed-in parent save it and stores the row the server returns', async () => {
    const row = cueRow({ cue_kind: 'time', cue_time: '19:00:00', cue_text: 'At seven' });
    const { actions, request, experience } = harness({}, () => Response.json({ success: true, cuePlan: row }));
    await expect(actions.saveCuePlan(activityId, { ...cueInput, cueKind: 'time', cueTime: '19:00', cueText: 'At seven' })).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/api/domain/experience', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        type: 'saveCuePlan', childId, activityId, cueKind: 'time', cueText: 'At seven', cueTime: '19:00', placeText: null, weekendVariantText: null,
      }),
    }));
    expect(experience().cuePlans).toEqual([row]);
  });

  it('never lets a paired child device save a plan', async () => {
    const { actions, request } = harness({ isSignedInParent: false, isPairedChild: true });
    await expect(actions.saveCuePlan(activityId, cueInput)).resolves.toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it('does not claim success when the request fails or the saved plan is for something else', async () => {
    const failed = harness({}, () => new Response('{}', { status: 409 }));
    await expect(failed.actions.saveCuePlan(activityId, cueInput)).resolves.toBe(false);
    const wrong = harness({}, () => Response.json({ success: true, cuePlan: cueRow({ activity_id: otherChildId }) }));
    await expect(wrong.actions.saveCuePlan(activityId, cueInput)).resolves.toBe(false);
    expect(failed.experience().cuePlans).toEqual([]);
    expect(wrong.experience().cuePlans).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/habit-program-actions.test.ts`
Expected: FAIL (`Failed to resolve import "@/lib/store/habit-program-actions"`).

- [ ] **Step 3: Write the action creators**

`src/lib/store/habit-program-actions.ts`:

```ts
import type { Dispatch, SetStateAction } from 'react';
import { z } from 'zod';
import { cuePlanInputSchema } from '@/lib/habit-programs/cue-plan-input';
import type { CuePlanInput } from '@/lib/habit-programs/cue-plan-input';
import type { SupportLevel } from '@/lib/habit-programs/types';
import { parseCuePlan, parseSupportObservation, setCuePlan, setSupportObservation } from '@/lib/experience-state';
import type { ExperienceState } from '@/lib/experience-state';
import type { ActivityLog, HabitActivity } from '@/types';

type Requester = (url: string, init?: RequestInit) => Promise<Response>;

const DEMO_FAMILY_ID = '00000000-0000-4000-8000-000000000000';

export type HabitProgramActionDependencies = {
  readonly activeChildId: string | null;
  readonly familyId: string | null;
  readonly isDemoSession: boolean;
  /** A parent or caregiver signed in to the cloud family. */
  readonly isSignedInParent: boolean;
  /** A child's own device, paired with the family by a code. */
  readonly isPairedChild: boolean;
  readonly logs: readonly ActivityLog[];
  readonly activities: readonly HabitActivity[];
  readonly setExperience: Dispatch<SetStateAction<ExperienceState>>;
  readonly request?: Requester;
  readonly now?: () => Date;
};

export type HabitProgramActions = {
  /** How a completed habit was done. Resolves false when nothing was saved. */
  readonly recordSupport: (logId: string, level: SupportLevel) => Promise<boolean>;
  /** The "if this, then that" plan for a habit of the active child. Only signed-in parents and demos can save one. */
  readonly saveCuePlan: (activityId: string, input: CuePlanInput) => Promise<boolean>;
};

export function createHabitProgramActions(dependencies: HabitProgramActionDependencies): HabitProgramActions {
  const request: Requester = dependencies.request ?? fetch;
  const now = dependencies.now ?? (() => new Date());
  const demoFamilyId = dependencies.familyId ?? DEMO_FAMILY_ID;

  const recordSupport = async (logId: string, level: SupportLevel): Promise<boolean> => {
    const childId = dependencies.activeChildId;
    if (!childId) return false;
    const log = dependencies.logs.find((candidate) => candidate.id === logId);
    if (!log || log.childId !== childId || (log.status !== 'completed' && log.status !== 'approved')) return false;

    if (dependencies.isDemoSession) {
      dependencies.setExperience((previous) => setSupportObservation(previous, {
        log_id: log.id,
        family_id: demoFamilyId,
        child_id: childId,
        activity_id: log.activityId,
        support_level: level,
        recorded_by: 'parent',
        recorded_at: now().toISOString(),
      }));
      return true;
    }
    if (!dependencies.isSignedInParent && !dependencies.isPairedChild) return false;

    try {
      const response = await request(
        dependencies.isSignedInParent ? '/api/domain/experience' : '/api/child/habit-programs',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dependencies.isSignedInParent ? { type: 'recordSupport', logId, level } : { logId, level }),
        },
      );
      if (!response.ok) return false;
      const saved = z.object({ observation: z.unknown() }).parse(await response.json());
      const observation = parseSupportObservation(saved.observation);
      if (observation.log_id !== logId || observation.support_level !== level || observation.child_id !== childId) return false;
      dependencies.setExperience((previous) => setSupportObservation(previous, observation));
      return true;
    } catch {
      return false;
    }
  };

  const saveCuePlan = async (activityId: string, input: CuePlanInput): Promise<boolean> => {
    const childId = dependencies.activeChildId;
    if (!childId) return false;
    const parsed = cuePlanInputSchema.safeParse(input);
    if (!parsed.success) return false;
    const activity = dependencies.activities.find((candidate) => candidate.id === activityId);
    if (!activity?.isActive || (activity.childId !== null && activity.childId !== childId)) return false;
    const plan = parsed.data;

    if (dependencies.isDemoSession) {
      const savedAt = now().toISOString();
      dependencies.setExperience((previous) => {
        const existing = previous.cuePlans.find((row) => row.child_id === childId && row.activity_id === activityId);
        return setCuePlan(previous, {
          family_id: demoFamilyId,
          child_id: childId,
          activity_id: activityId,
          cue_kind: plan.cueKind,
          cue_text: plan.cueText,
          cue_time: plan.cueTime,
          place_text: plan.placeText,
          weekend_variant_text: plan.weekendVariantText,
          created_at: existing?.created_at ?? savedAt,
          updated_at: savedAt,
        });
      });
      return true;
    }
    if (!dependencies.isSignedInParent) return false;

    try {
      const response = await request('/api/domain/experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'saveCuePlan', childId, activityId, ...plan }),
      });
      if (!response.ok) return false;
      const saved = z.object({ cuePlan: z.unknown() }).parse(await response.json());
      const cuePlan = parseCuePlan(saved.cuePlan);
      if (cuePlan.child_id !== childId || cuePlan.activity_id !== activityId) return false;
      dependencies.setExperience((previous) => setCuePlan(previous, cuePlan));
      return true;
    } catch {
      return false;
    }
  };

  return { recordSupport, saveCuePlan };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/habit-program-actions.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Connect the store**

In `src/lib/store.tsx`:

(a) Replace the `experience-state` import line with one that also imports `mergeHabitPrograms`:

```ts
import { emptyExperienceState, mergeHabitPrograms, parseChildWishlist, parseDeferredTask, setDeferredTask as updateDeferredTask } from './experience-state';
```

(b) After `import { loadChildTaskDeferrals } from './store/task-deferral-client';` add:

```ts
import { createHabitProgramActions } from './store/habit-program-actions';
import { loadChildHabitPrograms } from './store/habit-programs-client';
import type { CuePlanInput } from './habit-programs/cue-plan-input';
import type { SupportLevel } from './habit-programs/types';
```

(c) In `interface AppStoreContextType`, after the `setTaskDeferred` line add:

```ts
  recordHabitSupport: (logId: string, level: SupportLevel) => Promise<boolean>;
  saveHabitCuePlan: (activityId: string, input: CuePlanInput) => Promise<boolean>;
```

(d) Directly after the effect that calls `loadChildTaskDeferrals` (the one ending with `}, [activeChildId, childSessionRevision, currentUser, isDemoSession, isFamilyConnected]);` right before `const chooseWishlist`), add:

```tsx
  useEffect(() => {
    if (isDemoSession || currentUser || !isFamilyConnected || !activeChildId) return;
    let cancelled = false;
    void loadChildHabitPrograms()
      .then((loaded) => {
        if (cancelled || !loaded) return;
        setExperience((previous) => mergeHabitPrograms(previous, loaded));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [activeChildId, childSessionRevision, currentUser, isDemoSession, isFamilyConnected]);
```

(e) Directly before `const setFamilyPaused = createFamilyPauseAction({` add:

```tsx
  const { recordSupport: recordHabitSupport, saveCuePlan: saveHabitCuePlan } = createHabitProgramActions({
    activeChildId,
    familyId,
    isDemoSession,
    isSignedInParent: Boolean(currentUser),
    isPairedChild: !currentUser && isFamilyConnected,
    logs,
    activities,
    setExperience,
  });
```

(f) In the context value object, after `setTaskDeferred,` add:

```ts
        recordHabitSupport,
        saveHabitCuePlan,
```

- [ ] **Step 6: Verify types, lint and the flows that use the store**

Run: `rm -rf .next/dev/types && npx tsc --noEmit && npx eslint src/lib/store.tsx src/lib/store src/lib/habit-programs && CI=1 npx playwright test smoke entry-journey quest-deferral badge-celebration --project=chromium --retries=0`
Expected: TypeScript and ESLint report no problems; all Playwright tests pass (29 at the time of writing).

- [ ] **Step 7: Commit**

```bash
git add src/lib/store/habit-program-actions.ts tests/unit/habit-program-actions.test.ts src/lib/store.tsx
git commit -m "feat(habits): let the store record support levels and save cue plans" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Verification and pull request

**Files:** none new.

- [ ] **Step 1: Run every check**

```bash
for tz in UTC Asia/Ho_Chi_Minh America/Los_Angeles; do TZ=$tz npx vitest run tests/unit/habit-programs tests/unit/habit-fire.test.ts tests/unit/experience-state.test.ts tests/unit/habit-program-actions.test.ts; done
rm -rf .next/dev/types && npx tsc --noEmit
npx eslint src/lib src/app/api/domain/experience src/app/api/child/habit-programs tests/unit tests/api
npx vitest run
npx vitest run tests/integration
CI=1 npx playwright test smoke entry-journey quest-deferral kid-hero badge-celebration --project=chromium --retries=0
```

Expected: every time-zone run passes; TypeScript and ESLint report no problems; the unit run passes (786 tests at the time of writing); the integration run passes (69); Playwright passes.

- [ ] **Step 2: Open the pull request**

```bash
git push -u origin HEAD
```

Open a pull request against `main` titled `feat(habits): connect the store to adaptive habit programs`. In the body (Vietnamese, ending with the `Generated with Claude Code` line) say that nothing is visible to users yet, list the units (tolerant reads, merge, shared input schema, traits and summary, actions and store glue), and repeat that the stage 2 migration is applied separately by the project owner. Do not merge without the project owner's approval.
