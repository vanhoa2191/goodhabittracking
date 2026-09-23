---
phase: 1
title: "Foundation and experiment controls"
status: complete
priority: P1
effort: "3-4 days"
dependencies: []
---

# Phase 1: Foundation and experiment controls

## Overview

Create family-scoped engagement state and feature flags before any new child loop.

## Requirements

- [x] Add additive RLS-protected records for mascot selection time, daily letters, secret quests, wishlist choice, and family pause.
- [x] Add typed local feature flags and compatible local/demo adapters.

## Implementation Steps

1. Inventory existing family, child, log, reward, and session patterns.
2. Add migrations, rollback, typed mappers, authenticated APIs, and store clearing on family switch.
3. Pin RLS, absent-record hydration, and disabled-flag behavior in API/integration tests.

## Todo

- [x] Verify same-family and cross-family reads and writes in a production database transaction that rolls back. Permanent migration rollout remains separate.
- [x] Existing family data hydrates without new records.

## Verification snapshot

- Lint, typecheck, 265 tests, and Cloudflare build passed locally on 2026-09-23.
- The unauthenticated `/api/domain/experience` route returned HTTP 401 on a local dev server.
- New experience flags remain disabled. The migration was applied to production on 2026-09-23.
- On 2026-09-23, the production SQL Editor preview exposed Supabase default table privileges that allowed client writes to secret quests. The migration now revokes defaults before selective grants. The corrected preview passed same-family engagement read/write, cross-family read denial, child/reward foreign-key denial, private family pause/wishlist reads, denied anonymous table access, and read-only quest privileges. The transaction returned `preview_rolled_back = true`; no trial tables or child/reward fixtures remained.
- After permanent migration rollout, the production catalogue confirmed all five tables with forced RLS, all five family foreign keys, denied anonymous reads, and denied authenticated writes to generated letters and quests. A live transaction checked same-family and cross-family behavior, then rolled back its child and reward fixtures; both counts remained zero.

Implementation and permanent database rollout are complete. Worker rollout remains a separate release step.

## Success Criteria

Every new flag off exactly restores current production behavior.
