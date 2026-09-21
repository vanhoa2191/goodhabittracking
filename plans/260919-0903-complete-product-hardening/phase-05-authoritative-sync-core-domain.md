---
phase: 5
title: "Authoritative Sync and Core Habit Domain"
status: in-progress
priority: P1
effort: "7-10d"
dependencies: [2, 3]
---

# Phase 5: Authoritative Sync and Core Habit Domain

## Overview

Move habit, approval, points, streak, reward, badge, group and kudos rules from monolithic client state into typed, transactional domain services with reliable multi-device synchronization.

## Requirements

- Persist and restore every core entity; no “cloud” claim for local-only state.
- Transactional completion/approval/redemption; idempotent commands and optimistic UI rollback.
- Explicit state machines for activity log and redemption statuses.
- Correct local-date/timezone recurrence and streak rules, including gaps, pauses and approval timing.
- Local-only mode performs zero network writes and clearly reports backup risk.

## Architecture

UI hooks -> typed command/query layer -> authenticated APIs/Supabase -> domain transaction -> realtime invalidation/refetch. Split `store.tsx` by identity, habits, rewards, social, billing and UI state; keep one composition provider.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Refactor | `src/lib/store.tsx`, `src/types/index.ts` | Protect all public store consumers |
| Create | `src/lib/domain/{habits,rewards,progress,sync}/**`, `src/lib/stores/**` | Pure rule/unit tests |
| Modify | `KidDashboard.tsx`, `ParentDashboard.tsx`, `LeaderboardSection.tsx` | Multi-device E2E |
| Create | API/domain integration and concurrency tests | Transaction and conflict coverage |

## Interface Checklist

- Commands: complete, undo, approve, reject, redeem, approve/deliver/refund, send kudo.
- Queries: daily schedule, pending approvals, balances, progress, leaderboard.
- Sync status: synced, pending, offline, failed, retrying with last success.

## Implementation Steps

1. Characterize intended domain rules and define status transition tables.
2. Implement timezone-aware date-only utility and deterministic streak/schedule rules.
3. Add server transactions/idempotency for completion, approval and redemption.
4. Persist badges, groups, kudos, parent settings and WIT metadata; add realtime/refetch invalidation.
5. Decompose store and dashboards along domain boundaries without changing visual design.
6. Implement offline/pending UI and rollback on failed optimistic updates.
7. Prove local-only mode makes no remote domain requests.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | Two devices complete/redeem concurrently | One idempotent transaction; correct balance |
| Critical | Child completion -> parent approval | Visible and consistent on both devices |
| Critical | Failed network mutation | UI rolls back or remains pending, never lies |
| High | Midnight/timezone/gap/pause | Correct scheduled day and streak |
| High | Local-only mode | No cloud request; export restores full state |

## Todo

- [x] Domain state machines and tests
- [x] Transactional APIs
- [x] Core entity persistence and refetch sync
- [x] Store/dashboard decomposition (all seven parent tabs extracted; tested leaderboard, subscription, backup, immutable local CRUD/redemption, atomic local habit transitions, pairing HTTP/parsing, validated cloud-family snapshots, race-safe auth, typed command transport and activity/profile/reward/social/habit-log orchestration moved out; cloud identity/snapshot sync, local/demo persistence and child pairing now live in focused lifecycle hooks; `store.tsx` reduced from 1,797 to 772 lines and remains the public composition provider)
- [x] Cloud activity create/update/delete and batch creation are API-first, authenticated and family-scoped; journeys and age packs use one atomic database insert, and the UI refetches authoritative state before reporting success or keeps data unchanged with a localized error
- [x] Child profile create/update/delete is API-first and family-scoped; profile plus starter habits are committed by one PostgreSQL command, profile updates cannot mutate progress fields, and create/update/delete UI waits for authoritative refetch or preserves the current state with localized recovery feedback
- [x] Reward create/update/delete is API-first and family-scoped; callers cannot supply family/user ownership, cloud mode never falls through to local mutation without authentication, and the UI waits for authoritative refetch or keeps visible data unchanged with localized recovery feedback
- [x] Group create/join/reward update and kudos are API-first and family-scoped; invite codes are generated atomically, cloud mode never falls through to local mutation without authentication, and group creation waits for authoritative refetch or preserves visible state with localized recovery feedback
- [x] Multi-device core lifecycle and reconnect E2E; local/offline mutation recovery remains covered by browser/unit gates

## Success Criteria

Required two-device E2E passes; reload/reconnect restores every entity; balances and streaks remain correct under concurrency and timezone boundaries; sync UI reports truthfully.

## Risk Assessment

Large refactor can destabilize UI. Migrate one command/query slice at a time behind flags; compare legacy/new results in test only; remove legacy path after parity.

## Dependency Map

Depends on Phases 2 and 3. Blocks Phases 6-9.
