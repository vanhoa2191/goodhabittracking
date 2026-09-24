---
phase: 6
title: "Journey map and family controls"
status: in_progress
priority: P1
effort: "6-8 days"
dependencies: [3, 5]
---

# Phase 6: Journey map and family controls

## Overview

Replace the journey grid with a sequential map and give parents a clear, reversible pause control.

## Requirements

- [x] Vertical map shows current child position, next week, progress, and four monthly contexts.
- [x] Family pause safely suspends streak/quest pressure without deleting activities or rewards.

The reversible family pause is implemented for local, demo, signed-in parent, and paired-child screens. The child session reads pause state and history through a token-scoped database function. The child view hides streak, leaderboard, and daily-progress prompts while paused; activities and rewards remain available. Completed pause intervals are neutral when calculating the child's habit fire after resuming. Production migrations `202609240003` and `202609240004` are applied; a parent-role pause/resume/idempotency check passed inside a rolled-back production transaction.

The parent journey map, child-specific progress, localized stages, and missing-only application are implemented locally. Migration `202609240005` adds durable journey-habit identity, database uniqueness, and a guard against overlapping family-wide/child-specific assignments but is not yet applied to production. After applying it, run `supabase/preflight/202609240005_journey_habit_identity.verify.sql` and the rollback-only behavioral check `supabase/preflight/202609240005_journey_habit_identity.behavior.sql`. Supabase Free has no managed backup, so release waits on an operator backup or explicit confirmation that the current production data is disposable. Do not deploy the Worker with this column dependency before the migration.

## Implementation Steps

1. Model applied journey progress from authoritative logs and assignments.
2. Build responsive timeline, accessible week details, pause/resume confirmation, and localization.

## Todo

- [x] Parent can identify current and next stage at a glance.
- [x] Pause survives refresh and prevents prompt/penalty behavior.
- [ ] Apply migration, verify production reads/writes, and deploy the Worker.

## Success Criteria

No journey application can create duplicate activity assignments.
