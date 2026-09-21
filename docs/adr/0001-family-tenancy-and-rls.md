# ADR 0001: Family tenancy and strict row-level security

- Status: Accepted
- Date: 2026-09-19
- Owners: Product engineering

## Context

The legacy schema attaches most rows directly to `auth.users` through `user_id`. Its policies also allow access when `auth.uid()` is null, and the legacy device-code table grants public read/write access. This makes anonymous and cross-device data isolation impossible to prove.

KidHabit Hero needs multiple caregivers per family, scoped child devices, server-owned payment state, and a deliberately minimal public leaderboard. These capabilities need one stable tenant boundary shared by every private entity.

## Decision

`families.id` is the tenant key. Authenticated adults gain access through `family_memberships`, and every private domain row carries a non-null `family_id`. RLS calls small `security definer` membership predicates whose `search_path` is empty and whose execution is limited to authenticated users.

New accounts receive a family, owner membership, parent profile, and parent settings row in one database trigger. Existing rows with an authenticated `user_id` are backfilled into one family per legacy owner. Rows without a verifiable owner are copied to `migration_quarantine` and removed from user-facing tables; they are never silently discarded.

Browser code uses only the deployment's public Supabase configuration. It cannot replace the project URL or key through local storage. Server route handlers use the request cookie session and resolve the caller's family membership before accessing private data.

The public leaderboard is exposed only through `get_public_leaderboard`. It returns the approved child alias/avatar/theme/score/streak/level/tier projection, requires both family and child opt-in, and caps each result set at 100 rows. Private tables remain inaccessible to anonymous callers.

Device sessions and payment writes are server-only. The migration creates the tenancy anchors but later phases own challenge exchange, capability enforcement, PayOS verification, and entitlement transitions.

## Consequences

- Sharing a family becomes an explicit membership operation instead of duplicating data by account.
- All cloud writes require authentication and a resolvable family membership.
- Local-only demo data can keep UUID identities but is not uploaded until the user signs in.
- Applying the migration before Phases 3–5 would intentionally disable legacy pairing and client-authored entitlement writes. Production rollout therefore waits for those dependent phases.
- A database backup and preflight output are mandatory before migration. The rollback restores strict authenticated `user_id` policies without dropping new columns or quarantined rows.

## Verification

- PostgreSQL parser validation covers migration and rollback syntax.
- Integration assertions reject anonymous policy bypasses and destructive rollback statements.
- DTO tests cover canonical UUIDs and WIT metadata round trips.
- Production RLS execution tests require database administrator credentials and run immediately before deployment.
