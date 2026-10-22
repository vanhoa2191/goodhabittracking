# Production Release Path Audit - Final Report

**Task ID**: task_db3d05dcf597
**Coordinator Terminal**: term_b80d428c-77ec-4f4c-9095-15d3cb960df8
**Dispatch ID**: ctx_9c1df4e496c5
**Status**: COMPLETE - Read-only audit finished
**Scope**: 3 narrow areas only (server flags master, thinking-games catalog/response/profile guards, SQL start/parentstart version choice + candidate/release validator tooling)
**Nature**: Ready-to-implement technical handoff. NOT an approval, NOT implemented code.

## 1. Executive Summary

A read-only audit of the production release path for the thinking-games feature was conducted across three areas: the server experience-flag master, the thinking-games server catalog/response/profile guards, and the SQL `thinking_game_start` / `thinking_game_parent_start_as` content-version choice plus the existing candidate/release-validator tooling. The audit confirms the known reader findings and adds precise file:line triggers: all pilot-class flags are structurally `false` under `NODE_ENV=production` (`src/lib/server-features.ts:26-37`), the release catalog admission path never runs the release profile validator nor requires a human `editorialApproval` signature (`src/lib/thinking-games/server/catalog.ts:29-33`), and both start RPCs pin content by an unhashed literal `'pilot-2026-10-21'` rather than a trusted server-managed version (`supabase/migrations/202610210001_thinking_games.sql:477` and `:683-690`). Nothing is left to implement in this report itself; the remaining work is the seven-file least-change implementation listed in §7 plus the nine test cases in §8, both of which are **not** performed here, and the outstanding real-human editorial review of the 2920 candidate items, which no synthetic fixture may substitute for.

## 2. Audit Method and Boundaries

- Read-only. Only file written by this task: this report
  (`plans/261021-daily-thinking-games/execution/cline-release-path-audit.md`).
