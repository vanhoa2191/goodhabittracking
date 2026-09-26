---
phase: 8
title: "Long-term engagement and experiments"
status: in_progress
priority: P2
effort: "8-12 days plus four weeks observation"
dependencies: [2, 4, 6, 7]
---

# Phase 8: Long-term engagement and experiments

## Overview

Add Dream City, one-sentence journal, consented parent reminder, and controlled Safe-versus-Evolve experiment.

## Requirements

- [ ] City purchases use authoritative points and never reset progress. Implementation is feature-flagged locally; the database migration and live purchase flow still need release verification.
- [x] Journal is child-safe, reviewable by parent, exportable, and excluded from analytics.

## Implementation Steps

1. Implement city/journal domain contracts and parent notification consent/device tests.
2. Run feature-flagged experiment with pre-registered metrics and guardrail stop rules.

## Todo

- [ ] No push is sent without explicit device permission and parent consent.
- [ ] Experiment reports sample, exposure, North Star, and guardrails.

## Success Criteria

Pause or reduce engagement loops if session duration exceeds the eight-minute guardrail.

## Current release gate

Dream City is disabled by default. Do not enable it in production until the database migration, backup, family isolation, and authenticated parent/paired-child purchase flows pass live preflight. Parent reminders and the controlled experiment remain open work.
