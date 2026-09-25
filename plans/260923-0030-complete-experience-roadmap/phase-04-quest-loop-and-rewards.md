---
phase: 4
title: "Quest loop and durable rewards"
status: in_progress
priority: P1
effort: "8-10 days"
dependencies: [1, 2, 3]
---

# Phase 4: Quest loop and durable rewards

## Overview

Turn daily tasks into accessible quests with a bounded evening surprise, persistent wish, and honest streak.

## Requirements

- [ ] Implement swipe right complete / left defer with tap and keyboard alternatives and authoritative rollback.
- [ ] Add persistent wishlist, three-state fire, and server-validated 18:00-21:00 secret quest.

## Implementation Steps

1. Define idempotent quest/defer transitions before gesture UI.
2. Reuse verified completion feedback; test time zone, expiry, reduced motion, and failed saves.
3. Derive the fire display from distinct verified log dates. Pending approval remains visible but never counts as a verified day; undo and rejected work must not preserve a false streak.
4. Persist wishlist choices in local-family state and through a family- and child-session-scoped cloud command. Validate that the reward still belongs to the family and is active before saving.
5. Keep the evening secret quest behind its feature flag until the family has an explicit IANA time zone and the server owns both the [18:00, 21:00) window and one-time completion rule. The quest reward rule needs a product decision before implementation.

## Todo

- [x] Show a three-state fire from verified daily logs, with pending approval separate and undo reflected immediately; unit and desktop/mobile browser checks cover active, resting, and cold states.
- [x] Save a child's reward goal locally and in the cloud for parents and paired child devices; reject inactive or cross-family rewards. Production migration `202609230005` is applied and invalid child sessions fail closed. A real paired-session write remains to verify with an authorized test child.
- [ ] Quest defer/complete is implemented with tap, keyboard, and touch paths. Local demo and paired-response browser scenarios pass; migration `202609250001` and its read-only verifier are prepared but not applied to production. Real PostgreSQL family-isolation and concurrent transition checks remain release gates after a verified logical backup.
- [ ] Early/expired quest attempts fail calmly.
- [ ] Three children complete three quests without instruction.

## Success Criteria

All gesture interactions retain a keyboard and touch-safe path.
