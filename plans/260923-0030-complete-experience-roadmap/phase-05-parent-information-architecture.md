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

The three-area navigation, collection split, child filter, recent completion counts, and added/pending feedback are implemented. Browser tests cover 375px keyboard use across all nine supported languages and English collection content. Canonical framework habits keep persisted source IDs. Legacy template IDs are currently derived from catalog position, while assignment matching relies on localized titles; persist their source IDs before closing this requirement. The five-second pairing-discovery criterion still needs participant observation.

## Success Criteria

Library and current assignments are visually and semantically separate.