- No app/source/SQL/test/content/flag writes, no activation, no publishing, no data approval.
- No model probes, no paid models, no Codex, no native workers. Single-reader collection.
- Working tree is dirty and shared with other active agents (`git status` shows modified
  `src/lib/server-features.ts`, `src/lib/experience-flags.ts`, `supabase/schema.sql`,
## 3. Area 1 - Server Experience-Flag Master

**File**: `src/lib/server-features.ts` (38 lines, read in full)

### 3.1 PASS - flags default off, pilot class structurally off in production

- `:3` `enabledFlagSchema` = `z.enum(['true','false']).default('false')` -> every flag is off unless
  explicitly set to the string `'true'`.
- `:26` `const unsafeDevelopmentFeaturesAllowed = parsed.NODE_ENV !== 'production';`
- `:29-36` all four thinking-games flags are ANDed with that boolean:
  `thinkingGamesPilotEnabled`, `thinkingGamesBonusEnabled`,
  `thinkingGamesServePilotContentEnabled`, `thinkingGamesInternalCatalogEnabled`.
- `:5-13` `NODE_ENV` itself defaults to `'development'` when unset (`:6`), so an unset env in a
  deployed container behaves as development. That is a deployment-hygiene risk, not a feature bug,
  but it means "production off" is enforced by *configuration correctness*, not by the code alone.

**Consequence (confirmed)**: with `NODE_ENV=production` the only reachable thinking-games profile is
the release profile in `catalog.ts`, and the pilot manifest is unreachable. This is the desired
default and must be preserved by the proposal in §7.

### 3.2 GAP G1 - no production-eligible release enablement master

- **File:line**: `src/lib/server-features.ts:26-37`
- **Trigger**: operator sets `NODE_ENV=production` and wants the thinking-games feature (or its
  bonus slot) enabled for real families.
- **Current behavior**: every thinking-games flag resolves to `false`. `ENABLE_THINKING_GAMES_BONUS`
  and `ENABLE_THINKING_GAMES_PILOT` can never take effect in production.
- **Expected behavior**: a distinct, clearly-named **release** master flag (default OFF) that may be
  enabled in production only after human editorial approval; the pilot-class flags stay non-production
  only, permanently.

### 3.3 PASS - response helper and status envelope

**File**: `src/lib/thinking-games/server/response.ts` (31 lines, read in full)

- `:3-20` `thinkingGameResponseSchema` is a discriminated union on `ok`; success arm requires
  `schemaVersion: 'v1'` and one of
  `available|started|finished|retry|paused|bonus_locked|bonus_not_eligible|bonus_pending_approval|bonus_quiet_hours|duplicate|journey_complete`;
  failure arm requires `code` + `messageKey`.
- `:24-27` `success()` and `:29-31` `failure()` are the single envelope builders used by every route.
- No caller-supplied `won`/seed/version appears in the envelope; `data` is server-computed.

**PASS note**: the envelope has no field through which a browser could express "which version" or
"which seed" - the version must therefore be pinned server-side, which is exactly what §5 shows is
missing.

### 3.4 PASS - client-facing routes do not accept seed/profile/version

- `src/app/api/child/thinking-games/start/route.ts:12-16` input schema is exactly
  `{ slot, expectedLocalDay, commandId }` - no `contentVersion`, no `seed`, no `ageTrack`,
  no `profile`, no `dayIndex`.
- `:27-32` the RPC call passes only `session_token_hash`, `p_slot_type`, `p_expected_local_day`,
  `command_id`. `createAdminSupabaseClient()` (service role) is used, and the session token is

## 4. Area 2 - Thinking-Games Server Catalog / Profile Guards

**File**: `src/lib/thinking-games/server/catalog.ts` (61 lines, read in full)

### 4.1 PASS - two-profile admission exists and is mutually exclusive

- `:22-34` `getThinkingGameCatalog()`:
  - `:23` reads `getServerFeatures()` (server-only, env-derived).
  - `:24-28` **internal-pilot branch** (only reachable when `thinkingGamesInternalCatalogEnabled`,
    which is non-production only per §3.1): loads `content/thinking-games/pilot/pilot-manifest-v1.json`,
    requires `manifest.isPilotFixture === true` and `items.length > 0`, else `catalog_unavailable`.
  - `:29-33` **release branch**: loads `content/thinking-games/manifests/release-365-v1.json`, rejects
    if `isPilotFixture` is true, `items.length === 0`, or **no item has `status === 'approved'`** ->
    `catalog_not_approved`.
- `:10-12` `CatalogAdmission` is a discriminated union on `ok` with codes
  `catalog_unavailable | catalog_not_approved` - a caller cannot read a manifest unless admission
  succeeded, and cannot fabricate a profile.
- `:14-20` `loadManifest()` resolves the directory by exact filename (`pilot-manifest-v1.json` ->
  `content/thinking-games/pilot`, everything else -> `content/thinking-games/manifests`) and runs
  `parseManifest` (zod schema) on the raw file. Filename is not user input.

### 4.2 GAP G2 - release admission never runs the release validator

- **File:line**: `src/lib/thinking-games/server/catalog.ts:29-33`
- **Trigger**: any production request while `release-365-v1.json` contains items with
  `status === 'approved'` but violates release semantics.
- **Current behavior**: admission returns `{ ok: true, profile: 'release' }`. `parseManifest` only
  validates the zod shape (`src/lib/thinking-games/schema.ts`); it does **not** run
  `validateManifest(..., { profile: 'release' })`.
- **Expected behavior**: release admission must be gated by the *existing* release validator.
  `src/lib/thinking-games/manifest.ts:403-438` `validateManifest` and `:460-466`
  `assertReleaseManifest` already exist and already enforce, for `profile: 'release'`:
  - `isPilotFixture === false` (`:418-424`, and `release_pilot_fixture` at `:314`)
  - `spacingException === null` (`:315`)
  - `minFormatSpacingDays >= 7` (`:316-318`)
  - `coverage` = 365 days / 2 slots / 24 typeIds / 96 variantPairs (`:319-329`)
  - **`manifest.editorialApproval` non-null - "human approval is required"** (`:330-332`)
  - item count = 365 x 2 x ageTracks x locales (`:333-336`)
  - 24 typeIds / 96 variantPairs / 8 skills / 0 equal-skill days (`:337-340`)
  - every item `status === 'approved'` **and** `item.editorial` present (`:350-352`)
  - per ageTrack x locale: days exactly 1..365, two slots per day, main != bonus skill,
    rolling 358/358 coverage, spacing >= declared minimum (`:369-399`)
- **Smallest change**: reuse `validateManifest` (already exported from
  `src/lib/thinking-games/manifest.ts`) inside `getThinkingGameCatalog()`. No new table, no new
  dependency, no new framework.

### 4.3 GAP G3 - the human-review signature that production actually needs is not checked

- **File:line**: `src/lib/thinking-games/server/catalog.ts:30`
- **Trigger**: a release manifest whose items are `approved` but whose `editorialApproval` is `null`
  (exactly the shape produced by `scripts/generate-thinking-games-candidates.mjs:347`,
  `editorialApproval: null`, and `:349`, `status: 'pending_human_review'`).
- **Current behavior**: the `some(status === 'approved')` check is the *only* approval gate; a
  hand-edited manifest could flip one item to `approved` and be admitted without any editorial
  approval record.
- **Expected behavior**: release admission requires `manifest.editorialApproval !== null`
  (the existing manifest-level human-review record) in addition to per-item `status`,
  so "approved" cannot be asserted without a recorded human sign-off.

## 5. Area 3 - SQL Start / Parent-Start Version Choice

**File**: `supabase/migrations/202610210001_thinking_games.sql` (1099 lines; the start paths read
in full, other functions sampled)

### 5.1 GAP G5 (CRITICAL) - child start pins a hardcoded pilot content_version

- **File:line**: `supabase/migrations/202610210001_thinking_games.sql:477-484`
  ```sql
  select * into c from public.thinking_game_content
    where content_version='pilot-2026-10-21'
      and day_index=(case when p_slot_type='bonus' then snap.journey_day_index else journey.next_day_index end)
      and thinking_game_content.slot_type=p_slot_type
      and (status='approved' or (status='design_only'
        and (current_user='service_role'
          or current_setting('request.jwt.claim.role', true)='service_role')))
      and age_track = public.thinking_game_resolve_age_track_for_child(s.child_id, s.family_id)
      and locale='vi' limit 1;
  ```
- **Trigger**: production deployment of `202610210001_thinking_games.sql` with any
  `thinking_game_content` rows carrying `content_version = 'pilot-2026-10-21'` and
  `status = 'approved'`.
- **Current behavior**: the DB serves the **pilot** version to production children, regardless of
  which manifest `catalog.ts` admitted. The Node catalog and the DB catalog are two independent
  selectors that can disagree - the exact "DB latest version independent of the Node manifest
  chooses a different version -> wrong slot pin" hazard called out in the brief.
- **Expected behavior**: content selection must be bound to the *same* trusted release version the
  server admitted, with the version pinned by the server (not chosen by the browser and not
  implicitly "whatever the DB has").

### 5.2 GAP G6 (CRITICAL) - parent start has no version pin at all

- **File:line**: `supabase/migrations/202610210001_thinking_games.sql:683-690`
  ```sql
  select * into c from public.thinking_game_content
    where day_index=snap.journey_day_index
      and slot_type=p_slot_type and thinking_game_content.age_track=selected_track and locale='vi'
      and (status='approved' or (status='design_only'
        and (current_user='service_role'
          or current_setting('request.jwt.claim.role', true)='service_role')))
      order by md5(target_child_id::text || ':' || server_day::text || ':' || p_slot_type || ':' || content_version || ':' || id)
      limit 1;
  ```
- **Trigger**: the table contains more than one `content_version` for the same
  (day, slot, age_track, locale) - which the schema explicitly permits, because
  `thinking_game_content` has `unique (content_version, day_index, slot_type, age_track, locale)`
  (`:57`), i.e. the version is *not* part of a global uniqueness key.
- **Current behavior**: the chosen row is decided by `md5(child:day:slot:content_version:id)` - a
  hash-based lottery across every version present in the table, including old/unreleased ones. The
  row the parent gets can differ from the row the child RPC would have taken, and both can differ
  from the manifest `catalog.ts` admitted.
- **Expected behavior**: the same server-pinned trusted release version must be used by child start,
  parent start, and the bonus sync path, so that a given (day, slot, track) resolves to exactly one
  content row everywhere.

### 5.3 GAP G7 - bonus sync pins the same pilot literal

- **File:line**: `supabase/migrations/202610210001_thinking_games.sql:202-206`
  (`sync_thinking_game_bonus_for_child`): `where content_version='pilot-2026-10-21' ... and
  status='approved' and locale='vi'`.
- **Trigger**: bonus entitlement creation on a production day.
- **Current behavior**: bonus content comes from the pilot version, again independent of the admitted
  release manifest; if that version has no `approved` row the result is `content_unavailable`.
- **Expected behavior**: same trusted version as §5.1/§5.2.
### 4.4 PASS - pinned-content re-admission on finish/pause

- **File**: `src/lib/thinking-games/server/content-row.ts:26-38` `pinnedContentFromAttempt` reads
  attempt -> entitlement -> content exactly as PostgREST returns it, and requires
  `entitlement.content_id` / `entitlement.content_version` to be strings.
- `:47-89` `puzzleItemFromContentRow` re-derives the full `PuzzleItem` from the canonical DB row
  (`public_payload` for the child-visible projection, `grading_payload` for the private solution),
  throwing if `content.id`/`content.content_version` disagree with the pinned entitlement
  (`:49-51`), if a payload is missing (`:52-54`), if `checker_id` and
  `grading_payload.validSolutionPredicate` disagree (`:62-64`), or if the solution/checker is
  absent (`:65-69`).
- `src/lib/thinking-games/server/catalog.ts:55-61` `admitsPinnedItem` requires the pinned item's
  `id` + `fingerprint` + `contentVersion` to exist in the admitted manifest with the profile's
  expected status (`design_only` for internal-pilot, `approved` for release).

**PASS note**: this is the mechanism that makes "an existing attempt after a manifest upgrade stays
unchanged" true at the *content* level - the attempt keeps its own pinned `content_id`/
`content_version`, and finish/pause re-derive from the DB row rather than re-selecting from the
catalog. The gap is only in the *initial* selection (§5).
  hashed server-side (`:28`).
- `src/app/api/domain/thinking-games/start/route.ts:25-27` passes
  `actor_user_id`, `target_child_id`, `p_slot_type`, `p_expected_local_day`, `command_id` - again
  no version/seed parameter.
- `src/app/api/child/thinking-games/finish/route.ts` + `src/app/api/domain/thinking-games/finish/route.ts`
  grade server-side and re-check admission via `admitsPinnedItem` (see §4.4).

**PASS note**: the browser genuinely cannot select seed/profile/version/won today. The residual risk
is entirely server-side (which version the server picks).
  `src/components/KidDashboard.tsx`, `src/components/ParentSettingsTab.tsx`, plus untracked
  `content/`, `private/`, `scripts/check-thinking-games-*.mjs`, `scripts/generate-thinking-games-candidates.mjs`,
  `scripts/thinking-games-sql-fixture.mjs`, and the `src/app/api/**/thinking-games/**` routes).
  Findings below are a **timestamped read** of that tree and may be superseded by concurrent
  edits; they are not final acceptance of the feature.
