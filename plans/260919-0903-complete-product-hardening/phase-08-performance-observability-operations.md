---
phase: 8
title: "Performance, Observability, and Operations"
status: in-progress
priority: P2
effort: "4-6d"
dependencies: [5, 7]
---

# Phase 8: Performance, Observability, and Operations

## Overview

Make quality measurable in production: performance budgets, structured redacted telemetry, health signals, alerts, backup/recovery and Cloudflare-compatible operational controls.

## Requirements

- Define and enforce mobile Core Web Vitals and bundle budgets.
- Capture redacted auth, pairing, sync, payment and webhook failures with correlation IDs and actionable alerts.
- Add error boundaries and user-safe retry/support references.
- Test backup, restore, migration rollback and incident response.
- No child PII, PIN, tokens, payment secrets or payloads in logs/analytics.

## Architecture

Thin telemetry adapter supports configured production provider without coupling domain code. Server events use structured allowlisted fields. Client analytics require consent and use pseudonymous identifiers.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Modify | `next.config.ts`, `src/app/layout.tsx`, large components and imports | Lighthouse/bundle regression |
| Create | `src/lib/observability/**`, error boundaries, health endpoints, performance config | Redaction/failure tests |
| Create | `docs/runbooks/**`, backup/restore scripts, CI performance jobs | Recovery drills |

## Interface Checklist

- Event schema with severity, operation, correlation ID, safe reason code.
- Sync/payment dashboards and alert thresholds.
- Performance budget checked in CI and preview.

## Implementation Steps

1. Measure representative low-end mobile and desktop baselines; set explicit budgets.
2. Lazy-load non-core modals/content, optimize images/fonts, split routes/components and remove unused code.
3. Implement redacted structured logging, correlation IDs, metrics and error boundaries.
4. Add alerting for payment verification, RLS/auth denials, sync backlog/failure and pairing abuse.
5. Automate backup/restore verification and rehearse migration/application rollback.
6. Add CSP/security headers and verify Cloudflare preview behavior.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | Logs from auth/payment/pairing failure | No secret/PII; correlated alert |
| High | Low-end mobile landing/core dashboard | Meets agreed CWV/bundle budget |
| High | Sync/payment outage | User-safe degradation + operator alert |
| High | Backup restore/rollback | Verified recovery with documented RTO/RPO |

## Todo

- [x] Performance budgets and optimizations
- [x] Redacted structured telemetry with correlation IDs on critical API failure paths
- [x] Production dashboards and hourly quiet-unless-actionable health/CI/Cloudflare/Supabase monitoring
- [x] Error boundaries/recovery UX
- [ ] Backup/restore/rollback drills (local JSON export, deletion, landing-page restore and production owner deletion pass; isolated database restore is blocked because the current Supabase organization does not include Branching and this host has no container runtime)
- [x] Security headers and local Worker preview verification
- [x] Fail-closed runtime readiness and one-command local release verification (database/billing/pairing config, compromised PayOS fingerprints, immutable SHA, CI, production bundle health and desktop/mobile E2E)

## Success Criteria

Performance CI is green on agreed devices; P0 operational failures alert with redacted evidence; restore and rollback rehearsals pass; no sensitive field appears in telemetry tests.

## Risk Assessment

Telemetry vendor and legal basis may be undecided. Keep adapter vendor-neutral; if consent requirements are unresolved, ship operational server telemetry only and disable product analytics.

## Dependency Map

Depends on Phases 5 and 7. Blocks Phase 9.
