---
phase: 2
title: "Analytics foundation"
status: in_progress
priority: P1
effort: "3-5 days"
dependencies: [1]
---

# Phase 2: Analytics foundation

## Overview

Measure child outcomes without recording child content; PostHog remains a no-op until configured.

## Requirements

- [x] Define typed events for session start, task tick, mascot selection/read, secret quest, wishlist, and approval lag.
- [x] Exclude names, free text, pairing/payment values, and full identifiers.

## Implementation Steps

1. Create one tested `track()` boundary and safe client/server initialization.
2. Instrument existing task/approval flow, then new loop events as phases ship.
3. Document dashboard formulas for DAU/MAU, D7, tasks/session, session duration, completion rate, and NPS.

## Todo

- [ ] Demo and authenticated flows emit valid payloads.
- [x] Missing configuration creates no network call or error.

The event boundary and session/task/review instrumentation are implemented. Existing mascot selection, morning letter, and wishlist flows now have post-save hooks; the evening secret quest still needs its UI and event. The store has an opt-in gate that defaults off, but a durable parental consent flow, configured destination, and non-production event verification remain open. The daily-letter and wishlist commands need additive migrations `202609240006` and `202609240007` for atomic first-read and changed-choice results; both migrations and their verifiers remain unapplied pending the production backup decision. Dashboard definitions and measurement prerequisites are documented in [`docs/product-analytics.md`](../../docs/product-analytics.md).

## Success Criteria

Events are visible in non-production before production configuration is enabled.