- Line numbers refer to the tree as read during this audit (HEAD `9db0c94`, branch `fix/ui-polish`).


## 7. Current Confirmed Gaps (Consolidated)

| ID | File:Line | Trigger | Expected Behavior | Smallest Existing Helper to Reuse |
|----|-----------|---------|-------------------|----------------------------------|
| G1 | `src/lib/server-features.ts:26-37` | Operator runs `NODE_ENV=production` and needs the feature on for real families | A production-eligible master flag (default OFF) gated on human editorial approval | Reuse the existing `unsafeDevelopmentFeaturesAllowed` pattern and `getServerFeatures` |
| G2 | `src/lib/thinking-games/server/catalog.ts:29-33` | Any prod request, manifest admits without semantic checks | Run `validateManifest(manifest, { profile: 'release' })` before returning `{ ok: true, profile: 'release' }` | `validateManifest` already exported from `src/lib/thinking-games/manifest.ts` |
| G3 | `src/lib/thinking-games/server/catalog.ts:30` | Manifest items marked `approved` but no editorialApproval | Require `manifest.editorialApproval !== null` in addition to per-item `status` | `ThinkingGamesManifest.editorialApproval` already parsed in schema (`:330-332`) |
| G4 | `src/lib/thinking-games/server/catalog.ts:29` (and `:14-20`) | On-disk `release-365-v1.json` edited/rewritten | Pin trusted manifest digest (or DB version row); fail closed if mismatch | `inputSha256` already computed in `scripts/check-thinking-games-candidates.mjs:683` is a precedent |
| G5 | `supabase/migrations/202610210001_thinking_games.sql:477` | Child start RPC with pilot-content rows present | Select by server-pinned trusted release version, not `'pilot-2026-10-21'` | Introduce a single trusted constant / SQL variable set from the catalog admission path (no new table) |
| G6 | `supabase/migrations/202610210001_thinking_games.sql:683-690` | Parent start RPC with multiple versions in the table | Same trusted version as child start; deterministic single-row resolution | Reuse `thinking_game_lock_key(child_id)` + `admitsPinnedItem` pattern (no new lock namespace) |
| G7 | `supabase/migrations/202610210001_thinking_games.sql:202-206` | Bonus sync runs in prod | Same trusted version as above | `sync_thinking_game_bonus_for_child` already reuses the lock + bonus gating pattern |
| G8 | `scripts/` (none exists) | Candidate set reviewed by humans, needs import to release | A promotion script that verifies a human sign-off hash and writes the release manifest with `editorialApproval` populated + all items `approved` | Reuse `manifest.ts` `validateManifest`/`assertReleaseManifest` + `generate-thinking-games-candidates.mjs` `sha256` helper (no new framework) |


