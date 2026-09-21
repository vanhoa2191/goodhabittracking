---
phase: 2
title: "Identity, Tenancy, RLS, and Canonical Data Model"
status: complete
priority: P1
effort: "5-8d"
dependencies: [1]
---

# Phase 2: Identity, Tenancy, RLS, and Canonical Data Model

## Overview

Create the ownership model every later feature depends on: authenticated parent accounts, family membership, canonical UUIDs, strict RLS, versioned migrations, and a minimal public leaderboard projection.

## Requirements

- Every private entity has `family_id`; every parent action requires authenticated membership.
- Child devices use scoped device sessions, not anonymous table access.
- Remove all `auth.uid() IS NULL` and public `FOR ALL` ownership bypasses.
- Version all schema changes under `supabase/migrations/`; keep `schema.sql` generated/documentary.
- Cover every current domain entity and audited WIT metadata needed for round-trip persistence.

## Architecture

`auth.users -> family_memberships -> families -> child_profiles -> domain rows`. Browser Supabase client handles user-scoped reads. Sensitive mutations use authenticated route handlers; service credentials, if required, remain server-only and still verify ownership explicitly.

## File Inventory

| Action | Files | Test impact |
|---|---|---|
| Create | `supabase/migrations/*-family-tenancy.sql`, `src/lib/supabase/server.ts`, `src/lib/auth/**` | RLS and ownership integration tests |
| Modify | `supabase/schema.sql`, `src/lib/supabase.ts`, `src/types/index.ts`, `src/lib/store.tsx` | Canonical IDs and contracts |
| Create | `tests/integration/rls/**`, `tests/integration/migrations/**` | Anonymous/cross-family negative matrix |

## Interface Checklist

- Tables: families, family memberships, parent profiles, device sessions; family ownership on all private tables.
- Types: canonical DB/domain DTO mapping; no client timestamp IDs for DB rows.
- Public API: only leaderboard projection fields explicitly approved for publication.

## Implementation Steps

1. Inspect live schema drift and export a recoverable backup before migration.
2. Define tenancy ADR and migration with backfill strategy for existing rows.
3. Add canonical identifiers and missing tables/columns for logs, rewards, redemptions, badges, groups, kudos, parent settings and WIT metadata.
4. Replace RLS policies with membership-based `SELECT/INSERT/UPDATE/DELETE` policies and restricted public leaderboard view/function.
5. Split browser/server Supabase clients; require authenticated request context in private routes.
6. Update domain mappings and fail loudly on DB errors.

## Test Scenario Matrix

| Priority | Scenario | Expected |
|---|---|---|
| Critical | Anonymous CRUD on private tables | Denied |
| Critical | Family A reads/writes Family B | Denied |
| Critical | Parent creates child + activity | Canonical UUIDs round-trip |
| High | Leaderboard public query | Only opted-in projection fields |
| High | Migration against legacy rows | Backfilled or quarantined, never silently dropped |

## Todo

- [x] Tenancy ADR and migrations
- [x] Strict RLS and negative contract tests
- [x] Canonical DTO/domain mapping
- [x] Live-schema reconciliation report and non-destructive rollback script
- [x] Recoverable logical backup, live rollback validation, eight production migrations and post-migration structural/RLS verification
- [x] Live anonymous, same-family and cross-family read/write matrix with automatic synthetic-data cleanup

## Success Criteria

All authorization matrix tests pass; no anonymous private access remains; all domain entities can be represented without lossy fields; migration dry-run and rollback rehearsal succeed.

## Risk Assessment

Deployed schema may differ from tracked SQL. Observable signal: migration preflight mismatch. Response: stop, snapshot, add reconciliation migration. Never reset production DB.

## Dependency Map

Depends on Phase 1. Blocks Phases 3-6 and 9.
