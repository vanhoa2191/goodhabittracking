---
phase: 4
title: "Quest loop and durable rewards"
status: pending
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

## Todo

- [ ] Early/expired quest attempts fail calmly.
- [ ] Three children complete three quests without instruction.

## Success Criteria

All gesture interactions retain a keyboard and touch-safe path.