## 6. Area 4 (supporting) - Candidate / Release Validator Tooling

**File**: `scripts/generate-thinking-games-candidates.mjs` (397 lines, read in full)

- `:13` `contentVersion = 'p07-candidates-365-v1'`; `:11` `candidateRoot =
  content/thinking-games/candidates/365-v1`.
- `:331-350` the generated manifest is explicitly `isPilotFixture: false`, `editorialApproval: null`,
  `status: 'pending_human_review'`, `minFormatSpacingDays: 7`, `coverage = {365, 2, 24, 96}`.
- `:357-367` `candidate-meta-v1.json` records `candidateAuditProfile: 'p07-candidate-v1'` and
  `releaseProfile: 'not-release-selectable'`.
- `:19-25` five batches covering days 1-365; `:38-43` the CSV encodes four age codes
  (`35` = age_3_5, `68` = age_6_8, `912` = age_9_12, `13p` = age_13_plus).

**File**: `scripts/check-thinking-games-candidates.mjs` (737 lines, sampled)
- `:20` `INITIAL_TRACKS = new Set(['age_6_8','age_9_12'])` - the initial release scope is exactly
  the two initial tracks; `:21-22` alternate/required type sets.
- `:655-659` asserts `manifest.coverage` = 365/2/24/96, `meta.sourceHash === editorial.csvHash`
  (hash binding of the source CSV), and `manifest.manifestVersion === contentVersion`.
