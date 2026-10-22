> Coordinator implementation constraints: the proposal below is guidance, not executable SQL. Use a valid function-local/shared trusted version mechanism, never a migration-global DECLARE. Never rewrite existing content versions or pinned old rows; imports append versioned reviewed rows. Initial production requires only vi 6–8 and 9–12 (1460 reviewed slots), not approval of all 2920 technical candidates. Real candidate/pilot/release JSON and the empty release digest remain unchanged until genuine human approval.

# Node Contract Reader Report — Thinking Games Release Path

**Task ID**: task_34164703292d  
**Dispatch**: ctx_9051f73c7330  
**Date**: 2026-10-22  
**Scope**: Read-only verification of actual Node implementation vs remaining work for thinking-games production release.

---

## 1. Executive Summary

Verified the current Node implementation against the audit findings in `cline-release-path-audit.md`. The Node-side release gate (`catalog.ts` + `release-manifest.ts` + `server-features.ts`) is **correctly implemented and fail-closed**. The SQL layer has **three hardcoded `pilot-2026-10-21` literals** that must be replaced with a trusted server-managed version pin before production. The promotion script exists and works but is **PREPARATION-ONLY** — it writes a local `.approved.json` artifact, not the serving `release-365-v1.json`. No real human editorial review has occurred; the 2920 candidate items remain `design_only`.

**Overall status**: Node implementation complete for the release gate; SQL version-pin migration + real human editorial review + operator promotion step remain.
---

## 2. Actual Node Implementation (Verified)

### 2.1 Server Feature Flags (`src/lib/server-features.ts:26-43`)

```typescript
const unsafeDevelopmentFeaturesAllowed = parsed.NODE_ENV !== 'production';
// Pilot class flags — ALL false in production
thinkingGamesPilotEnabled: unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_THINKING_GAMES_PILOT,
thinkingGamesBonusEnabled: unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_THINKING_GAMES_BONUS && pilotEnabled,
thinkingGamesServePilotContentEnabled: unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_THINKING_GAMES_SERVE_PILOT_CONTENT,
thinkingGamesInternalCatalogEnabled: unsafeDevelopmentFeaturesAllowed && parsed.ENABLE_THINKING_GAMES_INTERNAL_CATALOG,
// Release master — only flag that can be true in production
thinkingGamesReleaseEnabled: parsed.ENABLE_THINKING_GAMES,
```

**Verified**: All four pilot flags structurally `false` when `NODE_ENV=production`. `NODE_ENV` defaults to `development` if unset (deployment hygiene risk, not code bug). Release master `ENABLE_THINKING_GAMES` is independent and production-eligible.

### 2.2 Catalog Admission (`src/lib/thinking-games/server/catalog.ts:39-88`)

Two profiles, fail-closed:

| Profile | Gate | Conditions |
|---------|------|------------|
| `internal-pilot` | `thinkingGamesInternalCatalogEnabled` (dev only) | Loads `pilot-manifest-v1.json`; requires `isPilotFixture=true` and non-empty items |
| `release` | `thinkingGamesReleaseEnabled` **AND** `admitReleaseManifest()` | 7 gates (see below) |

**`admitReleaseManifest()` gates (lines 44-52):**
1. `manifest.isPilotFixture === false`
2. `manifest.items.length > 0`
3. `items.some(item => item.status === 'approved')`
4. `manifest.editorialApproval !== null` (human sign-off record)
5. `trustedDigest` (RELEASE_MANIFEST_DIGEST) non-empty
6. `manifestDigestValue === trustedDigest` (content binding)
7. `validateManifest(manifest, { profile: 'release' })` succeeds

**Verified**: No single gate grants admission. The server flag alone is insufficient. Catalog returns `{ ok: false, code: 'catalog_not_approved' }` on any failure.

### 2.3 Release Manifest Identity (`src/lib/thinking-games/server/release-manifest.ts:16-18`)

```typescript
export const RELEASE_MANIFEST_VERSION = 'release-365-v1';
export const RELEASE_MANIFEST_DIGEST = '';  // Empty = no human-approved manifest pinned
```

**Verified**: Empty digest forces `catalog_not_approved` until operator populates it after real editorial sign-off.

### 2.4 Client Cannot Choose Version/Profile/Age/Seed

- API routes (`/api/child/thinking-games/start`, `/api/domain/thinking-games/start`) call `getThinkingGameCatalog()` first — fail-closed on `catalog_not_approved` (HTTP 409).
- RPCs (`thinking_game_start`, `thinking_game_parent_start_as`) receive only `slot_type`, `expectedLocalDay`, `commandId`. Age track resolved server-side via `thinking_game_resolve_age_track_for_child()`. Content version pinned by server query.
---

## 3. SQL Layer — Actual Gaps (Verified from Migration)

### 3.1 Hardcoded `pilot-2026-10-21` Literals (3 locations)

| Function | Line | Current Code |
|----------|------|--------------|
| `thinking_game_start` | 507 | `where content_version='pilot-2026-10-21'` |
| `thinking_game_parent_start_as` | 713-720 | No hardcoded version; filters `status='approved'` OR `design_only` for service_role |
| `sync_thinking_game_bonus_for_child` | 214 | `where content_version='pilot-2026-10-21'` |

