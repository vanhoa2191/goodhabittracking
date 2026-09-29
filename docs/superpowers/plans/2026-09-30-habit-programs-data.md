# Habit Programs Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the stored data and server contract that the adaptive habit programs need: how a child did a completed habit (support observations) and the "if this, then that" cue plan for each child and habit, readable by parents and paired child devices and writable only through checked commands.

**Architecture:** Two new tables with row level security and family-scoped foreign keys; SQL functions that are the only writers (a parent variant, a paired-child variant and a shared internal one) following the existing task-deferral pattern; the rows travel in the existing experience state, so parents read them with the rest of the family state and children through one new session route. Nothing is wired into the store or interface yet; that is the next plan.

**Tech Stack:** PostgreSQL (Supabase migrations, RLS, security definer functions), Next.js 16 route handlers, Zod 4, Vitest (`tests/**/*.test.ts`, alias `@` = `src`).

**Spec:** `docs/superpowers/specs/2026-09-30-adaptive-habit-programs-design.md` (delivery stage 2, sections 2 and 3). The pure logic these rows feed is already in `src/lib/habit-programs/` (stage 1); `supportLevelsByLogId` below produces the `supportByLogId` map that `buildOpportunities` takes.

**Next plan (written after this lands):** store integration (actions, cloud sync for paired children, demo and local mode) together with the parent interface, since the interface decides which actions are needed.

## Global Constraints

- The migration file is `supabase/migrations/202609300001_habit_programs.sql` with its check at `supabase/preflight/202609300001_habit_programs.verify.sql`. **This plan never applies the migration to any database.** The project owner applies it in Supabase and runs the verify script; the plan only adds files and tests.
- Support levels are exactly `alone`, `prompted`, `together`; recorded by `parent` or `child`. Cue kinds are exactly `event` and `time`; a `time` cue has a time of day and an `event` cue has none. Cue text is 1 to 200 characters after trimming, place at most 120, weekend variant at most 200.
- A support observation may exist only for a log whose status is `completed` or `approved`, and only one per log (the log id is the key). Recording the same level again changes nothing (`changed: false`).
- Tables are readable by family members only and are never written directly by users; every write goes through a `security definer` function. The internal writer `record_habit_support_internal` is not executable by `public`, `anon` or `authenticated`.
- The paired child channel can record support for its own child's logs only and cannot save cue plans or read other children.
- Older stored state without the new keys must still load (defaults to empty arrays). Rows from another family must be rejected before they reach the store.
- API error responses never echo database messages. Statuses: 401 no session or not a family manager, 400 malformed input, 409 the log, child or habit is unavailable, 503 anything unexpected including a saved row that does not match the request.
- Commit messages are conventional commits ending with the line `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; no plan or finding labels in code, tests or commits. Stage files explicitly; never commit files under `plans/`.

## Review Focus

- Another family's row in stored or fetched state must be rejected, and the functions must filter every read and write by the caller's family (tests: state "rejects rows from another family"; migration contract "family scoped"; route "mismatching saved row").
- A pending, rejected or deleted log must not be able to receive a support level, and deleting a log, child, habit or family must remove its observations and plans (tests: migration contract "verified log" and "removes observations").
- Recording the same level twice must not change anything, and recording a different level must replace it (tests: migration contract "no-op"; state "replaces the observation").
- A paired child must not be able to record support for another child's log or send extra fields such as a child id, and must have no way to save a cue plan (tests: child route "rejects extra fields", "log is not the child's"; migration contract "device session").
- A time cue with no time, an event cue with a time, a malformed time such as 25:00, blank or over-long text must be refused before the database (tests: route "rejects a time cue without a time"; state "rejects ... time cue"; SQL check constraint).
- Cloud data saved before this change, and local demo state with non-UUID ids, must still load (tests: state "defaults to no observations", "accepts local demo ids").

---

### Task 1: Tables, functions and the migration contract

**Files:**
- Create: `supabase/migrations/202609300001_habit_programs.sql`
- Create: `supabase/preflight/202609300001_habit_programs.verify.sql`
- Test: `tests/integration/migrations/habit-programs.test.ts`

**Interfaces:**
- Consumes (already in the database): `public.families`, `public.child_profiles(id, family_id)` and `public.habit_activities(id, family_id)` unique keys, `public.activity_logs(id)`, `public.device_sessions`, and the functions `public.is_family_member(uuid)` and `public.can_manage_family(uuid)`.
- Produces: tables `public.habit_support_observations` and `public.habit_cue_plans`; functions `set_parent_habit_support(uuid, uuid, text)`, `set_child_habit_support(text, uuid, text)`, `save_parent_habit_cue_plan(uuid, uuid, uuid, text, text, time, text, text)`, `read_child_habit_programs(text)`. Their JSON results: `{status: 'saved', changed, observation}`, `{status: 'saved', cuePlan}`, `{status: 'ready', supportObservations, cuePlans}`, and the failures `session_invalid`, `log_unavailable`, `plan_unavailable`, `invalid_request`.

- [ ] **Step 1: Write the failing test**

`tests/integration/migrations/habit-programs.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from '@libpg-query/parser';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(resolve('supabase/migrations/202609300001_habit_programs.sql'), 'utf8');
const verification = readFileSync(resolve('supabase/preflight/202609300001_habit_programs.verify.sql'), 'utf8');