- `:683` records `inputSha256: sha256(readFileSync(manifestPath))` - a manifest digest is already
  produced by tooling, so the "pin the trusted digest" proposal (§7.4) has a precedent to reuse.
- `:676-694` writes a catalog audit with `catalogChecks`, `releaseRejection`, and a `fail` /
  `review_blocked_quality` / `pass_with_review_warnings` status ladder.

**File**: `scripts/check-thinking-games-content.mjs` (114 lines, read in full)
- `:93-98` runs `validateManifest(pilot, {profile:'pilot'})`,
  `validateManifest(pilot, {profile:'release'})` and `validateManifest(release, {profile:'release'})`.
- `:100-108` the expected outcome is asserted: editorial ok, pilot ok, pilot-as-release **not** ok,
  release-placeholder **not** ok with a `release_item_count` error; otherwise exit code 1.
- **PASS**: the release gate already rejects the unreviewed candidate set. The tooling's job at
  release time is to *prove* rejection, not to approve.

**GAP G8 - there is no promotion/import step that can produce a human-approved release manifest.**
No script exists that (a) takes a reviewed candidate set, (b) verifies a human sign-off hash, and
(c) writes `content/thinking-games/manifests/release-365-v1.json` with `editorialApproval`
populated and all items `approved`. The promotion step is therefore undefined, which is why §7.6
proposes one - and why it must refuse to run without an actual human artefact.

**Content state (from the reader findings, re-confirmed against tooling, not re-generated)**
- The real candidate set is **2920 real items still `design_only` / unreviewed** and MUST remain
  rejected. No synthetic "approved" payload may be produced for real content, and no human
  signature may be fabricated.
- The four technical candidate tracks `age_3_5` / `age_13_plus` are **not** in the initial
  production advertisement: the release contract is exactly `age_6_8` + `age_9_12`
  (`manifest.ts:279-281` for the pilot profile asserts exactly those two tracks and `:281-284`
  asserts `locales.length === 1 && locales[0] === 'vi'`; the release profile computes the expected
  item count as `365 * 2 * ageTracks.length * locales.length`, `manifest.ts:333`). The
  `age_track` CHECK constraint on the DB table is also exactly
  `('age_6_8','age_9_12')` (`supabase/migrations/202610210001_thinking_games.sql:48`).
- Synthetic **test** fixtures (clearly marked as such) are acceptable for proving the path in
  §8, but they must live only under a test/fixture namespace and must never be loaded by
  `catalog.ts` on the serving path.

### 5.4 PASS - the design_only pilot exemption is correctly scoped to service_role

- `:480-482` and `:686-688`: `status='design_only'` is only admitted when
  `current_user='service_role'` **or** `request.jwt.claim.role='service_role'`. A browser
  (`anon`/`authenticated`) can never receive a `design_only` row through these RPCs.
- `:897-926` grants: `revoke all` on the thinking-game functions from `public, anon, service_role`,
  then `grant execute`:
  - `thinking_game_start(text,text,date,uuid)` -> `anon, authenticated` (`:926`) - the child RPC is
    session-token addressed, not `authenticated`-role addressed, and it validates the session row
    itself.
  - `thinking_game_parent_start_as(uuid,uuid,text,date,uuid)`, `thinking_game_parent_pause_as`,
    `thinking_game_parent_finish_as` -> `service_role` only (`:919-922`).
  - `thinking_game_finish_verified(text,uuid,boolean,jsonb,uuid)` -> `service_role` only (`:923`).
  - `thinking_game_preview_day`, `thinking_game_parent_state_as` -> `service_role` only (`:915-918`).
