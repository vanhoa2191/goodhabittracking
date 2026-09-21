# Phase 2 live schema reconciliation

Date: 2026-09-19

## Confirmed through the deployed public API

- The configured Supabase project is reachable.
- `child_profiles`, `habit_activities`, and `public_leaderboard` exist.
- Anonymous `SELECT` requests to those endpoints return HTTP 200, confirming the tracked anonymous-read exposure is active in the deployed schema.

No write probe was sent because it would mutate production data. No row contents, credentials, or personal data were captured.

## Repository drift

The tracked legacy schema used nullable `user_id` ownership, anonymous policy bypasses, and a public `FOR ALL` policy on `family_access_codes`. It lacked family memberships, canonical family ownership, parent settings, groups, kudos, scoped device sessions, and several WIT round-trip fields.

Migration `202609190001_family_tenancy.sql` is the canonical reconciliation path. `supabase/schema.sql` now delegates to that versioned migration so the insecure legacy snapshot cannot be executed accidentally.

## Deployment gate

The current environment provides a public key but no database connection or service-role credential. Therefore the following production-only steps remain gated:

1. Export a recoverable database backup.
2. Run the preflight SQL and retain its output.
3. Execute the migration in a transaction-capable administrator session.
4. Run the anonymous and cross-family negative matrix against the migrated database.
5. Rehearse the non-destructive rollback in a restored staging copy.

Production application is deliberately deferred until the pairing, payment, and authoritative-sync phases no longer depend on legacy behavior.
