---
phase: 6
title: "Onboarding, Demo Separation, Trust, and Child Privacy"
status: in-progress
priority: P1
effort: "4-6d"
dependencies: [3, 5]
---

# Phase 6: Onboarding, Demo Separation, Trust, and Child Privacy

## Overview

Turn first use into an intentional family setup and make privacy, consent, demo boundaries, data lifecycle and marketing proof explicit.

## Requirements

- Separate “Explore demo” from “Set up my family”; demo namespace cannot call production mutations.
- Guided activation: account/local-only choice, consent, parent profile, first child, 1-3 habits, schedule, first completion and approval.
- Leaderboard is private by default and requires parent opt-in; provide revoke/report/block controls before social launch.
- Data export, account/family deletion, retention and recovery behavior are documented and implemented.
- Every statistic, testimonial and educational claim has evidence or qualified copy.

## Architecture

Onboarding state machine persists safely and resumes. Consent/version records belong to family membership. Demo uses static fixtures in an explicit sandbox provider and resets independently.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Modify | `src/app/page.tsx`, `LandingPage.tsx`, `OnboardingModal.tsx`, `Header.tsx` | First-run/demo E2E |
| Modify | `ParentDashboard.tsx`, `LeaderboardSection.tsx`, `store.tsx` | Privacy/delete/export tests |
| Create | `src/lib/onboarding/**`, `src/lib/demo/**`, `docs/claims-ledger.md`, privacy/data lifecycle docs | Trust contract |

## Interface Checklist

- Entry states: landing, demo, setup incomplete, family active.
- Consent/privacy version, leaderboard opt-in, data export/delete commands.
- Claims ledger links user-visible claim to owner/source/status.

## Implementation Steps

1. Build explicit demo sandbox and purge seeded real-mode profiles/groups/peers.
2. Implement resumable onboarding and guided first success.
3. Add privacy defaults and consent/data lifecycle records appropriate to intended markets.
4. Add verified export, delete, revoke, recovery and support flows.
5. Create claims ledger; remove or qualify unsupported “2,000+”, testimonials and outcome promises.
6. Add trust copy that matches actual local/cloud behavior.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | Demo interaction | Never reaches production data/payment/social services |
| Critical | New family setup | First real habit outcome without demo contamination |
| High | Delete/export/revoke | Complete, confirmed, recoverable where promised |
| High | Leaderboard default | Private until explicit parent opt-in |
| Medium | Interrupted onboarding | Resumes safely at correct step |

## Todo

- [x] Demo sandbox and real-mode empty state
- [x] Resumable onboarding
- [x] Privacy/consent/data lifecycle
- [x] Claims ledger and copy remediation
- [x] Local-only activation and deletion E2E
- [ ] Credentialed cloud activation and deletion E2E

## Success Criteria

First-time real user reaches first approved habit without encountering fake data; demo cannot affect real state; privacy controls and lifecycle flows pass E2E; no unsupported claim remains.

## Risk Assessment

Legal requirements depend on launch markets. Observable signal: markets remain undecided before privacy implementation. Response: implement conservative defaults and block public child-social features pending legal review.

## Dependency Map

Depends on Phases 3 and 5. Blocks Phase 7 and final release.