- `thinking_game_start` at `:394-396` resolves the session from `device_sessions` by
  `token_hash`, requiring `revoked_at is null`, `expires_at > now()` and `'child:read' = any(capabilities)`,
  raising `session_invalid` otherwise. The parent's `actor_user_id` is *not* client-chosen: the
  route passes `parent.user.id` from the server session, and `:627-630` re-derives the family with
  `act_as_user` + `current_family_id()` + `can_manage_family()` and raises `family_manage_required` otherwise.
- **PASS note**: no public client can select seed/profile/version/won; the only remaining version
  hazard is server-side (§5.1-§5.3).

### 5.5 PASS - family/session auth precedes the per-child lock

- `thinking_game_start`: `:394-396` session resolution -> `:397` pending settings -> **`:398`
  `pg_advisory_xact_lock(thinking_game_lock_key(s.child_id))`** -> `:399` settings read.
- `thinking_game_parent_start_as`: `:627-630` `act_as_user` + family/manage check -> `:631` child
  belongs to family -> **`:632` `pg_advisory_xact_lock(thinking_game_lock_key(target_child_id))`**
  -> `:633-634` settings.
- `thinking_game_state`: `:365-367` session -> `:368` settings -> **`:373` lock**.
- `thinking_game_lock_key(uuid)` is defined at `:275-279` and revoked from
  `public, anon, authenticated` at `:279`.
- **PASS note**: the existing namespaced per-child advisory lock is already in place and is reused
  as-is by the proposal in §7. No new lock namespace is needed.

### 5.6 PASS - ordering/consistency hazards are already handled where they can be

- `thinking_game_start` takes the entitlement for (child, day, slot) first (`:426-435`) and, if it
  exists and is not `granted`, returns the existing `entitlementId`/`attemptId` without re-pinning
  content (`:426-435`). An attempt started before a manifest upgrade therefore keeps its original
  `content_id`/`content_version` (`update ... content_id=c.id, content_version=c.content_version`
  only runs in the `state='granted'` branch, `:486-495`).
- `thinking_game_day_snapshots` (`primary key (child_id, local_day)`, `:40`) freezes
  `journey_day_index` per child per day, so the day index a bonus refers to cannot drift
  mid-day.
- `thinking_game_rollover_child` (`:312-333`) expires prior-day entitlements and abandons
  prior-day attempts at the day boundary.

### 5.7 PASS - the RPC layer cannot be used to bypass the global flag

- The global enablement for the family lives in `public.thinking_game_settings.enabled`
  (`:3-15`, default `false`), enforced in SQL at `:404-410` (`feature_off`) and `:635`
  (`feature_off`) - i.e. the DB has its own default-off gate independent of the Node env flags.
- `:404-409` additionally raises `feature_off` for a never-confirmed settings row
  (`settings_version = 1 and effective_from_local_day = server_day and pending_settings is null`).
- **PASS note**: the family-level gate is enforced in the DB, so a raw public RPC call cannot mint a

## 8. Least-Change Proposal (Not Implemented - Read-Only Audit)

The following are **recommended changes, not implemented here**. Every recommendation reuses
existing infrastructure and satisfies all constraints in §2: no new table/framework/dependency,
no client-side version/seed/won selection, family/session auth before locks, reuse of the existing
namespaced per-child lock, default-off production master flag, existing helpers preferred over new
private RPCs, real-content 2920 items remain `design_only`, no fabricated human signatures, and
synthetic fixtures only prove the path - they never generate approved actual payloads.

### 8.1 Add a production-eligible release master flag

**File**: `src/lib/server-features.ts`

Add `ENABLE_THINKING_GAMES` (or `ENABLE_THINKING_GAMES_RELEASE`) to `serverFeatureEnvironmentSchema`
(default `'false'`), add `thinkingGamesReleaseEnabled` to `ServerFeatures`, and gate it with
`unsafeDevelopmentFeaturesAllowed` just like the pilot flags. The existing per-flag `false` default
and `NODE_ENV !== 'production'` gating are preserved; nothing enables pilot content in production.
No existing flag changes; only additive. The caller path (`catalog.ts:23`) can additionally require
`thinkingGamesReleaseEnabled` before admitting the release profile, with `thinkingGamesInternalCatalogEnabled`
remaining the sole path to pilot content - so internal pilots stay non-production only.

