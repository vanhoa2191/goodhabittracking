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
- [x] Parent reminders are explicit opt-in, actionable only, revocable, localized, and disabled by default.

## Implementation Steps

1. Implement city/journal domain contracts and parent notification consent/device tests.
2. Run feature-flagged experiment with pre-registered metrics and guardrail stop rules.

## Todo

- [x] No push is sent without explicit device permission and parent consent. This release provides in-app reminders and only records browser readiness after an explicit permission action; it does not send push notifications.
- [ ] Experiment reports sample, exposure, North Star, and guardrails.

The strict `safe-vs-evolve-v1` reporter and CLI now compute those four fields from an anonymized export, reject personal or duplicate records, and stop Evolve above the 480-second average-session guardrail. The experiment itself has not started: analytics destination validation, a stable salted pseudonym, retention/regional-processing decisions, baseline, power, and approved sample size remain required before collecting real exposure.

## Success Criteria

Pause or reduce engagement loops if session duration exceeds the eight-minute guardrail.

## Current release gate

Dream City and parent reminders are disabled by default. Do not enable either production flag until the relevant database migration, backup, family isolation, and authenticated parent/paired-child flows pass live preflight. The controlled experiment remains open work.
