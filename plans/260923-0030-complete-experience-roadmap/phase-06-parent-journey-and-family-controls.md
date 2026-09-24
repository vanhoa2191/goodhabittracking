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

- [ ] Vertical map shows current child position, next week, progress, and four seasonal contexts.
- [ ] Family pause safely suspends streak/quest pressure without deleting activities or rewards.

The reversible family pause is implemented for local, demo, signed-in parent, and paired-child screens. The child session reads pause state and history through a token-scoped database function. The child view hides streak, leaderboard, and daily-progress prompts while paused; activities and rewards remain available. Completed pause intervals are neutral when calculating the child's habit fire after resuming. Production migrations `202609240003` and `202609240004` are applied; a parent-role pause/resume/idempotency check passed inside a rolled-back production transaction. The sequential journey map and durable assignment identity are still open, so this phase is not complete.

## Implementation Steps

1. Model applied journey progress from authoritative logs and assignments.
2. Build responsive timeline, accessible week details, pause/resume confirmation, and localization.

## Todo

- [ ] Parent can identify current and next stage at a glance.
- [ ] Pause survives refresh and prevents prompt/penalty behavior.

## Success Criteria

No journey application can create duplicate activity assignments.
