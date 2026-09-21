---
title: "KidHabit Hero Complete Product Hardening"
description: "Convert the current prototype into a secure, reliable, accessible, production-grade family habit application and close every audit finding."
status: production-candidate
priority: P1
effort: "40-61 engineering days"
issue: null
branch: main
tags: [refactor, frontend, backend, database, api, auth, critical, tech-debt]
blockedBy: []
blocks: []
created: 2026-09-19
---

# KidHabit Hero Complete Product Hardening

## Overview

Deliver the full audit remediation scope: security, payments, family isolation, authoritative multi-device data, onboarding, UX, localization, accessibility, performance, observability, documentation, and release certification. Preserve the WIT product concept and recognizable visual language while replacing unsafe prototype contracts.

## Scope Contract

- **Outcome:** trustworthy production SaaS where parent and child flows work across devices, paid access cannot be forged, family data cannot cross boundaries, and public claims match behavior.
- **Constraints:** Cloudflare-compatible Next.js 16, Supabase, PayOS, existing nine locales, current WIT content. No fake production data or client-authoritative security decisions.
- **Non-goals:** native mobile apps, a visual rebrand, new social features, or additional monetization products beyond audited functionality.
- **Quality bar:** WCAG 2.2 AA evidence, negative authorization tests, transactional core flows, complete CI gates, observable production failures.
- **Interpretation:** “top 1%” is a quality direction, not a guaranteed market ranking; completion means measurable gates below pass.

## Audit Baseline

- Source: [Audit baseline](./reports/audit-baseline.md)
- Reviewed commit: `a992f55dd76b9be12e1f8bdd97cbb0c62f45b1d8`
- Current gates: build passes; lint fails with 20 errors/77 warnings; no automated tests; npm production audit reports zero known vulnerabilities.
- Release posture: block public production launch until Phases 1-5 are complete and independently verified.

## Architecture Decisions

1. **Server-authoritative state:** authentication, family membership, points, streaks, approvals, redemptions, pairing, payments, and entitlements are mutated through authenticated server contracts.
2. **Strict tenancy:** every private row belongs to a family and is reachable only through authenticated membership or a narrowly scoped child-device capability.
3. **Demo isolation:** demo data uses a separate in-memory/local namespace and can never sync, pay, join a real leaderboard, or contaminate real-family state.
4. **Migration-first database changes:** versioned Supabase migrations replace ad-hoc `schema.sql` edits; rollback and legacy-data handling accompany each migration.
5. **Tests before refactor:** capture current intended behavior, then change contracts; every P0 receives negative/adversarial tests.
6. **Modular monolith:** retain one Next.js application; split oversized store/components by domain without introducing microservices.

## Dependency Graph

```text
Phase 1 Baseline gates
  -> Phase 2 Identity, tenancy, RLS, canonical data
       -> Phase 3 Pairing and family isolation ----\
       -> Phase 4 Payments and entitlements --------+-> Phase 9 Release certification
       -> Phase 5 Authoritative sync/core domain --+-> Phase 6 Onboarding/trust/privacy
                                                    -> Phase 7 UX/i18n/a11y
                                                    -> Phase 8 Performance/operations
                                                    -> Phase 9 Release certification
```

Phases 3 and 4 may run in parallel after Phase 2. Phase 5 may begin after Phase 2 but cannot close until Phase 3 child-device contracts are stable.

## Phases

