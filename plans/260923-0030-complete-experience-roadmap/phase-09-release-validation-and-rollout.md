---
phase: 9
title: "Release validation and rollout"
status: pending
priority: P1
effort: "4-6 days"
dependencies: [1, 2, 3, 4, 5, 6, 7, 8]
---

# Phase 9: Release validation and rollout

## Overview

Validate the complete experience on real surfaces and release it progressively.

## Requirements

- [ ] Run focused/unit/API/migration, E2E, accessibility, visual, build, and production health gates.
- [ ] Validate real payment/pairing only with an approved controlled test account and no unintended purchase.

## Implementation Steps

1. Capture all named views at 375/768/1280 and review locale/CJK wrapping, focus, motion, and contrast.
2. Roll out flags by cohort, monitor health/event errors, and retain explicit rollback notes.

## Todo

- [ ] CI and Cloudflare build/deploy pass.
- [ ] Production health is ready and new error signals are absent.

## Success Criteria

Only promote after guarded metrics hold for four weeks; otherwise stop and replan.
