---
phase: 5
title: "Parent information architecture"
status: in_progress
priority: P1
effort: "5-7 days"
dependencies: [1]
---

# Phase 5: Parent information architecture

## Overview

Reduce Parent navigation to Today, Design, and Family; separate library from assigned work.

## Requirements

- [x] Map every current action/badge to one of three accessible areas.
- [ ] Create distinct collection Library and In-use panels with stable IDs, filters, progress, and explicit added/pending states.

## Implementation Steps

1. Preserve tab semantics, deep links, keyboard use, and narrow-width reflow.
2. Test pairing discovery, assignment errors, nine locales, and 375px layout.

## Todo

- [ ] Participants find pairing in under five seconds.
- [x] No management feature is lost (all seven former sections remain reachable in browser tests).

## Current evidence and remaining gate

The three-area navigation, collection split, child filter, recent completion counts, and added/pending feedback are implemented. Browser tests cover 375px keyboard use across all nine supported languages and English collection content. Canonical framework habits keep persisted source IDs. All 36 legacy templates now have explicit catalog IDs, and new assignments persist them through the activity API, database, and paired-child session; old rows without an ID use full catalog-content and setting equivalence only as a compatibility path. A custom habit that merely shares a template title no longer marks that template as added.

A catalog-generated backfill for full legacy template content and settings across nine locales is prepared as migration `202609240008`; rows with different content or settings remain untouched. An independently created exact copy cannot be distinguished from a template by the historical data alone, so the migration must be reviewed against a backed-up production snapshot before application. It has local syntax and coverage tests, but is not applied to production until the required logical backup and migrations `005`-`007` are complete. Run its aggregate verifier before and after application, then review any unidentified rows without inferring IDs. The five-second pairing-discovery criterion still needs participant observation. The stable-ID requirement remains open until production backfill and verification are complete.

## Success Criteria

Library and current assignments are visually and semantically separate.