| # | Phase | Priority | Effort | Depends on | Status |
|---|---|---:|---:|---|---|
| 1 | [Baseline, kill switches, and test harness](./phase-01-start.md) | P1 | 3-5d | - | Complete locally |
| 2 | [Identity, tenancy, RLS, and canonical data model](./phase-02-identity-rls-data-model.md) | P1 | 5-8d | 1 | Complete; production migration, forced-RLS checks and automated anonymous/same-family/cross-family matrix pass with clean synthetic-data teardown |
| 3 | [Secure device pairing and family isolation](./phase-03-secure-device-pairing-family-isolation.md) | P1 | 4-6d | 2 | Implemented; live E2E pending |
| 4 | [Payment and entitlement integrity](./phase-04-payments-entitlements.md) | P1 | 3-5d | 2 | Production credentials rotated into encrypted Worker secrets; signed PayOS webhook probe accepted; invalid-signature ingress returns 401; credentialed purchase/replay/mismatch E2E pending |
| 5 | [Authoritative sync and core habit domain](./phase-05-authoritative-sync-core-domain.md) | P1 | 7-10d | 2, 3 | Locally complete; cloud mutations are authenticated, family-scoped and API-first with authoritative refetch/error recovery; cloud/local/pairing lifecycles and tested store/domain boundaries are extracted into focused modules; reward delivery fixed; live two-device E2E pending |
| 6 | [Onboarding, demo separation, trust, and child privacy](./phase-06-onboarding-demo-trust-privacy.md) | P1 | 4-6d | 3, 5 | Local lifecycle E2E complete; credentialed lifecycle pending |
| 7 | [UX, information architecture, localization, and accessibility](./phase-07-ux-ia-localization-accessibility.md) | P2 | 7-10d | 5, 6 | Locally complete; A11y/responsive gates and all nine-locale surfaces pass, store is a 772-line composition provider, and the portrait guide is a 189-line coordinator backed by three focused panels; final production visual certification remains part of Phase 9 |
| 8 | [Performance, observability, and operations](./phase-08-performance-observability-operations.md) | P2 | 4-6d | 5, 7 | Local gates, telemetry, fail-closed readiness, one-command release verification and JSON restore drill complete; production alerts/database restore pending |
| 9 | [Release certification and documentation](./phase-09-release-certification-documentation.md) | P1 | 3-5d | 3-8 | Production candidate deployed; Supabase rollout and live RLS matrix, PayOS rotation/webhook and Cloudflare Worker smoke complete; immutable commit/CI, full two-device lifecycle and alert/restore evidence pending |

## Global Acceptance Criteria

- [x] Anonymous and cross-family reads/writes fail in automated RLS tests.
- [ ] Pairing tokens are high entropy, expiring, one-time/revocable, rate-limited, and never reveal parent PIN or unrelated family data.
- [ ] Unsigned, invalid, replayed, mismatched, or client-simulated payments cannot grant entitlement.
- [ ] Two-device E2E passes: child completion -> parent approval -> points -> redemption -> parent delivery -> reconnect.
- [ ] Account/family switch leaves zero prior-family records in memory, storage, UI, requests, or cache.
- [ ] Demo mode is visibly labeled and technically isolated from production services.
- [ ] All nine locales pass key parity and core-flow E2E; no mixed-language strings in scoped flows; document language is correct.
- [ ] WCAG 2.2 AA audit passes for keyboard, focus, labels, contrast, zoom/reflow, reduced motion, errors, and live state changes.
- [ ] CI passes lint, typecheck, unit, integration, RLS, API, E2E, accessibility, build, dependency and secret checks.
- [ ] Production dashboards alert on auth, sync, payment and webhook failures; rollback/runbooks are tested.
- [ ] README, architecture, privacy/data lifecycle, deployment, migration, backup, recovery, and incident docs match verified behavior.

## Release Gates

| Gate | Required before |
|---|---|
| G0: kill unsafe production paths + baseline tests | Any public testing |
| G1: strict RLS, tenancy, pairing, payment integrity | Any real family/payment data |
| G2: authoritative multi-device core loop | Beta |
| G3: onboarding, privacy, UX, i18n, accessibility | Release candidate |
| G4: performance, observability, docs, recovery | General availability |

## Risks and Rollback

- **Live schema drift:** inspect deployed Supabase schema before migration. If it differs, stop and create a reconciliation migration; never run destructive reset.
- **Legacy local data:** version backup format; dry-run migration; preserve export; rollback by restoring previous app version and compatibility reader, not by dropping new tables.
- **Cloudflare runtime constraints:** verify Web Crypto, request context and secret access in preview before production.
- **Behavioral regressions:** retain feature flags for new sync/pairing/payment paths until E2E and telemetry are green.
- **Scope pressure:** do not trade P0 integrity for cosmetic work. Phase 7 cannot close while any P0 gate remains open.

## Unresolved Questions

None required to create the plan. Before Phase 2 implementation, confirm access to the live Supabase project, PayOS sandbox/production credentials, Cloudflare preview environment, and the intended legal markets for child-privacy review.

## Validation Log

- Full verification tier required: 9 phases.
- Audit file/path claims checked against current source before plan creation.
- Local release evidence: [release-evidence.md](./reports/release-evidence.md).
- Production candidate is live on Cloudflare with migrated Supabase, a passing live family-boundary matrix and rotated PayOS credentials; immutable commit/CI, full two-device lifecycle, alert delivery, restore evidence and launch-market legal review remain.

<!-- slug: complete-product-hardening -->
