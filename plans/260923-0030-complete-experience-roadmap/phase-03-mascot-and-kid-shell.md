---
phase: 3
title: "Mascot and Kid shell"
status: pending
priority: P1
effort: "5-7 days"
dependencies: [1, 2]
---

# Phase 3: Mascot and Kid shell

## Overview

Finish named mascot selection, per-mascot Kid hero, visible sound control, and daily letter.

## Requirements

- [ ] Create a six-card accessible selector with seven-day change limit and persisted timestamp.
- [ ] Add local-day letter/read state; keep sound visible at every Kid breakpoint with night/reduced-motion rules.

## Implementation Steps

1. Define mascot/expression/season asset manifest and QC master assets before variants.
2. Persist selection, apply hero palette only, and test child/parent shells plus letter read behavior.

## Todo

- [ ] Six masters pass visual QC.
- [ ] Letter appears at most once per local day and stays readable.

## Success Criteria

Ship masters first; unreviewed variants never block the loop.