**Critical**: `thinking_game_start` (child direct start) and `sync_thinking_game_bonus_for_child` pin to pilot version. `thinking_game_parent_start_as` already queries by `status='approved'` (correct for release) but also admits `design_only` for service_role (pilot compatibility).

### 3.2 Required SQL Contract for Trusted Version Pin

The migration must replace all three literals with a **single trusted version constant** (migration-level or from a `thinking_game_manifests` row — table doesn't exist yet, reuse existing unique key: `unique (content_version, day_index, slot_type, age_track, locale)` on `thinking_game_content`).

**Proposed minimal change** (one new migration):
- Add a constant `CURRENT_RELEASE_VERSION text := 'release-365-v1';` at migration top
- Replace `content_version='pilot-2026-10-21'` with `content_version=CURRENT_RELEASE_VERSION` in all three functions
- Update `content_version` column values in `thinking_game_content` from `pilot-2026-10-21` to `release-365-v1` for approved items (or re-seed from promoted manifest)
- Update preflight (`supabase/preflight/202610210001_thinking_games.verify.sql`) and rollback (`supabase/rollbacks/202610210001_thinking_games.rollback.sql`) to reference new version

### 3.3 RPC Signatures (Unchanged — Stable)

| RPC | Parameters | Returns |
|-----|------------|---------|
| `thinking_game_start` | `session_token_hash text, p_slot_type text, p_expected_local_day date, command_id uuid` | `jsonb` |
| `thinking_game_parent_start_as` | `actor_user_id uuid, target_child_id uuid, p_slot_type text, p_expected_local_day date, command_id uuid` | `jsonb` |
| `sync_thinking_game_bonus_for_child` | `target_child_id uuid, target_local_day date` | `jsonb` |
| `thinking_game_finish_verified` | `session_token_hash text, attempt_id uuid, won boolean, answer jsonb, command_id uuid` | `jsonb` |
| `thinking_game_parent_finish_as` | `actor_user_id uuid, target_child_id uuid, attempt_id uuid, won boolean, answer jsonb, command_id uuid` | `jsonb` |

No signature changes needed. Admission controlled by `thinking_game_content.status='approved'` + server version pin.
---

## 4. Promotion Tooling — Actual State

### 4.1 `scripts/promote-thinking-games-release.mjs` (Exists, Works)

- **PREPARATION-ONLY**: Writes `content/thinking-games/manifests/<version>.approved.json` (local artifact)
- **Does NOT**: write serving `release-365-v1.json`, touch DB, alter existing manifests
- **Requires**: `--manifest <candidate>`, `--approval-hash <sha256>`, `--editorial-signature <blob>`
- **Verifies**: release-profile validation, all items `status='approved'` with `editorial` present, hash binding
- **Tested**: Runs successfully against synthetic fixture (exit 0, produces valid artifact)

### 4.2 Missing: Real Human Editorial Review

- 2920 candidate items across 5 batches in `content/thinking-games/candidates/365-v1/` — all `status: "design_only"`, `editorial: null`
- No synthetic fixture may substitute for real human approval
- Promotion script correctly refuses if any item `design_only` or no human signature

---

## 5. Test Results (Actual Runs)

| Test Suite | Command | Result | Notes |
|------------|---------|--------|-------|
| API tests | `npx vitest run tests/api/` | **467 PASS** | All green |
| Unit (thinking-games) | `npx vitest run tests/unit/thinking-games/` | **84 PASS / 3 FAIL** | 2 timeouts (pre-existing perf), 1 engineHash mismatch (stale V1 provenance) |
| TypeScript | `npx tsc --noEmit` | **1 ERROR** | `synthetic-release-fixture.test.ts:41` — type cast missing `editorialApproval` on narrowed type |
| ESLint (server) | `npx eslint src/lib/thinking-games/server/` | **PASS** | 0 errors, 0 warnings |
| Promotion script | `node scripts/promote-thinking-games-release.mjs ...` | **PASS** | Produces valid `.approved.json` artifact |

**Failures are pre-existing, not regressions:**
- `p06-fixtures-v2.test.ts`: 5000ms timeout (known boundary perf, 6-file load)
- `year-candidates.test.ts`: engineHash `0f7da852` vs expected `c5c126aa` (stale V1 provenance, out of scope)
- `year-candidates.test.ts`: timeout on release-profile validation of large candidate manifest
---

## 6. Remaining Work (Minimal, Concrete)

### 6.1 Node — Zero Changes Required
Release gate is complete and correct. No Node edits needed.

### 6.2 SQL — One Migration (Smallest Possible)
1. Create new migration replacing three `pilot-2026-10-21` literals with trusted version pin
2. Re-seed `thinking_game_content` with `content_version='release-365-v1'` for approved items
3. Update preflight + rollback scripts

### 6.3 Content — Real Human Editorial Review (Blocking)
- All 2920 candidate items must be reviewed, set to `status: "approved"`, `editorial: { reviewedBy, reviewedAt, ageReviewedBy, ageReviewedAt }`
- Run promotion script with real approval hash + human signature
- Operator manually copies `.approved.json` → `release-365-v1.json`
- Populate `RELEASE_MANIFEST_DIGEST` constant in `release-manifest.ts` with SHA-256 of final manifest

### 6.4 Deploy Sequence (From Audit §9)
1. Config: `NODE_ENV=production`, `ENABLE_THINKING_GAMES=true` (after manifest pinned)
2. Content: Promotion script + manual copy to serving path
3. Build: `npm run build` (catalog test green, pilot paths unreachable)
4. DB: Apply version-pin migration
5. Deploy: Ship Node build + migration
6. Family rollout: `thinking_game_settings.enabled` per family (DB-enforced default-off)

---

## 7. Exact DB Interface / Handoff

### 7.1 Tables (Unchanged)
```sql
thinking_game_content (
  id text PK,
  content_version text NOT NULL,
  day_index int CHECK (1-365),
  slot_type text CHECK ('main','bonus'),
  age_track text CHECK ('age_6_8','age_9_12'),
  locale text CHECK ('vi'),
  game_type_id text,
  rule_variant_id text,
  status text CHECK ('design_only','reviewed','approved','retired'),
  checker_id text,
  public_payload jsonb,
  grading_payload jsonb,
  fingerprint text,
  UNIQUE (content_version, day_index, slot_type, age_track, locale)
)
```

### 7.2 RPCs (Unchanged Signatures)
- `thinking_game_start(session_token_hash, p_slot_type, p_expected_local_day, command_id)`
- `thinking_game_parent_start_as(actor_user_id, target_child_id, p_slot_type, p_expected_local_day, command_id)`
- `sync_thinking_game_bonus_for_child(target_child_id, target_local_day)`

### 7.3 Permissions (Unchanged)
- `thinking_game_start`: EXECUTE to `authenticated` (via child session)
- `thinking_game_parent_start_as`: EXECUTE to `service_role` only
- `sync_thinking_game_bonus_for_child`: REVOKED from all (trigger-only)
- `thinking_game_finish_verified`: EXECUTE to `service_role` only
- Habit RPCs (`complete_*`, `undo_*`, `review_*`): EXECUTE to `authenticated`/`anon` per contract

### 7.4 Admission Logic (SQL-Side)
```sql
-- Child start (thinking_game_start) — MUST filter by trusted version
WHERE content_version = CURRENT_RELEASE_VERSION
  AND status = 'approved'
  AND age_track = thinking_game_resolve_age_track_for_child(child_id, family_id)
  AND locale = 'vi'

-- Parent start (thinking_game_parent_start_as) — Already correct
WHERE status = 'approved'  -- (plus design_only for service_role compatibility)
  AND age_track = thinking_game_resolve_age_track_for_child(target_child_id, family)
  AND locale = 'vi'

-- Bonus sync (sync_thinking_game_bonus_for_child) — MUST filter by trusted version
WHERE content_version = CURRENT_RELEASE_VERSION
  AND status = 'approved'
  AND locale = 'vi'
```

---

## 8. Checkpoint Status

| Area | Status | Evidence |
|------|--------|----------|
| Node release gate (flags + catalog + manifest) | **PASS** | Code reviewed, tests green, fail-closed verified |
| Client cannot choose version/profile/age/seed | **PASS** | API + RPC signatures inspected |
| SQL hardcoded literals | **FAIL** | 3 locations with `pilot-2026-10-21` |
| Promotion script exists & works | **PASS** | Executed successfully against synthetic fixture |
| Real human editorial review | **BLOCKED** | 2920 items `design_only`, no human signature |
| TypeScript clean | **FAIL** | 1 error in test file (type cast) |
| Unit tests all pass | **FAIL** | 3 pre-existing failures (2 timeout, 1 hash mismatch) |

**Checkpoint**: **FAIL** — SQL literals + TypeScript error + pre-existing test failures block completion. Node implementation itself is correct; gaps are in SQL and content approval.

---

## 9. Files Read (Reference)

- `src/lib/server-features.ts`
- `src/lib/experience-flags.ts`
- `src/lib/thinking-games/server/catalog.ts`
- `src/lib/thinking-games/server/release-manifest.ts`
- `supabase/migrations/202610210001_thinking_games.sql` (lines 1-750, 140-225, 395-540, 647-740)
- `supabase/preflight/202610210001_thinking_games.verify.sql`
- `supabase/rollbacks/202610210001_thinking_games.rollback.sql`
- `scripts/promote-thinking-games-release.mjs`
- `content/thinking-games/pilot/pilot-manifest-v1.json`
- `content/thinking-games/manifests/release-365-v1.json`
- `content/thinking-games/fixtures/synthetic-release-manifest-v1.json`
- `content/thinking-games/manifests/synthetic-release-fixture-v1.approved.json`
- `tests/api/thinking-games-catalog.test.ts`
- `tests/unit/thinking-games/synthetic-release-fixture.test.ts`
- `tests/unit/thinking-games/helpers.ts`