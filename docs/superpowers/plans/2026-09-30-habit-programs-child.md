# Habit Programs Child Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the cue on the child's task card, let a child from 15 years old say how they did a habit when they finish it, and give a plain-words acknowledgement once a habit is on its way to being maintained, all behind the existing `habitPrograms` flag.

**Spec:** `docs/superpowers/specs/2026-09-30-adaptive-habit-programs-design.md` (section 3, "Bé"). Builds on the parent interface (`src/components/HabitSupportPrompt.tsx`, `HabitProgressSummary.tsx`), the child route `src/app/api/child/habit-programs/route.ts` and the store's paired-child load (`loadChildHabitPrograms`).

## Global Constraints

- Everything is gated by `defaultExperienceFlags.habitPrograms`. With the flag off the child screen is unchanged.
- A child never sees a phase name, a comparison with another child, or a missed-habit count. Stars and rewards do not change.
- The support question is optional and never blocks completing a habit. Skipping it records nothing and changes no phase.
- The child question is shown only from 15 years old (`birthYear`/`age` on the profile; `ageStage` `12-18` alone is not enough). A child under 15 never sees it.
- The age rule is an interface default, not a server rule: `set_child_habit_support` stays unchanged. Parents are told about the age default with a short hint instead (Task 6), and a parent can always record or change the answer.
- Copy goes through `src/lib/i18n/habit-programs-copy.ts` in all nine languages. No promise of outcomes for children.
- Time-dependent tests pass under `TZ=UTC`, `TZ=Asia/Ho_Chi_Minh`, `TZ=America/Los_Angeles`.
- Conventional commits ending with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`; no plan or finding labels in code, tests or commits; stage files explicitly; never commit `plans/`.

## Decisions (owner, settled)

1. The age-15 rule is not enforced on the server. Parents get a hint instead.
2. The acknowledgement stays "Con đã làm việc này rất đều. Cứ giữ nhịp nhé." and joins four or more similar meaningful lines that rotate.

## Tasks

### Task 1 – Pure rules (`src/lib/habit-programs/child-view.ts`)
- [ ] Test first (`tests/unit/habit-programs/child-view.test.ts`): `childMaySelfReport({ age, birthYear }, today)` is true from 15 (uses `age` when present, else `birthYear`, false when both are missing); `cueLineFor(cuePlan, language)` returns the "after X, I do it" line or `null`; `showAcknowledgement(phase)` is true only for `maintain`.
- [ ] Implement the three functions; run the test and watch it fail first.

### Task 2 – Cue on the task card
- [ ] Test first (e2e `tests/e2e/habit-programs-child.spec.ts`): after a parent saves a cue, the child's task card shows the cue line; a habit without a cue shows nothing extra.
- [ ] Render the line in `KidDashboard.tsx` beside `data-task-card` content, gated by the flag; read plans from `experience.cuePlans` for `activeChild`.

### Task 3 – Self-report at completion (15+)
- [ ] Test first (e2e): a 15-year-old completes a habit, sees "alone / prompted / together" once, taps one and it is stored (`data-level`); skipping still completes the habit; a 10-year-old never sees the question.
- [ ] Reuse `recordHabitSupport` and the `LEVELS` labels; show the question in the celebration step, never before the completion is saved.

### Task 4 – Plain-words acknowledgement that rotates
- [ ] Test first: `pickAcknowledgement(childId, habitId, day, lines)` is stable for the same child, habit and day, changes across days, never picks the same line two days in a row for the same habit, and returns `null` unless the phase is `maintain`; no line contains a phase name, a number of days, or a comparison.
- [ ] Add at least five lines per language as `childAckMaintain1..5` (line 1 is the wording above), plus `childSelfReportTitle`, `childCueLine`; extend the copy tests (placeholders, no Vietnamese in other languages, lines distinct within a language).

### Task 5 – Parent hint about the age default
- [ ] Test first (e2e): the parent screen shows a one-line hint that children from 15 can record how they did a habit themselves and that the parent can still record or change it; it appears only when a cue plan exists.
- [ ] Add `parentSelfReportHint` in nine languages and render it under the support prompt intro and the empty progress state.

### Task 6 – Verify and review
- [ ] `tsc`, `eslint`, full `vitest` (three time zones for the new rules), full Playwright with axe on the new elements.
- [ ] Independent review by Codex (`gpt-6.1-sol`, read-only) of the branch; fix Important findings RED→GREEN in one pass.

## Review Focus

- A child under 15 with only `ageStage` `12-18` must not see the question (test: age 14, birthYear-only 14, missing age).
- Skipping the question must never block or delay completion, and a failed save must not undo the completion.
- The child screen must never contain a phase name or another child's data.

## Later (not in this plan)

The parent "start a program for [child]" three-step flow, the gentle nudge for missing data, and moving legacy journey habits into the new list are separate plans.
