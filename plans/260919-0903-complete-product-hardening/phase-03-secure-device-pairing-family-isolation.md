---
phase: 3
title: "Secure Device Pairing and Family Isolation"
status: implemented-live-verification-pending
priority: P1
effort: "4-6d"
dependencies: [2]
---

# Phase 3: Secure Device Pairing and Family Isolation

## Overview

Replace bearer snapshots and four-character codes with an expiring, revocable child-device authorization flow; guarantee atomic isolation when identity/family/device changes.

## Requirements

- At least 128 bits of Web Crypto randomness; hashed token at rest; short display code may only identify a server-side challenge.
- TTL, attempt budget, rate limit, one-time exchange, parent-authenticated create/revoke and audit trail.
- Child session grants access to exactly one child and approved operations; never parent PIN or sibling/private parent data.
- Family switch/logout/disconnect atomically clears all family-scoped state, local storage, subscriptions and caches.

## Architecture

Parent creates challenge -> child submits display code -> server validates rate/TTL/ownership -> challenge consumed -> scoped device session issued -> child APIs enforce `family_id + child_id + capability`. No data snapshot lives in pairing table.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Replace | `src/app/api/family/code/route.ts` with scoped pairing routes/service | Brute-force, expiry, replay, revoke tests |
| Modify | `src/lib/store.tsx`, `src/components/DeviceConnectModal.tsx`, `src/components/ParentDashboard.tsx`, `src/components/ParentSettingsTab.tsx`, `src/components/Header.tsx` | Switch/isolation E2E |
| Create | `src/lib/pairing/**`, `src/lib/devices/device-management-client.ts`, `src/components/ChildDevicesPanel.tsx`, `tests/integration/pairing/**`, `tests/unit/device-management-client.test.ts`, `tests/e2e/family-isolation.spec.ts` | Security contract |

## Interface Checklist

- `POST pairing/challenges`, `POST pairing/exchange`, `DELETE devices/:id`.
- Child session contains opaque credential only; no PIN/profile collection.
- One `resetFamilyScope()` contract owns all teardown callers.

## Implementation Steps

1. Write exploit regression tests for parent-PIN disclosure, brute force, replay and cross-family contamination.
2. Add pairing challenge/device-session schema and server service.
3. Replace code generation/verify response and remove snapshots/PIN from transport and storage.
4. Implement scoped child API authorization and device management/revocation UI.
5. Centralize atomic family teardown/hydration; remove conditional “only replace if non-empty” state logic.
6. Add user-safe expired/revoked/offline/retry experiences.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | Guess/replay/expired/revoked code | Denied and rate-limited |
| Critical | Paired child requests parent/sibling data | Denied |
| Critical | Switch Family A -> B | Zero A data in B UI/storage/network |
| High | Restart/region change | Durable challenge/session behavior |
| Medium | Invalid code UX | Clear recovery without data leakage |
| Medium | Demo or signed-out parent opens pairing | Account requirement is explicit; generate/copy/QR/regenerate controls are natively disabled and never report false success |

## Todo

- [x] Secure pairing service and migration
- [x] Child-scoped session enforcement
- [x] Atomic family reset/hydration
- [x] Device revoke/audit UI
- [x] Adversarial contract and revoked-session E2E tests
- [x] Typed client adapter with Zod response validation and truthful signed-out/demo controls
- [x] Device-list/revoke boundary validates server responses, reports failures truthfully and remounts per authenticated parent to prevent stale account state

## Success Criteria

No response or storage record contains parent PIN; all attack tests pass; family-switch isolation test scans UI, store, localStorage and requests successfully.

## Risk Assessment

Existing codes become invalid. Provide explicit migration notice and regenerate codes after parent authentication. Do not support insecure legacy verification.

## Dependency Map

Depends on Phase 2. Can run parallel with Phase 4. Blocks Phases 5, 6 and 9.
