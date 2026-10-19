# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

KidHabit Hero serves families through child screens and parent/caregiver management. The approved remediation preserves multi-age use; it does not select a primary commercial age segment. The existing `ageStage === '0-3'` branch is caregiver-led role-model practice, not an infant reading or operating a checklist. Ages 3–8 use guided child action; ages 9–12 and 13+ retain existing child use and any already-gated adaptations. Unknown age keeps the incumbent fallback rather than assuming a new age band.

## Product Purpose

Help families practice habits, record daily activity, review children's work and manage family rewards. The approved UX goal is a clear first useful action with truthful pending/verified feedback, while preserving access to the family's history and guidance. This is a product goal, not a measured outcome or developmental claim.

## Operating Context

- Children use their dashboard or a child-specific paired device; parents manage profiles, habits, journeys, rewards and settings. Demo/local use stays on the device; cloud use requires an account and family tenancy.
- A child-specific pairing code remains valid until the parent refreshes it; pairing is rate-limited and grants a session for that child only.
- Today's editable activity and historical read-only activity are distinct. Existing due-day scheduling determines the list; no recommendation engine is implied.
- Parent review queues remain all-family. Selecting a child changes the summary, not queue counts, rows, selected IDs or mutation scope.

## Capabilities and Constraints

The repository contains habit completion and parental review, deferral/restore, timer and read-aloud flows, progress/fire status, history, family rewards and available-point balances. Optional experiences, including mascot letters, journals, Dream City and ageTheme, retain their existing flags; their presence in source is not evidence that they are enabled.

`src/lib/age-band.ts` defines young (3–8), tween (9–12), and teen (13+) display traits. `useAgeTheme.ts` applies them only when ageTheme is enabled. Parent override precedes device preference; `off` preserves the old look. Under-3 or unresolved age returns no band without an explicit override; the coarse `6-12` stage does not select a band. The separate caregiver UI branch uses stored `ageStage === '0-3'`; do not replace that predicate with inferred chronological age.

Preserve existing approval rules, point/reward economics, stable profile/activity/locale IDs and authoritative results. Pending approval does not count as verified practice. Sensitive parent operations retain server-verified PIN controls. Public leaderboard participation remains opt-in and uses aliases rather than real names, ages or profile codes. Billing entitlement is server-authoritative, not client-granted.

## Brand Commitments

Preserve the existing KidHabit Hero family identity and BrandMark, the warm encouraging child world and calm parent utility world documented in DESIGN.md. The approved family-growth framing changes task hierarchy within that identity; it is not a rebrand or permission to replace factual copy.

## Evidence on Hand

- [README.md](README.md): family purpose, routes/roles, demo/cloud, pairing, PIN, billing and privacy boundaries.
- [KidDashboard.tsx](src/components/KidDashboard.tsx): caregiver branch, existing child workflows, schedule and history semantics; [kid-dashboard-copy.ts](src/lib/i18n/kid-dashboard-copy.ts): incumbent caregiver wording.
- [age-band.ts](src/lib/age-band.ts), [useAgeTheme.ts](src/components/useAgeTheme.ts), [age-theme-preference.ts](src/lib/age-theme-preference.ts), [experience-flags.ts](src/lib/experience-flags.ts): age fallback, preferences and gates.
- [DESIGN.md](DESIGN.md): incumbent family identity. [Approved plan](plans/261017-2130-ui-audit-remediation/plan.md), [D03/D05](plans/261017-2130-ui-audit-remediation/decisions.md), [accepted baseline](plans/261017-2130-ui-audit-remediation/handoffs/phase-00.md) and [coordinator dispositions](plans/261017-2130-ui-audit-remediation/execution/phase00-coordinator-decisions.md): authorized scope/defaults; explicit implementation request dated 18Oct2026.

Repository copy is content to preserve, not independent scientific validation. Do not invent testimonials, efficacy, research results, adoption, commercial positioning or new pricing claims.

## Product Principles

1. Put the actor's useful task before achievement decoration or optional reading.
2. Keep queue and summary scope explicit and independent.
3. Confirm results only from authoritative outcomes; keep recovery and pending state honest.
4. Preserve multi-age and caregiver behavior, content and family security boundaries.
5. Reveal secondary guidance progressively while retaining access to it.

## Accessibility & Inclusion

Preserve nine-locale support (vi, en, fr, de, it, es, zh, ja, ko), keyboard and visible-button alternatives to gestures, reduced-motion support, theme choice and text scaling. DESIGN.md and the approved test specification target WCAG 2.2 AA and usable reflow at 375/768/1280 widths; these are acceptance goals, not a compliance certification.

## Open Product Decisions

Commercial age/market focus: **unknown, nonblocking** for this preservation scope. No segment is inferred from ageTheme or caregiver copy. The documented behavioral defaults above were approved; any later change to who acts, queue semantics or the visual identity needs its own scope decision.