### 8.2 Gate release admission on the existing release validator + editorialApproval

**File**: `src/lib/thinking-games/server/catalog.ts`

Inside the release branch (`:29-33`), after loading the manifest, add:
1. `validateManifest(manifest, { profile: 'release' })` - if `!ok`, return `{ ok: false, code: 'catalog_not_approved' }`.
2. `manifest.editorialApproval !== null` - if null, return `{ ok: false, code: 'catalog_not_approved' }`.
3. Keep the existing at-least-one-`approved` check (`:30`).

Reuses `validateManifest` from `src/lib/thinking-games/manifest.ts`; no new file, no new table.

### 8.3 Pin the trusted release manifest digest

**File**: `src/lib/thinking-games/server/catalog.ts` (or a new constant module)

Store the SHA-256 of the human-approved `release-365-v1.json` as a constant. After `loadManifest`,
compute `sha256(JSON.stringify(manifest))` (or hash the raw file bytes) and compare to the constant;
if mismatch, return `catalog_not_approved`. Precedent: `scripts/check-thinking-games-candidates.mjs:683`
already computes `inputSha256` for the manifest. A private module-level helper (`getManifestDigest`)
is preferred over a new private RPC - this is pure server-side code already imported by the route.

### 8.4 Replace the hardcoded pilot literal in both start RPCs

**File**: `supabase/migrations/202610210001_thinking_games.sql`

- `:477-484` `thinking_game_start`: replace `content_version='pilot-2026-10-21'` with a trusted
  server-managed version (e.g. a SQL `DECLARE`/`SELECT` of the pinned version from a single source
  of truth within the migration, or pass `content_version` as an additional RPC parameter validated
  server-side against `thinking_game_content` row `status='approved'` AND matching the admitted
  catalog). The version must never come from the client.
- `:683-690` `thinking_game_parent_start_as`: remove the `md5(...content_version...)` lottery;
### 8.6 Constraints honored (checklist)

- No writes/activation/publishing/dataapproval: this is a proposal only; §9 confirms none performed
- No unnecessary new dependency/table/framework: all helpers already exist (`validateManifest`,
  `getServerFeatures`, `thinking_game_lock_key`, existing grant pattern)
- Never public client selects seed/profile/version/won: all RPCs `security definer` + `set search_path = ''`;
  version server-pinned (§8.4)
- Family/session auth before locks: `:394-400` then `:398`; `:627-632` then lock (§5.5)
- Existing namespaced per-child lock: `thinking_game_lock_key(child_id)` reused (§5.5)
- Smallest existing helper reuse vs new private RPC: `validateManifest` (§8.2), `sha256` (§8.3),

## 9. Test Proposal (Not Implemented - Read-Only Audit)

Nine negative/positive cases prove the path without touching real content:

| # | Case | Expected | File pattern |
|---|------|----------|--------------|
| T1 | **Negative prod unreviewed denied**: `NODE_ENV=production`, no `editorialApproval` | `catalog_not_approved`, HTTP 409 | `catalog.ts` + route |
| T2 | **Negative internal flag denies before mint**: pilot flag off | child RPC `content_unavailable` / `feature_off` | `server-features.ts` |
| T3 | **Negative client tamper denies**: browser supplies `content_version` param | RPC ignores; server-pinned only | SQL start RPC |
| T4 | **Positive synthetic approved release**: synthetic manifest with `editorialApproval` + `approved` items | catalog admission ok | `catalog.ts` test |
| T5 | **Negative unknown/missing version**: `thinking_game_start` with non-existent version | `content_unavailable` | SQL RPC |
| T6 | **Existing attempt after manifest upgrade unchanged**: started entitlement keeps `content_version` | entitlement unchanged | `thinking_game_start` test |
| T7 | **Strict promotion rejects wrong hash**: manifest digest mismatch | promotion script exits non-zero | `scripts/promote-*.mjs` |
| T8 | **Strict promotion rejects missing human review**: `editorialApproval: null` | promotion script exits non-zero | `scripts/promote-*.mjs` |
| T9 | **All real candidates still `design_only`**: no `approved` real items in candidate manifest | validated by `check-thinking-games-candidates.mjs` | tooling |

All tests use synthetic fixtures under a test/fixture namespace; none produce approved actual
payloads for real content.

## 10. Conclusion

The production release path is **not production-ready**. Eight confirmed gaps block production
enablement:

- **G1** (`server-features.ts:26-37`): pilot-class flags permanently off in production with no
  production-eligible release master flag.
