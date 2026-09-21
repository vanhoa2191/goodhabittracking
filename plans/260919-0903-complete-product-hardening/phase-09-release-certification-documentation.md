---
phase: 9
title: "Release Certification and Documentation"
status: production-certification-in-progress
priority: P1
effort: "3-5d"
dependencies: [3, 4, 5, 6, 7, 8]
---

# Phase 9: Release Certification and Documentation

## Overview

Run the complete release matrix, reconcile product promises with verified behavior, publish maintainable documentation and execute a staged production rollout with rollback readiness.

## Requirements

- Every global acceptance criterion has current evidence tied to the release commit.
- README and docs cover setup, architecture, migrations, OAuth, PayOS, Cloudflare, local/cloud semantics, privacy, recovery and operations.
- Security/privacy/accessibility/performance reviews have no open critical/high blockers.
- Staged rollout includes smoke tests, telemetry watch, rollback trigger and post-release review.

## Architecture

Documentation points to machine-owned migrations, schemas, scripts and tests instead of duplicating mutable details. Release evidence is commit-bound and stored under the plan reports directory.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Replace | `README.md` | Setup smoke test follows documented steps |
| Create | `docs/architecture.md`, `docs/security-privacy.md`, `docs/deployment.md`, `docs/data-recovery.md`, `docs/decisions/**` | Documentation link/claim checks |
| Create | `plans/.../reports/release-evidence.md` | Commit-bound certification matrix |
| Modify | CI/deployment configuration | Staged release gates |

## Interface Checklist

- Operator commands, env names, migrations and rollback steps are exact and redacted.
- Public privacy/terms/support links are reachable from product surfaces.
- Release evidence records commit SHA, environment, test result and owner.

## Implementation Steps

1. Run full unit/integration/RLS/API/E2E/a11y/performance/security/build matrix on release candidate.
2. Execute manual parent/child flows on mobile and desktop, including two devices, offline/reconnect and account switch.
3. Complete threat model, privacy review, accessibility review and claims reconciliation.
4. Write/verify documentation by following it from a clean checkout and preview environment.
5. Stage rollout, run smoke checks, observe telemetry, verify backup, then promote or roll back by predefined thresholds.
6. Record release evidence and remaining non-blocking backlog.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | Full adversarial security/payment/pairing matrix | Zero critical/high finding |
| Critical | Two-device family journey | Pass end-to-end on release SHA |
| High | Clean setup from README | Build/deploy succeeds without tribal knowledge |
| High | Rollback drill | Service/data recover within documented target |
| Medium | Nine locales and supported viewports | Certified matrix attached |

## Todo

- [ ] Full automated/manual certification
- [x] Security/privacy/a11y/performance sign-offs
- [x] Evergreen docs and verified README
- [ ] Staged rollout and rollback drill
- [x] Commit-bound release evidence (clean-worktree harness and GitHub CI passed on `73814211ef63a80bcce11ba005329ec6ce192e68`)

## Success Criteria

All global criteria pass on one immutable commit; no P0/P1 blocker remains; documentation setup is reproducible; staged deployment and rollback evidence are recorded.

## Risk Assessment

“Top 1%” cannot be proven by internal QA alone. Release only after technical gates pass, then measure activation, retention, task completion, sync reliability and support burden against explicit targets; iterate from real consented data.

## Dependency Map

Final phase. Depends on Phases 3-8 and all unresolved P0/P1 findings being closed.
