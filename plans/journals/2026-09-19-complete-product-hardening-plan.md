---
title: Complete Product Hardening Plan
date: 2026-09-19
summary: Created and validated a nine-phase remediation plan from the full product audit.
---

# Complete Product Hardening Plan

## What happened

Converted the full GoodHabitTracking audit into an executable nine-phase plan under `plans/260919-0903-complete-product-hardening/`. The plan covers release kill switches, identity and RLS, device pairing, payment integrity, authoritative sync, onboarding and child privacy, UX and localization, accessibility, operations, and release certification.

## Decisions

- Keep a Cloudflare-compatible Next.js modular monolith.
- Move security-sensitive and value-changing behavior to authenticated server-authoritative contracts.
- Enforce family tenancy in schema and RLS before rebuilding pairing, payments, and sync.
- Isolate demo data from real-family state and production services.
- Treat WCAG 2.2 AA, nine-locale parity, negative authorization tests, and two-device E2E as release gates.

## Evidence

- `ak plan validate plans/260919-0903-complete-product-hardening --json` returned `valid: true`.
- `ak plan parse` found 9 phases and 43 implementation tasks.
- The plan was reindexed and set as the current worktree plan.

## Next steps

Red-team the plan because it changes authentication, payments, RLS, and child-data handling. Then execute Phase 1 before any public production testing.

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