- **G2** (`catalog.ts:29-33`): release admission never runs `validateManifest` or checks
  `editorialApproval`.
- **G3** (`catalog.ts:30`): only `status === 'approved'` is checked, no human-review signature.
- **G4** (`catalog.ts:29`, `:14-20`): manifest loaded by filename only, no digest pin.
- **G5/G6/G7** (SQL `:477`, `:683-690`, `:202-206`): hardcoded pilot literal / version lottery
  in child start, parent start, and bonus sync.
- **G8**: no promotion tooling exists to import human-reviewed content.

The existing infrastructure is sound: two-profile admission, role grants, per-child advisory lock,
family/session auth before locks, `validateManifest` with full release semantics, and
`admitsPinnedItem` re-admission on finish/pause. The proposal in §8 reuses every one of these
without new tables, dependencies, or frameworks. Implementation plus real-human editorial review
of the 2920 candidate items is required before production activation; neither is part of this
read-only audit.

## 11. Operator Steps (Future - NO ACTION TAKEN)

Nothing was activated, built, deployed, or published by this audit. The following describes what a
future operator would do **after** the §8 implementation lands and **after** a real human editorial
review produces a signed manifest:

1. **Config**: set `NODE_ENV=production`; set `ENABLE_THINKING_GAMES=true` only once the release
   manifest is human-approved and pinned. Leave `ENABLE_THINKING_GAMES_PILOT`,
   `ENABLE_THINKING_GAMES_SERVE_PILOT_CONTENT`, `ENABLE_THINKING_GAMES_INTERNAL_CATALOG` unset -
   they are non-production only and must stay off in production.
2. **Content**: run `scripts/promote-thinking-games-release.mjs` with the real human approval hash
   and signature to produce `content/thinking-games/manifests/release-365-v1.json`, then update the
   pinned digest constant. Until this step runs with a real signature, production must serve
   `catalog_not_approved`.
3. **Build**: `npm run build` with `NODE_ENV=production`; the build must show the release manifest
   admitted (catalog test green) and the pilot paths unreachable.
4. **DB**: apply a new migration replacing the hardcoded `'pilot-2026-10-21'` literal in
   `thinking_game_start`, `thinking_game_parent_start_as` and `sync_thinking_game_bonus_for_child`
   with the trusted version pin. Preflight (`supabase/preflight/202610210001_thinking_games.verify.sql`)
   and the rollback (`supabase/rollbacks/202610210001_thinking_games.rollback.sql`) must be updated
   together with it.
5. **Deploy**: ship the Node build and the migration. **Rollback** = revert the migration (or
   re-pin the previous trusted version) and set `ENABLE_THINKING_GAMES=false`; existing attempts
   keep their pinned `content_id`/`content_version` and remain finishable because finish/pause
   re-derive from the DB row (§4.4, §5.6).
6. **Family rollout**: enable the feature per family through the existing
   `thinking_game_settings` path (DB-enforced default-off, §5.7).

**No step above was performed.** No flag was set, no content was written, no migration was applied,
no build was published.

---

*AUDIT COMPLETE - Read-only, no code changes made*
  `admitsPinnedItem` (§5.4), existing grants (§5.4) - no new RPCs

  filter by the same trusted version, then use `id` ordering for deterministic single-row selection.
- `:202-206` `sync_thinking_game_bonus_for_child`: same replacement for bonus content.

No new table: keep `thinking_game_content.unique (content_version, day_index, slot_type, age_track, locale)`;
the trusted version can be encoded as a migration-level constant or read from a small
`thinking_game_manifests` row if such a table already exists (it does not - reuse existing columns
instead).

### 8.5 Add content promotion tooling (must refuse without human artefact)

**File**: new script `scripts/promote-thinking-games-release.mjs` (smallest possible)

Requires:
- `--manifest` path to a candidate `candidate-manifest-v1.json`
- `--approval-hash` human sign-off hash (from the real editorial review process)
- `--editorial-signature` human signature blob

Verifies:
- `validateManifest(manifest, { profile: 'release' })` passes
- `manifest.editorialApproval` set to the provided signature/hash
- every item `status === 'approved'` with `editorial` present
- Writes `content/thinking-games/manifests/release-365-v1.json`
- Refuses to run (exit non-zero) if any real candidate item still `design_only`, or if no human
  signature is provided.

Synthetic test fixtures may use this script to prove the path; they never load onto the serving
path (`catalog.ts` only reads `release-365-v1.json` / `pilot-manifest-v1.json`).

  game for a family that has not enabled the feature. The Node-side release master (§3.2) is an
  *additional* product gate, not the only one.