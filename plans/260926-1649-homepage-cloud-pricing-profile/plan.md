---
title: "KidHabit Homepage, Cloud-Only Data, Pricing, and Profile Reliability"
description: "Repair child-profile creation, simplify family data to cloud-only persistence, introduce the 29k one-child tier, and rebuild the homepage from verified product proof."
status: in-progress
priority: P1
effort: "12-18 engineering days plus controlled production verification"
issue: null
branch: main
tags: [feature, bugfix, frontend, backend, database, payments, auth, critical]
blockedBy: []
blocks: [260923-0030-complete-experience-roadmap]
created: 2026-09-26
---

# KidHabit Homepage, Cloud-Only Data, Pricing, and Profile Reliability

## Overview

Deliver the approved product change as one coherent customer journey: a new visitor understands and trusts KidHabit on the homepage; signs in; uses cloud sync without choosing a storage mode; creates a child profile successfully; and can choose among the 7-day trial, 29k one-child plan, 49k family monthly plan, or 399k family yearly plan.

This plan changes product, billing, persistence, and conversion surfaces together. It does not implement anything until approved.

## Decisions Proposed for Approval

| Area | Proposed decision |
|---|---|
| 29k name | **Gói Một Bé** — 29.000đ/tháng, full core experience for 1 child; label **Khởi đầu nhẹ nhàng** |
| 49k name | **Gói Gia Đình · Tháng** — 49.000đ/tháng, current family/unlimited-child entitlement; label **Phổ biến nhất** |
| 399k name | **Gói Gia Đình · Năm** — 399.000đ/năm, same family entitlement; label **Tiết kiệm nhất** and show the verified 189.000đ annual saving versus monthly billing |
| Trial | Keep the existing explicit 7-day Pro trial; no card and no automatic charge |
| No paid plan | Keep existing family data safe and readable; require trial or paid entitlement for new domain writes; never delete data on expiry |
| Legacy lifetime | Stop selling it, but grandfather every existing lifetime family indefinitely with its current entitlement; never auto-convert or expire it |
| Cloud-only | Remove local family-data mode and selector. Preserve local browser storage only for demo/session/UI preferences, not authoritative family data |
| Homepage proof | Use real app components or current captures. No invented testimonials, family counts, or educational outcome claims |

## Evidence and Constraints

- Reference analysis: [Sales-page adaptation report](./reports/sales-page-analysis.md).
- Current pricing registry exposes `free`, `trial`, `monthly`, and `yearly`; paid checkout accepts only `monthly` and `yearly`.
- Current profile API collapses all RPC failures into HTTP 409 and one generic message, so the reported production failure is real but its exact database reason is not yet observable from the UI.
- Current store still branches every domain mutation between local and cloud persistence. Removing the selector alone would leave dead behavior and test risk.
- Existing `monthly` and `yearly` identifiers should remain stable to preserve paid orders and subscriptions; add `solo_monthly` for 29k.
- The internal `free` value may remain temporarily as a legacy/no-entitlement state, but it must not appear as a purchasable or usable customer plan.

## Dependency Flow

```text
Contract + diagnostics
        |
        +--> profile save reliability
        |
        +--> cloud-only family persistence
        |            |
        +------------+--> paid entitlement model
                                  |
Reference analysis --------------+--> homepage redesign
                                              |
                                      release verification
```

## Phases

| # | Phase | Priority | Depends on | Release gate |
|---|---|---:|---|---|
| 1 | [Contract and diagnostic freeze](./phase-01-start.md) | P1 | - | exact failure and product rules recorded |
| 2 | [Child-profile save reliability](./phase-02-profile-save-reliability.md) | P1 | 1 | first and subsequent allowed profiles save transactionally |
| 3 | [Cloud-only family data](./phase-03-cloud-only-family-data.md) | P1 | 1, 2 | no local/cloud choice or local family write path remains |
| 4 | [Paid plan and entitlement model](./phase-04-paid-plan-entitlements.md) | P1 | 1, 2, 3 | 29k/49k/399k checkout and limits are authoritative |
| 5 | [Homepage conversion redesign](./phase-05-homepage-conversion-redesign.md) | P1 | 1, 4 | truthful, concise landing journey passes visual QA |
| 6 | [Release verification](./phase-06-release-verification.md) | P1 | 2-5 | migration, payment, profile, CI, and production gates pass |

## Cross-Plan Dependency

This change supersedes parts of Phase 7 and must complete before Phase 9 of `260923-0030-complete-experience-roadmap`. That roadmap must not be certified complete against the old landing, free-tier, or local-storage assumptions.

## Global Acceptance Criteria

- [ ] A signed-in parent can create the first child and receive a specific recoverable error for any rejected save.
- [ ] Family-domain data is cloud-authoritative; no user-facing storage-mode choice or local family mutation path remains.
- [ ] Demo remains usable without an account and is visibly isolated from real family data.
- [ ] Pricing shows only trial guidance and the 29k, 49k, and 399k offers with the approved Vietnamese names.
- [ ] PayOS amount, order plan, webhook activation, subscription state, and child limit agree for all three paid plans.
- [ ] Existing data and 49k/399k entitlements are preserved through migration and rollback.
- [ ] Homepage follows the approved section hierarchy, uses only verified claims, and passes 375/768/1280 plus nine-locale visual/accessibility checks.
- [ ] CI, migrations, Cloudflare deploy, `/api/health`, and controlled production smoke tests pass.

## Non-Goals

- No new lifetime plan or lifetime checkout. Existing lifetime grants remain honored indefinitely.
- No native app, new payment provider, testimonials, public family counts, or unsupported developmental claims.
- No automatic conversion or charging of existing users.
- No removal of local theme, language, font, demo, or short-lived session preferences.

## Approval Boundary

Approval authorizes implementation, migrations, tests, and deployment described here. Until approval, no source code, database, pricing, or production behavior changes.

<!-- slug: homepage-cloud-pricing-profile -->
