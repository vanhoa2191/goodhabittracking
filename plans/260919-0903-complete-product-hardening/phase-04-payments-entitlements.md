---
phase: 4
title: "Payment and Entitlement Integrity"
status: production-webhook-verified
priority: P1
effort: "3-5d"
dependencies: [2]
---

# Phase 4: Payment and Entitlement Integrity

## Overview

Make PayOS orders, webhooks and subscriptions server-authoritative, authenticated, signed, idempotent and environment-separated.

## Requirements

- No client or public test parameter can grant entitlement.
- Order creation derives user/family, price, plan, return/cancel origins server-side.
- Webhook requires configured secret and valid signature; validates amount, order, plan, status and provider reference.
- Entitlement is read from server state; free/pro limits are enforced in API and UI.
- Simulation exists only in automated tests or an isolated PayOS sandbox build.

## Architecture

Authenticated create order -> persisted expected amount/plan/user -> PayOS -> verified idempotent webhook transaction -> subscription state -> client refreshes entitlement. Status endpoint is ownership-scoped and read-only.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Modify | `src/app/api/payment/{create,status,webhook}/route.ts`, `src/lib/payos.ts`, `src/lib/store.tsx` | Signed/unsigned/replay/mismatch matrix |
| Modify | `src/components/{PricingModal,CheckoutModal}.tsx` | Checkout and recovery E2E |
| Create | `src/lib/billing/**`, `tests/integration/payments/**`, `tests/e2e/checkout.spec.ts` | Server entitlement contract |

## Interface Checklist

- Order DTO excludes caller-supplied amount/user authority.
- Webhook event has unique provider reference/idempotency key.
- Entitlement API returns effective plan, expiry and feature limits.

## Implementation Steps

1. Write regression tests proving simulation and unsigned webhook exploits.
2. Add strict request/event schemas and authenticated order ownership.
3. Require signature/configuration; process webhook in idempotent DB transaction.
4. Remove client `upgradePlan` authority and demo VietQR fallback from production.
5. Enforce plan limits server-side and mirror disabled states in UI.
6. Add pending, paid, cancelled, expired, retry and support states without leaking provider payloads.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | `simulateSuccess`, unsigned/invalid webhook | Rejected; no state change |
| Critical | Replay valid webhook | One transition only |
| Critical | Amount/plan/user mismatch | Rejected and alerted |
| High | Paid then expired/cancelled | Entitlement changes correctly |
| High | Network return before webhook | Pending UX recovers safely |

## Todo

- [x] Server billing service and schemas
- [x] Strict webhook/idempotency
- [x] Server entitlement enforcement
- [x] Checkout recovery UI
- [x] Payment security tests

Runtime and release preflight denylist SHA-256 fingerprints of the PayOS credentials exposed during development without storing their original values. A replacement production channel is configured through encrypted Worker secrets, its signed validation probe is accepted, and schema-valid invalid signatures are rejected at the live ingress.

The checkout transport now parses create/status responses through typed Zod boundaries. Status-read failures render as errors instead of being reported as pending. `CheckoutModal` is split from its QR/details surface and reduced from 368 to 248 lines; the extracted details component is 138 lines.

## Success Criteria

Only a verified provider event can activate a plan; all negative payment tests pass; every Pro gate uses one effective entitlement contract.

## Risk Assessment

Provider sandbox semantics may differ from production. Verify official PayOS event/signature contract before implementation; if unresolved, block production payments rather than fail open.

## Dependency Map

Depends on Phase 2. Parallel with Phase 3. Required for Phase 9 release.
