---
phase: 1
title: "Baseline, Kill Switches, and Test Harness"
status: complete
priority: P1
effort: "3-5d"
dependencies: []
---

# Phase 1: Baseline, Kill Switches, and Test Harness

## Context Links

- [Plan](./plan.md)
- [Audit baseline](./reports/audit-baseline.md)
- Current scripts: `package.json`

## Overview

Create a safe implementation floor: disable exploitable production paths, establish deterministic tests, and make existing quality failures visible and enforceable.

## Requirements

- Add unit/integration/API/E2E/accessibility test infrastructure and deterministic seed/clock utilities.
- Add server-only feature flags that default unsafe payment simulation, public pairing snapshots, and fabricated global rankings off outside local demo/test.
- Fix all current lint errors and warnings without weakening rules.
- Capture intended baseline flows before refactoring.

## Architecture

Tests use isolated Supabase fixtures or local test doubles only at external boundaries. Browser tests run against a dedicated test namespace. No production credential or live customer data enters test artifacts.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Modify | `package.json`, `eslint.config.mjs`, `src/app/api/payment/status/route.ts`, `src/components/CheckoutModal.tsx`, `src/lib/store.tsx` | Establish gates; remove public simulation path |
| Create | `vitest.config.ts`, `playwright.config.ts`, `tests/unit/**`, `tests/integration/**`, `tests/e2e/**`, `.github/workflows/ci.yml` | New baseline coverage |
| Modify | Current lint-error files from audit | Must preserve behavior |

## Interface Checklist

- API: payment status cannot accept simulation in production.
- Store: baseline fixtures expose resettable family-scoped state.
- Commands: `test:unit`, `test:integration`, `test:e2e`, `test:a11y`, `typecheck`, `ci`.

## Implementation Steps

1. Add test runners, fixtures, deterministic clock/timezone and isolated env validation.
2. Write characterization tests for demo entry, completion/undo, approval, redemption, pairing error and locale switch.
3. Introduce server-only environment schema and safe defaults; remove/hide production simulation and mock-global behavior.
4. Resolve lint findings, especially `syncNow` ordering, effect-state patterns and unsafe boundary types.
5. Add CI workflow with secret redaction and artifact retention for failed browser tests.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | Production calls `simulateSuccess` | Rejected; no entitlement mutation |
| Critical | Test reset/switch family | No previous family state |
| High | Existing demo core flow | Behavior captured and deterministic |
| Medium | Nine locale providers mount | No runtime error |

## Todo

- [x] Test stack and scripts committed
- [x] Characterization tests green
- [x] Unsafe paths default off
- [x] Lint/type/build/CI green

## Success Criteria

- Zero lint errors/warnings; build and all baseline suites pass.
- Production build contains no user-visible payment simulation or fabricated production leaderboard data.
- CI can run without live Supabase or PayOS credentials.

## Risk Assessment

Characterization may encode broken behavior. Mark tests as “preserve” versus “replace”; P0 findings must be asserted as failures, not normalized. Roll back only test/config changes if tooling destabilizes builds; keep kill switches.

## Dependency Map

Blocks every later phase. No phase may bypass its CI gates.
