---
title: "GoodHabitTracking Audit Baseline"
status: final
reviewed_commit: "a992f55dd76b9be12e1f8bdd97cbb0c62f45b1d8"
created: 2026-09-19
---

# GoodHabitTracking Audit Baseline

## Summary

Current product is a strong prototype, not a production-safe family SaaS. Primary blockers are trust boundaries and data correctness rather than visual polish.

## Confirmed P0 Findings

| Finding | Evidence |
|---|---|
| Anonymous/cross-family data access permitted by tracked RLS | `supabase/schema.sql:108-162,236-269` |
| Payment simulation returns paid and can activate plan | `src/app/api/payment/status/route.ts:16-33`; runtime POST returned `paid: true` |
| Webhook signature check fails open when signature omitted | `src/app/api/payment/webhook/route.ts:17-29` |
| Pairing returns parent PIN and family snapshots | `src/app/api/family/code/route.ts:197-276`; redacted runtime response confirmed PIN field |
| Four-character non-cryptographic pairing code, no TTL/rate limit | `src/app/api/family/code/route.ts:41-68` |
| Cross-family client state contamination | Runtime: old redemption remained after pairing new family; `src/lib/store.tsx:687-713` |
| Cloud sync omits core entities | `src/lib/store.tsx:453-524,919-1175` |

## Quality Baseline

- Production build: pass.
- Lint: fail, 20 errors and 77 warnings.
- Production dependency audit: zero known vulnerabilities reported.
- Automated test files/scripts: absent.
- Localization: nine locale files, but runtime displays mixed languages and document language is fixed to Vietnamese.
- Documentation: stock Create Next App README.

## Product/UX Baseline

- Strengths: distinct WIT positioning, motivating child UI, broad parent tools, rewards/badges/journeys, responsive foundation.
- Gaps: demo/real ambiguity, fake leaderboard peers, weak onboarding, hidden-scroll parent IA, unsupported claims, incomplete privacy/data lifecycle, no authoritative sync feedback.

## Planning Constraint

No phase may claim completion from code review alone. Each behavioral contract requires automated evidence and manual surface QA on the exact release commit.