describe('habit program migration contract', () => {
  it('parses as PostgreSQL SQL', async () => {
    await expect(parse(migration)).resolves.toBeDefined();
    await expect(parse(verification)).resolves.toBeDefined();
  });

  it('keeps observations and cue plans family scoped, forced under row level security and read-only for members', () => {
    expect(migration).toContain('alter table public.habit_cue_plans force row level security;');
    expect(migration).toContain('alter table public.habit_support_observations force row level security;');
    expect(migration).toContain('public.is_family_member(family_id)');
    expect(migration).toContain('grant select on public.habit_cue_plans, public.habit_support_observations to authenticated;');
    expect(migration).not.toMatch(/grant (insert|update|delete)[^;]*habit_(cue_plans|support_observations)/i);
  });

  it('removes observations with their log, child, activity or family', () => {
    expect(migration).toContain('log_id uuid primary key references public.activity_logs(id) on delete cascade');
    expect(migration).toContain('family_id uuid not null references public.families(id) on delete cascade');
    expect(migration).toContain('references public.child_profiles(id, family_id) on delete cascade');
    expect(migration).toContain('references public.habit_activities(id, family_id) on delete cascade');
  });

  it('records support only for a verified log of the right child and only saves an unchanged level as a no-op', () => {
    expect(migration).toContain("log.status in ('completed', 'approved')");
    expect(migration).toContain('(target_child_id is null or log.child_id = target_child_id)');
    expect(migration).toContain('on conflict (log_id) do update');
    expect(migration).toContain('is distinct from excluded.support_level');
  });

  it('exposes the internal writer to nobody and the child channel only through a device session', () => {
    expect(migration).toContain('revoke all on function public.record_habit_support_internal(uuid, uuid, uuid, text, text)\n  from public, anon, authenticated;');
    expect(migration).toContain("and 'child:complete' = any(device.capabilities)");
    expect(migration).toContain("and 'child:read' = any(device.capabilities)");
    expect(migration).toContain('public.can_manage_family(target_family_id)');
  });

  it('requires a time for time cues and none for event cues', () => {
    expect(migration).toContain("(cue_kind = 'time' and cue_time is not null) or (cue_kind = 'event' and cue_time is null)");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/migrations/habit-programs.test.ts`
Expected: FAIL (`ENOENT` for `supabase/migrations/202609300001_habit_programs.sql`).

- [ ] **Step 3: Write the migration and its verification script**

`supabase/migrations/202609300001_habit_programs.sql`:

```sql
begin;

create table public.habit_cue_plans (
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  activity_id uuid not null,
  cue_kind text not null check (cue_kind in ('event', 'time')),
  cue_text text not null check (char_length(btrim(cue_text)) between 1 and 200),
  cue_time time,
  place_text text check (place_text is null or char_length(place_text) <= 120),
  weekend_variant_text text check (weekend_variant_text is null or char_length(weekend_variant_text) <= 200),
  updated_at timestamptz not null default now(),
  primary key (child_id, activity_id),
  constraint habit_cue_plans_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint habit_cue_plans_activity_family_fk foreign key (activity_id, family_id)
    references public.habit_activities(id, family_id) on delete cascade,
  constraint habit_cue_plans_time_matches_kind check (
    (cue_kind = 'time' and cue_time is not null) or (cue_kind = 'event' and cue_time is null)
  )
);

create index habit_cue_plans_family_idx on public.habit_cue_plans (family_id);

create table public.habit_support_observations (
  log_id uuid primary key references public.activity_logs(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null,
  activity_id uuid not null,
  support_level text not null check (support_level in ('alone', 'prompted', 'together')),
  recorded_by text not null check (recorded_by in ('parent', 'child')),
  recorded_at timestamptz not null default now(),
  constraint habit_support_observations_child_family_fk foreign key (child_id, family_id)
    references public.child_profiles(id, family_id) on delete cascade,
  constraint habit_support_observations_activity_family_fk foreign key (activity_id, family_id)
    references public.habit_activities(id, family_id) on delete cascade
);

create index habit_support_observations_child_idx
  on public.habit_support_observations (family_id, child_id, recorded_at desc);

alter table public.habit_cue_plans enable row level security;
alter table public.habit_cue_plans force row level security;
alter table public.habit_support_observations enable row level security;
alter table public.habit_support_observations force row level security;
revoke all on public.habit_cue_plans, public.habit_support_observations from public, anon, authenticated;

create policy habit_cue_plans_read on public.habit_cue_plans
  for select to authenticated using (public.is_family_member(family_id));
create policy habit_support_observations_read on public.habit_support_observations
  for select to authenticated using (public.is_family_member(family_id));
grant select on public.habit_cue_plans, public.habit_support_observations to authenticated;

create function public.record_habit_support_internal(
  target_family_id uuid,
  target_child_id uuid,
  target_log_id uuid,
  target_level text,
  recorder text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  log_row public.activity_logs%rowtype;
  changed_count integer;
  saved public.habit_support_observations%rowtype;
begin
  if target_level not in ('alone', 'prompted', 'together') or recorder not in ('parent', 'child') then
    return jsonb_build_object('status', 'invalid_request');
  end if;

  select * into log_row from public.activity_logs log
  where log.id = target_log_id
    and log.family_id = target_family_id
    and (target_child_id is null or log.child_id = target_child_id)
    and log.status in ('completed', 'approved')
  for share;
  if not found then return jsonb_build_object('status', 'log_unavailable'); end if;

  insert into public.habit_support_observations (
    log_id, family_id, child_id, activity_id, support_level, recorded_by
  ) values (
    log_row.id, log_row.family_id, log_row.child_id, log_row.activity_id, target_level, recorder
  )
  on conflict (log_id) do update
    set support_level = excluded.support_level,
        recorded_by = excluded.recorded_by,
        recorded_at = now()
    where public.habit_support_observations.support_level is distinct from excluded.support_level
       or public.habit_support_observations.recorded_by is distinct from excluded.recorded_by;
  get diagnostics changed_count = row_count;

  select * into saved from public.habit_support_observations observation
  where observation.log_id = target_log_id;
  return jsonb_build_object('status', 'saved', 'changed', changed_count > 0, 'observation', to_jsonb(saved));
end
$$;

create function public.set_parent_habit_support(
  target_family_id uuid,
  target_log_id uuid,
  target_level text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_manage_family(target_family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;
  return public.record_habit_support_internal(target_family_id, null, target_log_id, target_level, 'parent');
end
$$;

create function public.set_child_habit_support(
  session_token_hash text,
  target_log_id uuid,
  target_level text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
  result jsonb;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:complete' = any(device.capabilities)
  for update;
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  result := public.record_habit_support_internal(
    child_session.family_id, child_session.child_id, target_log_id, target_level, 'child'
  );
  update public.device_sessions set last_seen_at = now() where id = child_session.id;
  return result;
end
$$;

create function public.save_parent_habit_cue_plan(
  target_family_id uuid,
  target_child_id uuid,
  target_activity_id uuid,
  target_cue_kind text,
  target_cue_text text,
  target_cue_time time,
  target_place_text text,
  target_weekend_variant_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved public.habit_cue_plans%rowtype;
begin
  if not public.can_manage_family(target_family_id) then
    return jsonb_build_object('status', 'session_invalid');
  end if;

  perform 1 from public.child_profiles child
  where child.id = target_child_id and child.family_id = target_family_id
  for share;
  if not found then return jsonb_build_object('status', 'plan_unavailable'); end if;

  perform 1 from public.habit_activities activity
  where activity.id = target_activity_id
    and activity.family_id = target_family_id
    and (activity.child_id is null or activity.child_id = target_child_id)
    and activity.is_active
  for share;
  if not found then return jsonb_build_object('status', 'plan_unavailable'); end if;

  insert into public.habit_cue_plans (
    family_id, child_id, activity_id, cue_kind, cue_text, cue_time, place_text, weekend_variant_text
  ) values (
    target_family_id, target_child_id, target_activity_id, target_cue_kind, btrim(target_cue_text),
    target_cue_time, nullif(btrim(target_place_text), ''), nullif(btrim(target_weekend_variant_text), '')
  )
  on conflict (child_id, activity_id) do update
    set cue_kind = excluded.cue_kind,
        cue_text = excluded.cue_text,
        cue_time = excluded.cue_time,
        place_text = excluded.place_text,
        weekend_variant_text = excluded.weekend_variant_text,
        updated_at = now()
  returning * into saved;
  return jsonb_build_object('status', 'saved', 'cuePlan', to_jsonb(saved));
end
$$;

create function public.read_child_habit_programs(session_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_session public.device_sessions%rowtype;
begin
  select * into child_session from public.device_sessions device
  where device.token_hash = session_token_hash
    and device.revoked_at is null
    and device.expires_at > now()
    and 'child:read' = any(device.capabilities);
  if not found then return jsonb_build_object('status', 'session_invalid'); end if;

  return jsonb_build_object(
    'status', 'ready',
    'supportObservations', coalesce((
      select jsonb_agg(to_jsonb(observation) order by observation.recorded_at desc)
      from public.habit_support_observations observation
      where observation.family_id = child_session.family_id
        and observation.child_id = child_session.child_id
    ), '[]'::jsonb),
    'cuePlans', coalesce((
      select jsonb_agg(to_jsonb(plan) order by plan.updated_at desc)
      from public.habit_cue_plans plan
      where plan.family_id = child_session.family_id
        and plan.child_id = child_session.child_id
    ), '[]'::jsonb)
  );
end
$$;

revoke all on function public.record_habit_support_internal(uuid, uuid, uuid, text, text)
  from public, anon, authenticated;
revoke all on function public.set_parent_habit_support(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.set_child_habit_support(text, uuid, text)
  from public, anon, authenticated;
revoke all on function public.save_parent_habit_cue_plan(uuid, uuid, uuid, text, text, time, text, text)
  from public, anon, authenticated;
revoke all on function public.read_child_habit_programs(text)
  from public, anon, authenticated;
grant execute on function public.set_parent_habit_support(uuid, uuid, text) to authenticated;
grant execute on function public.set_child_habit_support(text, uuid, text) to anon, authenticated;
grant execute on function public.save_parent_habit_cue_plan(uuid, uuid, uuid, text, text, time, text, text)
  to authenticated;
grant execute on function public.read_child_habit_programs(text) to anon, authenticated;

commit;
```

`supabase/preflight/202609300001_habit_programs.verify.sql`:

```sql
do $$
begin
  if to_regclass('public.habit_cue_plans') is null or to_regclass('public.habit_support_observations') is null then
    raise exception 'Habit program tables are missing';
  end if;

  if exists (
    select 1 from pg_catalog.pg_class relation
    where relation.oid in ('public.habit_cue_plans'::regclass, 'public.habit_support_observations'::regclass)
      and not (relation.relrowsecurity and relation.relforcerowsecurity)
  ) then
    raise exception 'Habit program tables must enforce row level security';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.habit_cue_plans', 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', 'public.habit_support_observations', 'INSERT')
    or pg_catalog.has_table_privilege('anon', 'public.habit_cue_plans', 'SELECT')
    or pg_catalog.has_table_privilege('anon', 'public.habit_support_observations', 'SELECT') then
    raise exception 'Habit program table privileges are too broad';
  end if;

  if pg_catalog.has_function_privilege('anon', 'public.set_parent_habit_support(uuid,uuid,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.save_parent_habit_cue_plan(uuid,uuid,uuid,text,text,time,text,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('anon', 'public.record_habit_support_internal(uuid,uuid,uuid,text,text)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.record_habit_support_internal(uuid,uuid,uuid,text,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.set_parent_habit_support(uuid,uuid,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('authenticated', 'public.save_parent_habit_cue_plan(uuid,uuid,uuid,text,text,time,text,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.set_child_habit_support(text,uuid,text)', 'EXECUTE')
    or not pg_catalog.has_function_privilege('anon', 'public.read_child_habit_programs(text)', 'EXECUTE') then
    raise exception 'Habit program execution grants are incorrect';
  end if;

  if exists (
    select 1 from public.habit_support_observations observation
    join public.activity_logs log on log.id = observation.log_id
    where log.family_id <> observation.family_id
      or log.child_id <> observation.child_id
      or log.activity_id <> observation.activity_id
  ) then
    raise exception 'A support observation does not match its log';
  end if;
end $$;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/migrations/habit-programs.test.ts`
Expected: PASS (6 tests). The first test parses both files with the real PostgreSQL parser.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/202609300001_habit_programs.sql supabase/preflight/202609300001_habit_programs.verify.sql tests/integration/migrations/habit-programs.test.ts
git commit -m "feat(habits): add tables and commands for support observations and cue plans" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Rows in the experience state

**Files:**
- Modify: `src/lib/experience-state.ts`
- Test: `tests/unit/experience-state.test.ts`

**Interfaces:**
- Consumes: the existing `uuid`, `timestamp`, `demoChildId` helpers and `experienceRows`/`demoExperienceRows` in the same file.
- Produces: types `SupportObservation`, `CuePlan`; parsers `parseSupportObservation(s)`, `parseCuePlan(s)`; new `ExperienceState` keys `supportObservations` and `cuePlans` (empty by default); reducers `setSupportObservation(state, row)`, `setCuePlan(state, row)`; `supportLevelsByLogId(state, childId): Map<string, 'alone' | 'prompted' | 'together'>`.

- [ ] **Step 1: Write the failing test**

In `tests/unit/experience-state.test.ts` replace the first import line with:

```ts
import {
  emptyExperienceState,
  parseExperienceState,
  setCuePlan,
  setDeferredTask,
  setJournalEntry,
  setSupportObservation,
  supportLevelsByLogId,
} from '@/lib/experience-state';
```

and append at the end of the file:

```ts
const logId = '55555555-5555-4555-8555-555555555555';
const activityId = '44444444-4444-4444-8444-444444444444';
const observation = {
  log_id: logId,
  family_id: familyA,
  child_id: childId,
  activity_id: activityId,
  support_level: 'prompted' as const,
  recorded_by: 'parent' as const,
  recorded_at: '2026-09-30T09:00:00+07:00',
};
const cuePlan = {
  family_id: familyA,
  child_id: childId,
  activity_id: activityId,
  cue_kind: 'event' as const,
  cue_text: 'Sau khi đánh răng, con đọc một trang sách',
  cue_time: null,
  place_text: 'Giường của con',
  weekend_variant_text: null,
  updated_at: '2026-09-30T09:00:00+07:00',
};

describe('habit program rows in the experience state', () => {
  it('defaults to no observations or cue plans for older data', () => {
    const olderState = { children: [], settings: null, letters: [], quests: [], wishlists: [] };
    const parsed = parseExperienceState(olderState, familyA);
    expect(parsed.supportObservations).toEqual([]);
    expect(parsed.cuePlans).toEqual([]);
  });

  it('accepts rows from the database and rejects rows from another family', () => {
    const state = { ...emptyExperienceState, supportObservations: [observation], cuePlans: [{ ...cuePlan, cue_kind: 'time' as const, cue_time: '19:30:00' }] };
    expect(parseExperienceState(state, familyA).supportObservations).toEqual([observation]);
    expect(() => parseExperienceState({ ...state, supportObservations: [{ ...observation, family_id: familyB }] }, familyA)).toThrow();
    expect(() => parseExperienceState({ ...state, cuePlans: [{ ...cuePlan, family_id: familyB }] }, familyA)).toThrow();
  });

  it('rejects an unknown support level and a time cue without a time of day', () => {
    expect(() => parseExperienceState({ ...emptyExperienceState, supportObservations: [{ ...observation, support_level: 'perfect' }] }, familyA)).toThrow();
    expect(() => parseExperienceState({ ...emptyExperienceState, cuePlans: [{ ...cuePlan, cue_kind: 'time', cue_time: null }] }, familyA)).toThrow();
    expect(() => parseExperienceState({ ...emptyExperienceState, cuePlans: [{ ...cuePlan, cue_kind: 'event', cue_time: '19:30:00' }] }, familyA)).toThrow();
  });

  it('accepts local demo ids that are not UUIDs', () => {
    const demoObservation = { ...observation, log_id: 'log-1', child_id: 'child-1', activity_id: 'activity-1' };
    const demoPlan = { ...cuePlan, child_id: 'child-1', activity_id: 'activity-1' };
    const parsed = parseExperienceState({ ...emptyExperienceState, supportObservations: [demoObservation], cuePlans: [demoPlan] }, familyA, true);
    expect(parsed.supportObservations).toEqual([demoObservation]);
    expect(parsed.cuePlans).toEqual([demoPlan]);
  });

  it('replaces the observation of a log and keeps the others', () => {
    const other = { ...observation, log_id: '66666666-6666-4666-8666-666666666666' };
    const first = setSupportObservation({ ...emptyExperienceState, supportObservations: [other] }, observation);
    const changed = setSupportObservation(first, { ...observation, support_level: 'alone', recorded_at: '2026-09-30T10:00:00+07:00' });
    expect(changed.supportObservations).toHaveLength(2);
    expect(changed.supportObservations.find((row) => row.log_id === logId)?.support_level).toBe('alone');
    expect(setSupportObservation(changed, changed.supportObservations.find((row) => row.log_id === logId)!)).toBe(changed);
  });

  it('replaces the cue plan of a child and habit and keeps the others', () => {
    const otherHabit = { ...cuePlan, activity_id: '77777777-7777-4777-8777-777777777777' };
    const first = setCuePlan({ ...emptyExperienceState, cuePlans: [otherHabit] }, cuePlan);
    const changed = setCuePlan(first, { ...cuePlan, cue_text: 'Sau bữa tối, con đọc sách', updated_at: '2026-09-30T10:00:00+07:00' });
    expect(changed.cuePlans).toHaveLength(2);
    expect(changed.cuePlans.find((row) => row.activity_id === activityId)?.cue_text).toBe('Sau bữa tối, con đọc sách');
  });

  it('lists the support level of each log for one child', () => {
    const state = {
      ...emptyExperienceState,
      supportObservations: [observation, { ...observation, log_id: '88888888-8888-4888-8888-888888888888', child_id: 'someone-else' }],
    };
    expect([...supportLevelsByLogId(state, childId)]).toEqual([[logId, 'prompted']]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/experience-state.test.ts`
Expected: FAIL (the new tests fail because `setSupportObservation` and the other new exports do not exist, and older tests keep passing).

- [ ] **Step 3: Write the implementation**

In `src/lib/experience-state.ts`, make these edits.

(a) Directly after the `deferredTaskRow` definition add:

```ts
const supportObservationRow = z.object({
  log_id: uuid,
  family_id: uuid,
  child_id: uuid,
  activity_id: uuid,
  support_level: z.enum(['alone', 'prompted', 'together']),
  recorded_by: z.enum(['parent', 'child']),
  recorded_at: timestamp,
});
const cuePlanShape = {
  family_id: uuid,
  child_id: uuid,
  activity_id: uuid,
  cue_kind: z.enum(['event', 'time']),
  cue_text: z.string().trim().min(1).max(200),
  cue_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable(),
  place_text: z.string().max(120).nullable(),
  weekend_variant_text: z.string().max(200).nullable(),
  updated_at: timestamp,
};
const timeMatchesKind = (plan: { cue_kind: string; cue_time: string | null }) => (
  (plan.cue_kind === 'time') === (plan.cue_time !== null)
);
const timeMatchesKindMessage = { message: 'A time cue needs a time of day and an event cue must not have one.' };
const cuePlanRow = z.object(cuePlanShape).refine(timeMatchesKind, timeMatchesKindMessage);
```

(b) After `export type DeferredTask = z.infer<typeof deferredTaskRow>;` add:

```ts
export type SupportObservation = z.infer<typeof supportObservationRow>;
export type CuePlan = z.infer<typeof cuePlanRow>;
```

(c) After `parseDeferredTasks` add:

```ts
export function parseSupportObservation(input: unknown): SupportObservation {
  return supportObservationRow.parse(input);
}

export function parseSupportObservations(input: unknown): SupportObservation[] {
  return z.array(supportObservationRow).parse(input);
}

export function parseCuePlan(input: unknown): CuePlan {
  return cuePlanRow.parse(input);
}

export function parseCuePlans(input: unknown): CuePlan[] {
  return z.array(cuePlanRow).parse(input);
}
```

(d) In `type ExperienceState` add, after `readonly deferredTasks: readonly DeferredTask[];`:

```ts
  readonly supportObservations: readonly SupportObservation[];
  readonly cuePlans: readonly CuePlan[];
```

(e) In `emptyExperienceState` add, after `deferredTasks: [],`:

```ts
  supportObservations: [],
  cuePlans: [],
```

(f) In `experienceRows` add, after the `deferredTasks` line:

```ts
  supportObservations: z.array(supportObservationRow).default([]),
  cuePlans: z.array(cuePlanRow).default([]),
```

(g) In `demoExperienceRows` add, after its `deferredTasks` line:

```ts
  supportObservations: z.array(supportObservationRow.extend({
    log_id: z.string().min(1), child_id: demoChildId, activity_id: z.string().min(1),
  })).default([]),
  cuePlans: z.array(z.object({ ...cuePlanShape, child_id: demoChildId, activity_id: z.string().min(1) })
    .refine(timeMatchesKind, timeMatchesKindMessage)).default([]),
```

(h) In `parseExperienceState`, add `...state.supportObservations,` and `...state.cuePlans,` to the `rows` array, after `...state.deferredTasks,`, so a row from another family is rejected.

(i) At the end of the file add:

```ts
export function setSupportObservation(state: ExperienceState, observation: SupportObservation): ExperienceState {
  const existing = state.supportObservations.find((row) => row.log_id === observation.log_id);
  if (existing && JSON.stringify(existing) === JSON.stringify(observation)) return state;
  return {
    ...state,
    supportObservations: [
      ...state.supportObservations.filter((row) => row.log_id !== observation.log_id),
      observation,
    ],
  };
}

export function setCuePlan(state: ExperienceState, plan: CuePlan): ExperienceState {
  return {
    ...state,
    cuePlans: [
      ...state.cuePlans.filter((row) => row.child_id !== plan.child_id || row.activity_id !== plan.activity_id),
      plan,
    ],
  };
}

/** The recorded support level of each of one child's logs, ready for buildOpportunities. */
export function supportLevelsByLogId(
  state: ExperienceState,
  childId: string,
): Map<string, SupportObservation['support_level']> {
  return new Map(state.supportObservations
    .filter((row) => row.child_id === childId)
    .map((row) => [row.log_id, row.support_level] as const));
}
```

- [ ] **Step 4: Run the tests to verify they pass, and that nothing else broke**

Run: `npx vitest run tests/unit/experience-state.test.ts && rm -rf .next/dev/types && npx tsc --noEmit`
Expected: PASS (14 tests); TypeScript reports no problems. (`tests/api/experience.test.ts` has one expectation that now needs the new keys; Task 3 updates it.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/experience-state.ts tests/unit/experience-state.test.ts
git commit -m "feat(habits): carry support observations and cue plans in the family state" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Parent commands and read

**Files:**
- Modify: `src/app/api/domain/experience/route.ts`
- Test: `tests/api/experience.test.ts`

**Interfaces:**
- Consumes: `parseSupportObservation`, `parseCuePlan` (Task 2); RPCs `set_parent_habit_support` and `save_parent_habit_cue_plan` (Task 1); the existing `getParentContext`, `commandSchema` and the `switch` in this route.
- Produces: `GET` now also returns `supportObservations` and `cuePlans`. `POST` accepts `{type: 'recordSupport', logId, level}` and `{type: 'saveCuePlan', childId, activityId, cueKind, cueText, cueTime: 'HH:MM' | null, placeText | null, weekendVariantText | null}`, answering `{success: true, changed, observation}` and `{success: true, cuePlan}`.

- [ ] **Step 1: Write the failing tests**

In `tests/api/experience.test.ts`, change the expectation of `hydrates a family with no engagement rows` to:

```ts
    await expect(response.json()).resolves.toEqual({
      children: [], settings: null, letters: [], quests: [], wishlists: [], deferredTasks: [],
      supportObservations: [], cuePlans: [], journalEntries: [], cityPurchases: [],
    });
```

then, inside the outer `describe('/api/domain/experience', ...)` and after its last `it(...)`, add:

```ts
  describe('habit programs', () => {
    const logId = '99999999-9999-4999-8999-999999999999';
    const observation = {
      log_id: logId,
      family_id: familyId,
      child_id: childId,
      activity_id: childId,
      support_level: 'alone',
      recorded_by: 'parent',
      recorded_at: '2026-09-30T09:00:00.000Z',
    };
    const cuePlan = {
      family_id: familyId,
      child_id: childId,
      activity_id: childId,
      cue_kind: 'time',
      cue_text: 'Lúc 7 giờ tối, con đọc sách',
      cue_time: '19:00:00',
      place_text: null,
      weekend_variant_text: 'Cuối tuần đọc sau bữa sáng',
      updated_at: '2026-09-30T09:00:00.000Z',
    };
    const savePlan = {
      type: 'saveCuePlan', childId, activityId: childId, cueKind: 'time', cueText: 'Lúc 7 giờ tối, con đọc sách',
      cueTime: '19:00', placeText: null, weekendVariantText: 'Cuối tuần đọc sau bữa sáng',
    };

    it('reads support observations and cue plans with the rest of the family state', async () => {
      const rows: Record<string, unknown[]> = { habit_support_observations: [observation], habit_cue_plans: [cuePlan] };
      from.mockImplementation((table: string) => ({
        select: () => ({
          eq: () => table === 'family_engagement_settings'
            ? { maybeSingle: async () => ({ data: null, error: null }) }
            : Promise.resolve({ data: rows[table] ?? [], error: null }),
        }),
      }));
      const body = await (await GET()).json();
      expect(body.supportObservations).toEqual([observation]);
      expect(body.cuePlans).toEqual([cuePlan]);
    });

    it('fails the read when either table cannot be loaded', async () => {
      from.mockImplementation((table: string) => ({
        select: () => ({
          eq: () => table === 'family_engagement_settings'
            ? { maybeSingle: async () => ({ data: null, error: null }) }
            : Promise.resolve(table === 'habit_cue_plans' ? { data: null, error: { code: 'x' } } : { data: [], error: null }),
        }),
      }));
      expect((await GET()).status).toBe(503);
    });

    it('records how a completed habit was done through the family boundary', async () => {
      rpc.mockResolvedValue({ data: { status: 'saved', changed: true, observation }, error: null });
      const response = await POST(request({ type: 'recordSupport', logId, level: 'alone' }));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true, changed: true, observation });
      expect(rpc).toHaveBeenCalledWith('set_parent_habit_support', {
        target_family_id: familyId, target_log_id: logId, target_level: 'alone',
      });
    });

    it('rejects an unknown level and a log that is not completed or not the family\'s', async () => {
      expect((await POST(request({ type: 'recordSupport', logId, level: 'perfect' }))).status).toBe(400);
      expect((await POST(request({ type: 'recordSupport', logId: 'bad', level: 'alone' }))).status).toBe(400);
      expect(rpc).not.toHaveBeenCalled();
      rpc.mockResolvedValue({ data: { status: 'log_unavailable' }, error: null });
      expect((await POST(request({ type: 'recordSupport', logId, level: 'alone' }))).status).toBe(409);
      rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
      expect((await POST(request({ type: 'recordSupport', logId, level: 'alone' }))).status).toBe(401);
    });

    it('does not report success when the saved row is not the one requested', async () => {
      rpc.mockResolvedValue({ data: { status: 'saved', changed: true, observation: { ...observation, support_level: 'prompted' } }, error: null });
      expect((await POST(request({ type: 'recordSupport', logId, level: 'alone' }))).status).toBe(503);
      rpc.mockResolvedValue({ data: { status: 'saved', changed: true, observation: { ...observation, family_id: '33333333-3333-4333-8333-333333333333' } }, error: null });
      expect((await POST(request({ type: 'recordSupport', logId, level: 'alone' }))).status).toBe(503);
    });

    it('saves a cue plan and trims what the parent typed', async () => {
      rpc.mockResolvedValue({ data: { status: 'saved', cuePlan }, error: null });
      const response = await POST(request({ ...savePlan, cueText: '  Lúc 7 giờ tối, con đọc sách  ' }));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ success: true, cuePlan });
      expect(rpc).toHaveBeenCalledWith('save_parent_habit_cue_plan', {
        target_family_id: familyId,
        target_child_id: childId,
        target_activity_id: childId,
        target_cue_kind: 'time',
        target_cue_text: 'Lúc 7 giờ tối, con đọc sách',
        target_cue_time: '19:00',
        target_place_text: null,
        target_weekend_variant_text: 'Cuối tuần đọc sau bữa sáng',
      });
    });

    it('rejects a time cue without a time, an event cue with one, and over-long text', async () => {
      expect((await POST(request({ ...savePlan, cueTime: null }))).status).toBe(400);
      expect((await POST(request({ ...savePlan, cueKind: 'event' }))).status).toBe(400);
      expect((await POST(request({ ...savePlan, cueTime: '25:00' }))).status).toBe(400);
      expect((await POST(request({ ...savePlan, cueText: 'x'.repeat(201) }))).status).toBe(400);
      expect((await POST(request({ ...savePlan, cueText: '   ' }))).status).toBe(400);
      expect(rpc).not.toHaveBeenCalled();
    });

    it('reports an unavailable child or habit and a mismatching saved plan', async () => {
      rpc.mockResolvedValue({ data: { status: 'plan_unavailable' }, error: null });
      expect((await POST(request(savePlan))).status).toBe(409);
      rpc.mockResolvedValue({ data: { status: 'saved', cuePlan: { ...cuePlan, activity_id: '33333333-3333-4333-8333-333333333333' } }, error: null });
      expect((await POST(request(savePlan))).status).toBe(503);
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/api/experience.test.ts`
Expected: FAIL: the hydrate test (missing keys) and the new habit program tests. The "rejects a time cue without a time..." test may already pass because unknown commands are refused; it is still required.

- [ ] **Step 3: Write the implementation**

In `src/app/api/domain/experience/route.ts`:

(a) Change the experience-state import to:

```ts
import { parseCuePlan, parseDeferredTask, parseExperienceState, parseSupportObservation } from '@/lib/experience-state';
```

(b) In `commandSchema`, add these two entries before `z.object({ type: z.literal('pauseFamily') })`:

```ts
  z.object({
    type: z.literal('recordSupport'),
    logId: z.string().uuid(),
    level: z.enum(['alone', 'prompted', 'together']),
  }).strict(),
  z.object({
    type: z.literal('saveCuePlan'),
    childId: z.string().uuid(),
    activityId: z.string().uuid(),
    cueKind: z.enum(['event', 'time']),
    cueText: z.string().trim().min(1).max(200),
    cueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
    placeText: z.string().trim().max(120).nullable(),
    weekendVariantText: z.string().trim().max(200).nullable(),
  }).strict().refine((command) => (command.cueKind === 'time') === (command.cueTime !== null)),
```

(c) In `GET`, replace the destructuring and the error check so the two new tables are read and checked:

```ts
  const [
    children, settings, letters, quests, wishlists, deferredTasks, supportObservations, cuePlans, journalEntries, cityPurchases,
  ] = await Promise.all([
```

add these two queries directly after the `child_task_deferrals` query:

```ts
    supabase.from('habit_support_observations').select('*').eq('family_id', parent.familyId),
    supabase.from('habit_cue_plans').select('*').eq('family_id', parent.familyId),
```

replace the line `if ([children, settings, ... cityPurchases].some((result) => result.error)) {` with:

```ts
  const results = [
    children, settings, letters, quests, wishlists, deferredTasks, supportObservations, cuePlans, journalEntries, cityPurchases,
  ];
  if (results.some((result) => result.error)) {
```

and add these two keys to the object passed to `parseExperienceState`, after `deferredTasks`:

```ts
    supportObservations: supportObservations.data ?? [],
    cuePlans: cuePlans.data ?? [],
```

(d) In the `POST` `switch`, add these two cases before `case 'pauseFamily':`:

```ts
    case 'recordSupport': {
      const { data, error } = await supabase.rpc('set_parent_habit_support', {
        target_family_id: parent.familyId,
        target_log_id: command.logId,
        target_level: command.level,
      });
      if (error) return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
      if (data?.status === 'session_invalid') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      if (data?.status === 'log_unavailable') return NextResponse.json({ error: 'Habit record is unavailable.' }, { status: 409 });
      const saved = z.object({ status: z.literal('saved'), changed: z.boolean(), observation: z.unknown() }).safeParse(data);
      if (!saved.success) return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
      try {
        const observation = parseSupportObservation(saved.data.observation);
        if (observation.family_id !== parent.familyId
          || observation.log_id !== command.logId
          || observation.support_level !== command.level) {
          return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
        }
        return NextResponse.json({ success: true, changed: saved.data.changed, observation });
      } catch {
        return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
      }
    }
    case 'saveCuePlan': {
      const { data, error } = await supabase.rpc('save_parent_habit_cue_plan', {
        target_family_id: parent.familyId,
        target_child_id: command.childId,
        target_activity_id: command.activityId,
        target_cue_kind: command.cueKind,
        target_cue_text: command.cueText,
        target_cue_time: command.cueTime,
        target_place_text: command.placeText,
        target_weekend_variant_text: command.weekendVariantText,
      });
      if (error) return NextResponse.json({ error: 'Cue plan could not be saved.' }, { status: 503 });
      if (data?.status === 'session_invalid') return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      if (data?.status === 'plan_unavailable') return NextResponse.json({ error: 'Child or habit is unavailable.' }, { status: 409 });
      const saved = z.object({ status: z.literal('saved'), cuePlan: z.unknown() }).safeParse(data);
      if (!saved.success) return NextResponse.json({ error: 'Cue plan could not be saved.' }, { status: 503 });
      try {
        const cuePlan = parseCuePlan(saved.data.cuePlan);
        if (cuePlan.family_id !== parent.familyId
          || cuePlan.child_id !== command.childId
          || cuePlan.activity_id !== command.activityId) {
          return NextResponse.json({ error: 'Cue plan could not be saved.' }, { status: 503 });
        }
        return NextResponse.json({ success: true, cuePlan });
      } catch {
        return NextResponse.json({ error: 'Cue plan could not be saved.' }, { status: 503 });
      }
    }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/api/experience.test.ts && rm -rf .next/dev/types && npx tsc --noEmit && npx eslint src/app/api/domain/experience tests/api/experience.test.ts`
Expected: PASS (18 tests); TypeScript and ESLint report no problems.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/domain/experience/route.ts tests/api/experience.test.ts
git commit -m "feat(habits): let parents record support levels and save cue plans" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Paired child route and client

**Files:**
- Create: `src/app/api/child/habit-programs/route.ts`
- Create: `src/lib/store/habit-programs-client.ts`
- Test: `tests/api/child-habit-programs.test.ts`
- Test: `tests/unit/habit-programs-client.test.ts`

**Interfaces:**
- Consumes: `parseSupportObservation(s)`, `parseCuePlans` (Task 2); RPCs `read_child_habit_programs` and `set_child_habit_support` (Task 1); `CHILD_SESSION_COOKIE` and `sha256Hex` from `@/lib/pairing/crypto`.
- Produces: `GET /api/child/habit-programs` returning `{supportObservations, cuePlans}`; `POST` taking `{logId, level}` and returning `{changed, observation}`; `loadChildHabitPrograms(request?): Promise<{supportObservations, cuePlans} | null>` in `src/lib/store/habit-programs-client.ts`.

- [ ] **Step 1: Write the failing tests**

`tests/api/child-habit-programs.test.ts`:

```ts
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookieGet, rpc } = vi.hoisted(() => ({ cookieGet: vi.fn(), rpc: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: cookieGet })) }));
vi.mock('@/lib/pairing/crypto', () => ({
  CHILD_SESSION_COOKIE: 'kidhabit_child_session',
  sha256Hex: vi.fn(async () => 'hashed-child-session'),
}));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));

import { GET, POST } from '@/app/api/child/habit-programs/route';

const logId = '11111111-1111-4111-8111-111111111111';
const familyId = '22222222-2222-4222-8222-222222222222';
const childId = '33333333-3333-4333-8333-333333333333';
const activityId = '44444444-4444-4444-8444-444444444444';
const observation = {
  log_id: logId,
  family_id: familyId,
  child_id: childId,
  activity_id: activityId,
  support_level: 'alone',
  recorded_by: 'child',
  recorded_at: '2026-09-30T09:00:00.000Z',
};
const cuePlan = {
  family_id: familyId,
  child_id: childId,
  activity_id: activityId,
  cue_kind: 'event',
  cue_text: 'Sau khi đánh răng, con đọc một trang sách',
  cue_time: null,
  place_text: null,
  weekend_variant_text: null,
  updated_at: '2026-09-30T09:00:00.000Z',
};

function request(body: unknown) {
  return new NextRequest('http://localhost/api/child/habit-programs', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('paired child habit programs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue({ value: 'opaque-child-session' });
  });

  it('reads only the paired child observations and cue plans through the session', async () => {
    rpc.mockResolvedValue({ data: { status: 'ready', supportObservations: [observation], cuePlans: [cuePlan] }, error: null });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ supportObservations: [observation], cuePlans: [cuePlan] });
    expect(rpc).toHaveBeenCalledWith('read_child_habit_programs', { session_token_hash: 'hashed-child-session' });
  });

  it('records how the child did a habit through the paired session, idempotently', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', changed: false, observation }, error: null });
    const response = await POST(request({ logId, level: 'alone' }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ changed: false, observation });
    expect(rpc).toHaveBeenCalledWith('set_child_habit_support', {
      session_token_hash: 'hashed-child-session',
      target_log_id: logId,
      target_level: 'alone',
    });
  });

  it('rejects malformed input, extra fields and a log that is not the child\'s', async () => {
    expect((await POST(request({ logId: 'bad', level: 'alone' }))).status).toBe(400);
    expect((await POST(request({ logId, level: 'perfect' }))).status).toBe(400);
    expect((await POST(request({ logId, level: 'alone', childId }))).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
    rpc.mockResolvedValue({ data: { status: 'log_unavailable' }, error: null });
    expect((await POST(request({ logId, level: 'alone' }))).status).toBe(409);
  });

  it('does not claim success when the saved row differs from the request', async () => {
    rpc.mockResolvedValue({ data: { status: 'saved', changed: true, observation: { ...observation, support_level: 'prompted' } }, error: null });
    expect((await POST(request({ logId, level: 'alone' }))).status).toBe(503);
  });

  it('expires a revoked child session on read and on write', async () => {
    rpc.mockResolvedValue({ data: { status: 'session_invalid' }, error: null });
    const read = await GET();
    expect(read.status).toBe(401);
    expect(read.headers.get('set-cookie')).toContain('kidhabit_child_session=;');
    expect((await POST(request({ logId, level: 'alone' }))).status).toBe(401);
  });

  it('asks for a session when the cookie is missing', async () => {
    cookieGet.mockReturnValue(undefined);
    expect((await GET()).status).toBe(401);
    expect((await POST(request({ logId, level: 'alone' }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
});
```

`tests/unit/habit-programs-client.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { loadChildHabitPrograms } from '@/lib/store/habit-programs-client';

const row = {
  log_id: '11111111-1111-4111-8111-111111111111',
  family_id: '22222222-2222-4222-8222-222222222222',
  child_id: '33333333-3333-4333-8333-333333333333',
  activity_id: '44444444-4444-4444-8444-444444444444',
  support_level: 'prompted',
  recorded_by: 'child',
  recorded_at: '2026-09-30T09:00:00.000Z',
};

describe('child habit program client', () => {
  it('returns parsed observations and cue plans', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ supportObservations: [row], cuePlans: [] })));
    await expect(loadChildHabitPrograms(request)).resolves.toEqual({ supportObservations: [row], cuePlans: [] });
    expect(request).toHaveBeenCalledWith('/api/child/habit-programs', { cache: 'no-store' });
  });

  it('returns null when the request fails or the payload is not valid', async () => {
    await expect(loadChildHabitPrograms(async () => new Response('no', { status: 503 }))).resolves.toBeNull();
    await expect(loadChildHabitPrograms(async () => new Response(JSON.stringify({ supportObservations: [{ ...row, support_level: 'perfect' }], cuePlans: [] })))).resolves.toBeNull();
    await expect(loadChildHabitPrograms(async () => new Response(JSON.stringify({ nope: true })))).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/api/child-habit-programs.test.ts tests/unit/habit-programs-client.test.ts`
Expected: FAIL (`Failed to resolve import` for the route and the client).

- [ ] **Step 3: Write the implementation**

`src/app/api/child/habit-programs/route.ts`:

```ts
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CHILD_SESSION_COOKIE, sha256Hex } from '@/lib/pairing/crypto';
import { parseCuePlans, parseSupportObservation, parseSupportObservations } from '@/lib/experience-state';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const commandSchema = z.object({
  logId: z.string().uuid(),
  level: z.enum(['alone', 'prompted', 'together']),
}).strict();

function invalidSession() {
  const response = NextResponse.json({ error: 'Child device session expired or revoked.' }, { status: 401 });
  response.cookies.delete(CHILD_SESSION_COOKIE);
  return response;
}

async function sessionHash() {
  const token = (await cookies()).get(CHILD_SESSION_COOKIE)?.value;
  return token ? sha256Hex(token) : null;
}

export async function GET() {
  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('read_child_habit_programs', { session_token_hash: tokenHash });
  if (error) return NextResponse.json({ error: 'Habits could not be loaded.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  const parsed = z.object({
    status: z.literal('ready'),
    supportObservations: z.array(z.unknown()),
    cuePlans: z.array(z.unknown()),
  }).safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: 'Habits could not be loaded.' }, { status: 503 });
  try {
    return NextResponse.json({
      supportObservations: parseSupportObservations(parsed.data.supportObservations),
      cuePlans: parseCuePlans(parsed.data.cuePlans),
    });
  } catch {
    return NextResponse.json({ error: 'Habits could not be loaded.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error: unknown) {
    if (!(error instanceof SyntaxError)) throw error;
    return NextResponse.json({ error: 'Invalid support level.' }, { status: 400 });
  }
  const command = commandSchema.safeParse(body);
  if (!command.success) return NextResponse.json({ error: 'Invalid support level.' }, { status: 400 });

  const tokenHash = await sessionHash();
  if (!tokenHash) return invalidSession();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('set_child_habit_support', {
    session_token_hash: tokenHash,
    target_log_id: command.data.logId,
    target_level: command.data.level,
  });
  if (error) return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
  if (data?.status === 'session_invalid') return invalidSession();
  if (data?.status === 'log_unavailable') return NextResponse.json({ error: 'Habit record is unavailable.' }, { status: 409 });
  const saved = z.object({ status: z.literal('saved'), changed: z.boolean(), observation: z.unknown() }).safeParse(data);
  if (!saved.success) return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
  try {
    const observation = parseSupportObservation(saved.data.observation);
    if (observation.log_id !== command.data.logId || observation.support_level !== command.data.level) {
      return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
    }
    return NextResponse.json({ changed: saved.data.changed, observation });
  } catch {
    return NextResponse.json({ error: 'Support level could not be saved.' }, { status: 503 });
  }
}
```

`src/lib/store/habit-programs-client.ts`:

```ts
import { z } from 'zod';
import { parseCuePlans, parseSupportObservations } from '@/lib/experience-state';
import type { CuePlan, SupportObservation } from '@/lib/experience-state';

type Requester = (url: string, init?: RequestInit) => Promise<Response>;

export type ChildHabitPrograms = {
  readonly supportObservations: SupportObservation[];
  readonly cuePlans: CuePlan[];
};

/** Loads what a paired child device may see; null means "leave the current state alone". */
export async function loadChildHabitPrograms(request: Requester = fetch): Promise<ChildHabitPrograms | null> {
  const response = await request('/api/child/habit-programs', { cache: 'no-store' });
  if (!response.ok) return null;
  const parsed = z.object({ supportObservations: z.unknown(), cuePlans: z.unknown() }).safeParse(await response.json());
  if (!parsed.success) return null;
  try {
    return {
      supportObservations: parseSupportObservations(parsed.data.supportObservations),
      cuePlans: parseCuePlans(parsed.data.cuePlans),
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/api/child-habit-programs.test.ts tests/unit/habit-programs-client.test.ts`
Expected: PASS (8 tests: 6 for the route and 2 for the client).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/child/habit-programs/route.ts src/lib/store/habit-programs-client.ts tests/api/child-habit-programs.test.ts tests/unit/habit-programs-client.test.ts
git commit -m "feat(habits): let a paired child record how a habit was done" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Verification and pull request

**Files:** none new.

- [ ] **Step 1: Run every check**

```bash
rm -rf .next/dev/types && npx tsc --noEmit
npx eslint src/app/api/child/habit-programs src/app/api/domain/experience src/lib/experience-state.ts src/lib/store/habit-programs-client.ts tests/api tests/unit/experience-state.test.ts tests/unit/habit-programs-client.test.ts tests/integration/migrations/habit-programs.test.ts
npx vitest run
npx vitest run tests/integration
```

Expected: TypeScript and ESLint report no problems; the unit run passes (707 tests at the time of writing, plus whatever landed since); the integration run passes (68 tests).

- [ ] **Step 2: Open the pull request**

```bash
git push -u origin HEAD
```

Open a pull request against `main` titled `feat(habits): add stored data and commands for adaptive habit programs`. In the body (Vietnamese, ending with the `Generated with Claude Code` line) list the two tables and four functions, that reads and writes go through checked commands and the paired child cannot save plans, that **the migration is not applied by CI or by this change**, and give the owner the steps: apply `202609300001_habit_programs.sql` in Supabase, then run `202609300001_habit_programs.verify.sql` and confirm it raises no exception. Do not merge without the project owner's approval.
