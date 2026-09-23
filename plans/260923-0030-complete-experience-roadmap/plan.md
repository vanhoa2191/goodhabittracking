---
title: "KidHabit Hero Complete Experience Roadmap"
description: "Complete the remaining approved KidHabit experience work with measurable child engagement and staged releases."
status: pending
priority: P1
effort: "12-16 engineering weeks plus experiment observation"
issue: null
branch: main
tags: [feature, frontend, backend, analytics, accessibility, experimental]
blockedBy: []
blocks: []
created: 2026-09-23
---

# KidHabit Hero Complete Experience Roadmap

## Overview

Implement every remaining approved UI-audit and execution-plan item. Preserve completed work: warm light palette, readable typography, mobile modal shell, payment/pairing flows, 3D mascot masters, task details, completion feedback, docs, and adaptive locale selection.

## Scope contract

- Deliver the remaining Sprint 1-4 product work; do not redo verified production fixes.
- Use PostHog behind a no-op adapter until configuration is available.
- Never record child names, task free text, pairing codes, payment details, or full identifiers in analytics.
- Use narrowly scoped feature flags for engagement behavior. Roll back by disabling a flag, never by deleting family data.
- Keep all screens usable at 375px, 768px, and 1280px with reduced motion, keyboard operation, and nine-locale copy.

## Current evidence

- Landing is lighter and responsive, but remains 4,604px desktop / 6,732px mobile with six competing CTAs.
- Kid cards have details, haptic, sound, and completion feedback; they are not yet swipeable quests.
- Six mascot masters and hero palettes exist; letters, expression/season variants, and durable engagement state do not.
- Parent navigation has seven tabs; Habits mixes library and assigned records; Journeys is a grid, not a vertical map.
- No North Star event pipeline is implemented.

## Dependency flow

```text
Foundation -> Analytics -> Mascot/shell -> Quest loop -> Parent IA -> Journey controls -> Landing
                                              \                              /
                                               -> Long-term engagement ------
All phases -------------------------------------------------> Release validation
```

## Phases

| # | Phase | Priority | Depends on | Release gate |
|---|---|---:|---|---|
| 1 | [Foundation and experiment controls](./phase-01-start.md) | P1 | - | data contracts and flags ready |
| 2 | [Analytics foundation](./phase-02-analytics-foundation.md) | P1 | 1 | safe event flow observed |
| 3 | [Mascot and Kid shell](./phase-03-mascot-and-kid-shell.md) | P1 | 1, 2 | coherent child world |
| 4 | [Quest loop and durable rewards](./phase-04-quest-loop-and-rewards.md) | P1 | 2, 3 | daily loop works |
| 5 | [Parent information architecture](./phase-05-parent-information-architecture.md) | P1 | 1 | core actions found quickly |
| 6 | [Journey map and family controls](./phase-06-parent-journey-and-family-controls.md) | P1 | 3, 5 | parents can guide safely |
| 7 | [Landing Safe conversion](./phase-07-landing-safe-conversion.md) | P2 | 3, 5 | concise mobile conversion |
| 8 | [Long-term engagement and experiments](./phase-08-long-term-engagement-and-experiments.md) | P2 | 2, 4, 6, 7 | beta evidence available |
| 9 | [Release validation and rollout](./phase-09-release-validation-and-rollout.md) | P1 | 1-8 | production evidence complete |

## Global acceptance criteria

- [ ] Core child events are measured without sensitive child content.
- [ ] A child can complete three quests without parental explanation in moderated testing.
- [ ] Parent navigation has three named areas; pairing is found in under five seconds by test participants.
- [ ] Landing has one primary hero CTA and no overflow at 375px.
- [ ] No payment, pairing, profile, entitlement, or family-isolation behavior regresses.
- [ ] Rollout uses flags, health checks, logs, and a documented rollback path.

## Load-bearing assumptions

| Assumption | Failure signal | Response |
|---|---|---|
| Analytics configuration is available | events remain no-op in staging | do not start experiments |
| Mascot variants pass visual QC | three generations are rejected | ship masters only; source illustration |
| Notifications can be delivered | device tests fail | retain in-app parent reminder |
| Engagement stays healthy | average session exceeds 8 minutes | reduce prompts and retest |

## Out of scope

- Native mobile apps, new subscription plans, lifetime pricing, and unsupported ranking claims.

<!-- slug: complete-experience-roadmap -->
