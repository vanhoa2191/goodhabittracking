# P01 contracts — daily thinking games

Status: **R2 — KILO REWORK ITEMS RESOLVED; PENDING INDEPENDENT REVIEW**. Not implemented, not accepted, not migrated.
Contract version: `p01-2026-10-21-r2`.
Scope: planning/contracts only. No application source, SQL migration, dependency, commit, deploy or production change was made.

This document is the normative source for P02–P11. If a downstream plan or message disagrees with this file, this file wins until a newer contract version is published. A contract change requires a version bump and updates to every receiver.

## 1. Facts this contract is built on

Measured on 2026-10-21 from the current checkout:

| Fact | Measured value | Consequence |
| --- | --- | --- |
| Editorial CSV rows | 365 continuous days | Calendar structure only |
| Editorial slots | 730 (`D001-main`…`D365-bonus`) | Two slots per journey day |
| Distinct `type_id` values | 24 across both slots | 24 game mechanics, not 24 variants |
| Distinct `(type_id, rule_variant)` pairs | 96 | 24 mechanics × 4 rule variants |
| Main skill equal to bonus skill | 0 days | Design intent holds today |
| Main skill different from bonus skill | 365 days | Must remain true after any content change |
| Rolling 8-day skill coverage | 358/358 windows cover all 8 groups | Validator invariant |
| Minimum format spacing in CSV | 11 days | Production rule is ≥ 7 days |
| Playable approved payloads | 0 / 730 | 365-day content is **not** ready |
| CSV row status | `design_only` on every row | Cannot be released |
| Initial release ages | 6–8 and 9–12, Vietnamese (`vi`) only | 3–5 and 13+ are later milestones |
| Max if all four tracks ship | 730 × 4 = 2,920 payloads per locale | Not a pilot claim |

The Cline interim note that said `main_skill == bonus_skill` on all 365 days is **incorrect**; the explicit equal/different count is 0 equal / 365 different.

## 2. Versioning and ownership

| Artifact | Version | Owner | Changes |
| --- | --- | --- | --- |
| Plan | `plan-2026-10-21` | root coordinator | New plan version, not a silent edit |
| Contracts | `p01-2026-10-21-r2` | P01 contract owner | Kilo REWORK resolution; bump + notify all receivers |
| Content schema | `content-schema-v1` | P03/P07 owner | Bump for any field/meaning change |
| Content manifest | `manifest-v1` | P07 owner | New version per release batch |
| API | `v1` | P04 owner | Additive only within v1 |
| DB migration | proposed `20261021*_thinking_games.sql` | P04 owner | Not created in this task |
| Pilot fixture | `pilot-manifest-v1` | P05 owner | Explicit spacing exception |

No consumer may infer a version from a title, filename or seed. Versions are explicit fields.

## 3. Release scope

### 3.1 Initial release (pilot and first enablement)

- Locale: `vi` only.
- Age tracks: `age_6_8` and `age_9_12` only.
- Three game mechanics for the 7-day usability slice.
- Two slots per local day: `main` and `bonus`.
- One journey per child, 365 journey days maximum.
- Bonus requires the habit-day snapshot conditions in §7; it never unlocks essential future content.

### 3.2 Later milestones, explicitly not done

- Full 24 mechanics.
- 365 journey days × 2 slots × both initial age tracks.
- Age tracks `age_3_5` and `age_13_plus`.
- Additional locales; every released locale needs its own reviewed content.
- Four-track full year: at most 2,920 reviewed payloads per locale.

The initial 3-format/7-day pilot **must not** be reported as satisfying 24-format or 365-day coverage.

## 4. Authoritative local day

1. The family timezone is an IANA identifier stored in `thinking_game_settings.timezone`.
2. There is **no guessed default** for an existing family. A missing or invalid timezone keeps the feature off for that family (`timezone_required` / `timezone_invalid`).
3. The server computes the local day **inside SQL** from the database transaction clock:
   `local_day := (now() at time zone p_timezone)::date`.
   `now()` is the transaction-start instant, so every statement in one transaction sees the same day; `clock_timestamp()` is not used for day identity. The existing `src/lib/domain/local-date.ts` helper is display parity only and is **never** the authority for a grant, snapshot key, journey increment or cutoff.
4. An invalid IANA zone makes the SQL expression raise (`invalid_parameter_value` / `timezone not recognized`). P04 must catch that specific database error and map it to `timezone_invalid`; it must not fall through to `internal`. A missing setting is `timezone_required` and creates no snapshot.
5. Client date, device clock, browser timezone and `Date.now()` are never authority for a grant, a journey increment or a cutoff decision.
6. Client requests may send `expectedLocalDay` as an optimistic concurrency token. If it differs from the server day, the server returns `day_changed` and performs no mutation.
7. DST is handled by the IANA zone, never by adding 86,400 seconds to a timestamp. Both DST transitions are test cases.
8. Settings changes are effective on the **next** local day for: enable, timezone, cutoff, bedtime, age-track override. Disabling the feature takes effect immediately. This prevents a mid-day promise change.
9. A family that enables games for the first time gets no grant on the enable day; the first eligible day is the next local day.

## 5. Journey, snapshot and rollover

### 5.1 Journey cursor

- Each child has one journey cursor: `nextDayIndex` (starts at 1), `lastMainStartedLocalDay` (nullable).
- The index advances **only** on a successful `main` start for a local day later than `lastMainStartedLocalDay`.
- A `main` start **consumes the current `nextDayIndex` and then increments it**. `nextDayIndex` starts at 1 and is the next content index, one greater than the number of successful main starts; it is not a calendar mapping. If a child misses local days, the next main start still consumes the next content index; no content day is skipped and no content day is served twice.
- Reading the dashboard, reloading, opening a second tab, starting or finishing `bonus`, or resuming a paused attempt never advances it.
- Absence never resets or skips the cursor backwards. A child returning after a break continues from `nextDayIndex`.
- The maximum playable index is 365. After 365, the journey shows a completion state; no new content index is invented. A `main` start when `nextDayIndex > 365` returns `journey_complete` and creates no entitlement.

### 5.2 Day snapshot

A row in `thinking_game_day_snapshots` is unique on `(child_id, local_day)` and is created lazily by the first state/start request of that child for that local day.

The snapshot freezes for the whole local day:

- `local_day`, `timezone`, `settings_version`;
- `cutoff_at` (absolute timestamptz for the cutoff; resolves DST);
- `bedtime_start_at`, `bedtime_end_at` (absolute; bedtime may cross midnight);
- `enabled`;
- the ordered list of mandatory task ids with their `requires_approval` and title snapshot;
- `journey_day_index` used by any main start that day;
- `snapshot_at`.

Rules:

1. The snapshot is immutable. A later schedule edit, task add/remove, cutoff edit or timezone edit does not change it.
2. A task added after the snapshot is not part of that day's bonus condition.
3. A task removed/deferred after the snapshot stays in the snapshot but is marked `excused` only by an explicit parent action that records `excused_at`, `excused_by` and reason. Deferral is not completion.
4. If no snapshot exists and the feature is off, no snapshot is created.
5. `journey_day_index` for bonus content is `nextDayIndex` at grant time. Bonus play does not consume the index; a later main start uses the same index.

### 5.3 Rollover

- A new local day creates a new snapshot on first use. The old snapshot is retained read-only.
- An attempt belongs to the local day in which it started.
- On the first state/start/finish after rollover, an unfinished old attempt is closed as `abandoned_rollover` and cannot be resumed.
- A finish received for a rolled-over attempt returns `attempt_expired`; it does not grant a third slot, does not award points, and does not rewrite history.
- The client must replace all day state when it sees `day_changed`; it must not merge old and new entitlements.
- No grace period, no “one more game” after midnight.

## 6. Two slots and entitlement states

Exactly two slot keys exist per child/local day:

- `main` — independent of habit completion.
- `bonus` — conditional on the habit snapshot in §7.

Unique key: `(child_id, local_day, slot_type)`.

### 6.1 Entitlement state machine

```text
(none) --grant main--> granted --start--> started --finish--> finished
(none) --grant bonus--> granted --start--> started --finish--> finished
granted --revoke unused--> revoked_unused
started --revoke after use--> revoked_after_use
granted --local midnight--> expired
```

- `granted` is the only state that can start.
- `started` means an attempt exists; resume is the only start action.
- `finished` and `revoked_after_use` are terminal and preserve the attempt in history.
- `revoked_unused` blocks a re-grant for the same slot/day. It is not a punishment and is not shown as a failure to the child.
- `expired` is used at local midnight for an unused entitlement.
- There is no third slot and no retroactive make-up entitlement.

### 6.2 Main

- Eligible when the feature is enabled for the effective day, the family and local day are **not paused**, timezone is valid, the age track is resolved, approved content exists for the journey index, and the current time is outside the bedtime blackout.
- Pause blocks **new grants for both `main` and `bonus`**. A `start` during pause returns `paused` and creates no snapshot, entitlement or attempt. A `started` attempt may finish and save; a `granted` unused entitlement is not startable until the pause is lifted on the same local day, and otherwise expires at local midnight. Pause never rewrites an approved habit or an existing attempt.
- `main` is granted atomically with the first successful `start`; a mere dashboard read may show `available` without creating an entitlement.
- Twenty concurrent starts for the same child/day must produce one entitlement and one attempt.

### 6.3 Bonus

- Bonus is granted only by the atomic habit integration in §8.
- Bonus does not require the main attempt to have been played or won.
- Bonus content is independent, equal or easier difficulty, and never unlocks knowledge required by later days.
- Skipping bonus never reduces journey progress, stars or habit points.

## 7. Bonus condition, approval and `received_at`

For a child/local day, all of the following must be true:

1. A snapshot exists and the feature is enabled.
2. Every mandatory task in the snapshot is in a successful terminal state:
   - `completed` for a task that does not require approval, or
   - `approved` for a task that requires approval.
3. Every mandatory task's **server receipt time** is at or before `cutoff_at`.
4. No mandatory task is `rejected`, `pending_approval` or missing.
5. A bonus entitlement has not already been granted/used/revoked for that day.
6. The local day is still the snapshot day.

### 7.1 `received_at` versus review time (game-owned receipts)

P04 must add a game-owned receipt table; it must **not** rely on a guessed default or client value in the legacy `activity_logs` table:

```text
thinking_game_habit_receipts
  log_id uuid primary key
  child_id uuid not null
  local_day date not null
  activity_id uuid not null
  received_at timestamptz not null default now()
  reviewed_at timestamptz
  review_status text check (review_status in ('approved','rejected'))
  created_at timestamptz not null default now()
```

Rules:

- The completion RPC inserts the receipt in the **same transaction** as the `activity_logs` insert, writing `received_at = now()` explicitly. `now()` is the server transaction timestamp; clients never supply it. A duplicate completion (`on conflict do nothing`) does not create a second receipt.
- The review RPCs set `reviewed_at = now()` and `review_status` on the receipt for that `log_id` in the same transaction as the log status update. Review is never used for timeliness.
- `received_at` is the server receipt time for timeliness; `reviewed_at` is the server review time for audit. Neither is backdated, and neither is derived from the device clock.
- Bonus condition requires a receipt row **and** the current `activity_logs.status` to be `completed` or `approved`. If the log was hard-deleted by undo or the receipt is missing, the condition fails closed even if a stale client claims completion.
- Timeliness uses `received_at <= cutoff_at`, never `reviewed_at`.
- Approval uses the current `activity_logs.status = 'approved'`.
- A parent reviewing late does not remove timeliness. If the task was received before the cutoff and approved before the play window closes, bonus can unlock.
- If approval happens during the bedtime blackout, the entitlement may exist but is `quiet`/not invitable; the child sees the calm rest message. It is not backdated to the next day and no popup is shown.
- A review received after local midnight cannot unlock the previous day: the sync compares the current server local day to the snapshot day and fails closed when they differ.
- P04 preflight must assert: the table exists, `received_at` is `not null`, the completion path writes it, and no client role has `insert`/`update` on the receipt table. GWT-10/GWT-12 rest on this table, not on an assumed `activity_logs.completed_at` default.

The Kilo review's citation of `202609230001:39` is a citation error: that line is `secret_quests.completed_at` (the `secret_quests` table is created at `:32`), not an `activity_logs` column. The underlying R1 finding still stands because no repository migration creates `activity_logs`; this contract therefore stops asserting an unverifiable default and makes the game-owned receipt table the source of truth.

### 7.2 Reject, undo and revocation

- `reject` on a pending task is not success; it never grants bonus.
- Parent undo and child undo are allowed only for `completed` / `pending_approval` in the current RPCs; `approved` is terminal.
- If an undo removes a task after bonus was granted but before any bonus attempt started: the entitlement becomes `revoked_unused` in the same transaction.
- If an undo arrives after a bonus attempt started: the entitlement becomes `revoked_after_use`; the attempt and history are retained, no habit points are clawed back for the game, and no replacement bonus is granted that day.
- Game entitlement revocation never changes an approved habit log's status or points. Habit state and game entitlement are separate ledgers.
- **Accepted residual (habit tombstone):** P04 does **not** add a tombstone or rewrite the habit undo path. The current undo RPCs still hard-delete the `activity_logs` row. The compensating controls are: the game-owned receipt remains as audit, the entitlement becomes `revoked_unused`/`revoked_after_use`, approved habit state and points are never rewritten by game logic, and the sync fails closed when the log is gone. This residual must be re-reviewed if a later phase changes habit history.
- **PIN boundary:** parent game revoke/undo and settings mutations are PIN-gated when the family has a PIN, using the existing service-role `*_as` wrapper pattern. Child undo remains child-session scoped and cannot revoke a game entitlement for another child. No child-facing route can call a game revoke.

### 7.3 Empty, paused and deferred days

- A day with no mandatory tasks does **not** auto-grant bonus.
- A paused family or paused day blocks **new `main` and `bonus` grants**; `start` returns `paused` and creates no snapshot, entitlement or attempt. An attempt already `started` may finish and save; a `granted` unused entitlement is not startable until the pause is lifted on the same local day, and otherwise expires at local midnight. Pause never rewrites an approved habit or an existing attempt.
- A deferred task is not completed and cannot satisfy the bonus condition.
- A parent may explicitly excuse a snapshot task; only then is it removed from the condition. Excusal is audited and never presented as completion.

## 8. Atomic habit integration and common lock order

### 8.1 Required integration points

P04 must modify each existing habit mutation to call the same bonus-sync helper inside the same database transaction:

| Existing RPC | Required call timing |
| --- | --- |
| `complete_habit_command` (parent) | After the log insert/points update, before return |
| `complete_child_habit_command` (child device) | After the log insert/points update, before return |
| `undo_habit_command` (parent) | After the log delete, using the pre-delete child/day, before return |
| `undo_child_habit_command` (child) | After the log delete, using the pre-delete child/day, before return |
| `review_habit_command` (single approve/reject) | After the status/points update, before return |
| `review_habits_command` (batch) | **Once**, after the whole batch loop, never per item |
| Parent PIN wrappers (`*_as`) | No separate logic; they call the functions above |

The completion paths also insert the game-owned `thinking_game_habit_receipts` row (§7.1) in the same transaction, after the log insert and before return. The review paths update `reviewed_at`/`review_status` on that receipt. Undo does not delete the receipt.

The helper is `sync_thinking_game_bonus_for_child(child_id, local_day)`. It **reads habit rows** (`activity_logs.status`, game receipt times) and **writes only game tables** (`thinking_game_entitlements`, attempts, snapshots and receipt audit fields where explicitly stated). It must not change habit points, status or history. It must not be called by a background job to “catch up” a closed day.

Batch review must not grant bonus after the first approved item and then revoke it for a later item. One deferred sync after the batch produces one stable outcome.

### 8.2 Common lock order (binding)

All habit and game mutations that can touch bonus take this order:

1. `pg_advisory_xact_lock(thinking_game_lock_key(child_id))` for every involved child, in ascending `child_id` order. A batch takes all child locks before row locks.
2. `device_sessions` row for a child-session command.
3. `habit_activities` rows `FOR SHARE`, in `id` order.
4. `activity_logs` rows in `id` order.
5. `thinking_game_habit_receipts` rows by `log_id`/`activity_id` order (insert or update; never before the log row).
6. `child_profiles` rows in `id` order.
7. `thinking_game_settings` family row.
8. `thinking_game_day_snapshots` row.
9. `thinking_game_entitlements` in `(slot_type, id)` order.
10. `thinking_game_attempts` in `id` order.

**Exact advisory key (contract):**

```sql
create or replace function public.thinking_game_lock_key(p_child_id uuid)
returns bigint
language sql
immutable
strict
as $$
  select ('x' || substr(md5('thinking_games:' || p_child_id::text), 1, 16))::bit(64)::bigint
$$;
```

The key is a deterministic 64-bit value scoped to one child. It is `revoked` from `public`, `anon` and `authenticated`; only the owning `security definer` functions may call it. The ordering and child scope are contract.

**Lock semantics (R3):**

- The advisory lock is **unconditional** for the six habit RPCs and every game mutation that can touch bonus, even when the family has games disabled. It is taken before any row lock, in the same transaction. This prevents a disabled-game path from skipping the lock and inverting with an enabled path.
- The six RPCs (`complete_habit_command`, `complete_child_habit_command`, `undo_habit_command`, `undo_child_habit_command`, `review_habit_command`, `review_habits_command`) each take the lock themselves; the shared helper **does not** reacquire it. `*_as` wrappers call the same underlying function and add no separate logic.
- A batch takes every involved child lock in ascending `child_id` order before any row lock, then keeps logs-before-children. It calls the bonus sync once after the loop.
- The unconditional lock adds per-child serialization to the hottest habit path. P04 must measure it against AC13's performance budget and record the result; if the budget fails, the fix is a narrower key or a documented games-only gate, not an unreviewed conditional skip.
- `review_habit_command` and `undo_habit_command` read the target log's `child_id` without a lock, take the advisory lock, then lock the log — not the reverse.
- `complete_*` pre-check the unique `(activity_id, child_id, log_date)` key under the advisory lock, then lock the existing log if present, then child; they may then insert. This closes the current child-then-log inversion.
- Any function that cannot be made to follow this order cannot be enabled for bonus; the master flag stays off.
- The P04 SQL concurrency suite must prove no deadlock and one entitlement under 20 concurrent starts/reviews/undos.

## 9. Offline and retry

- Offline clients may show a previously assigned attempt and its cached payload.
- Offline clients may **not** create a server entitlement, grant a bonus, or advance the journey.
- An offline finish is stored in a local outbox with a stable `commandId` and retried when online. The server sets `received_at` at processing time; a queued habit completion cannot be backdated to the time the device was offline.
- A retry with the same `commandId` returns the original result. A retry with a different `commandId` for the same attempt is rejected as `already_finished`.
- If the retry arrives after local rollover, it returns `attempt_expired`; the UI says the attempt was not saved and offers the current day, not a replacement slot.
- Showing cached content without a server entitlement is allowed only for an attempt already assigned by the server. A cached catalog alone is never a right to play.
- Network failure after server commit is recovered by reading state and the command receipt; the client never guesses success.

## 10. Age and locale

- Initial release: `vi`, tracks `age_6_8` and `age_9_12`. From release-365-v3 (2026-10-30) all four tracks are served.
- Automatic track from server-known age:
  - age 3–5 inclusive → `age_3_5` (v3 onwards);
  - age 6–8 inclusive → `age_6_8`;
  - age 9–12 inclusive → `age_9_12`;
  - age 13 and over → `age_13_plus` (v3 onwards);
  - any other/unknown age → `age_track_unavailable`.
- A parent override (`thinking_game_child_settings.age_track_override`) wins over computed age. From release-365-v3 it may be any of the four tracks (v1/v2 allowed only the two initial tracks).
- No silent fallback to another track. No silent use of the existing theme `ageBandOverride`, which may be `teen`/`off` and has different meaning.
- An age-track change is effective the next local day and cannot change the content of a started attempt.
- 3–5 and 13+ are enabled from release-365-v3 (2026-10-30, see decision D28). The age resolver maps ages 3–5, 6–8, 9–12 and 13+ to their tracks; ages under 3 stay `age_track_unavailable`. A parent override may select any of the four tracks.
- The game copy is a peer voice, Vietnamese `mình – bạn`, including invite, tutorial, hints, retry, praise, explanation, pause, bedtime, offline, approval-wait and errors. It must not use adult-to-child “con/bé”. The habit flow copy is not silently rewritten by this feature.

## 11. Content model

### 11.1 Puzzle item schema (`content-schema-v1`)

Required fields:

- `schemaVersion`: `1`
- `contentVersion`: string
- `id`: stable slot id (`D001-main` etc.)
- `dayIndex`: integer 1–365
- `slotType`: `main` | `bonus`
- `skillGroup`: one of the 8 groups
- `gameTypeId`: one of the 24 **measured CSV** `type_id` values (`g01-t1`…`g08-t3`). The earlier `g01`…`g24` wording was shorthand and is clarified here; it does not mean 24 sequential IDs.
- `ruleVariantId`: one of the 96 `(type_id, rule_variant)` pairs, encoded as `"<type_id>:<rule_variant>"` (for example `"g01-t1:lặp một thuộc tính"`)
- `ageTrack`: `age_6_8` | `age_9_12` (later: `age_3_5` | `age_13_plus`)
- `locale`: BCP-47 tag, initial `vi`
- `title`, `invitation`, `tutorial`, `explanation`
- `boardData`: JSON validated by the mechanic's schema
- `solution`: canonical answer or finite set of valid answers
- `validSolutionPredicate`: versioned checker id
- `hints`: exactly 2, ordered, not containing the full answer
- `praiseKeys`: event-keyed keys, not free-text claims
- `targetSeconds`: 60–120 (track-specific target inside this range)
- `status`: `design_only` | `reviewed` | `approved` | `retired`
- `fingerprint`: canonical structural hash, ignoring skin/color/rotation where the mechanic allows
- `source`: null or `{repo, url, commit, license, path}` for reused material
- `editorial`: `{reviewedBy, reviewedAt, ageReviewedBy, ageReviewedAt}`; required for `approved`

Validation invariants:

- `(dayIndex, slotType, ageTrack, locale, contentVersion)` unique.
- Approved items only in a release manifest.
- `solution` must satisfy the checker; a single-answer item must be unique under the solver.
- Hints must not contradict the solution.
- Labels must not leak the answer.
- `fingerprint` duplicates within the spacing window are rejected.
- No live generation at child play time.

### 11.2 Production manifest

`manifest-v1` fields:

- `manifestVersion`, `schemaVersion`, `generatedAt`;
- `isPilotFixture: false`;
- `minFormatSpacingDays: 7` (CSV holds 11; releases may not go below 7);
- `locales`, `ageTracks`;
- `items[]` with approved puzzle ids/versions;
- `coverage`: `{dayCount: 365, slotsPerDay: 2, typeIds: 24, variantPairs: 96}`;
- `editorialApproval`: batch manifests and human sign-offs;
- `fingerprintIndexVersion`.

A release manifest is invalid if any of these is true:

- any `design_only`, `reviewed`-only or retired item is included;
- any day/slot is missing for a released track/locale;
- main and bonus skill groups are equal on any day;
- rolling 8-day windows do not cover all 8 groups;
- format spacing is below the declared minimum;
- a fingerprint repeats inside the spacing window;
- 24 type-id or 96 variant-pair coverage is claimed but not met.

“365 days ready” may be claimed only after all 730 slots per released track/locale pass schema, solver, fingerprint and human semantic/age approval.

### 11.3 Pilot manifest (separate file)

The initial 3-mechanics/7-days slice uses `content/thinking-games/pilot/pilot-manifest-v1.json`, not the production manifest.

- `isPilotFixture: true`
- `minFormatSpacingDays: 1` with a mandatory `spacingException` object:
  `{reason, approvedBy, approvedAt, appliesTo: "pilot-only", productionManifestRequired: true}`
- 7 days × 2 slots × 2 age tracks = 28 payloads.
- Exactly 3 `gameTypeId` values, from 3 distinct skill groups so main/bonus can differ.
- Main and bonus skill groups must still differ on every pilot day.
- The pilot manifest is rejected by the production validator unless `isPilotFixture` is true **and** the caller explicitly allows the pilot profile.
- Passing the pilot manifest never increments a 24-format or 730-slot coverage counter.

## 12. Default flags and kill switches

| Key | Default | Effect | Registry / owner |
| --- | --- | --- | --- |
| `dailyThinkingGames` | `false` (env unset/false) | Master flag for all game UI and APIs | client `src/lib/experience-flags.ts` (`NEXT_PUBLIC_DAILY_THINKING_GAMES`); P08 owns this shared file |
| `thinkingGamesPilot` | `false` | Allows the pilot manifest id and cohort only | server `src/lib/server-features.ts` or `src/lib/thinking-games/server/flags.ts`; P04/Copilot owns |
| `thinkingGamesBonus` | `false` | Bonus calculation/unlock disabled even if master is on | server, same owner as pilot |
| `thinkingGamesServePilotContent` | `false` | Serves pilot content instead of production catalog | server, same owner as pilot |

Rules:

- The master flag lives on the client registry so the card cannot render when off; the other three are server-only and must not be prefetched by the client. P03 does not edit `src/lib/experience-flags.ts`; P08 owns that shared-file change and its lock.
- Absence of a flag, a malformed flag or a missing DB setting is off (fail closed).
- No quest/secret-quest flag is reused.
- Master off: no game request, no catalog prefetch, no game card; existing habit flows unchanged.
- Bonus flag off: main remains available; bonus stays locked and no entitlement is created.
- Disabling master takes effect immediately: no new grants; an already started attempt may finish and save; unused bonus is `revoked_unused`.
- A kill switch must be drilled before release. Re-enabling must not duplicate entitlements or attempts.

## 13. API and command contract

All mutations require a same-origin check, a valid child-device session or parent session, family ownership, and an idempotency key where stated.

**Route prefixes (R12):** `/api/child/thinking-games/*` follows the existing `/api/child/*` family. `/api/parent/thinking-games/*` is a deliberate new parent prefix for this feature; it does **not** overload `/api/domain/commands`, because the game response envelope is separate (see §13.4) and the habit command envelope must stay closed. P04 owns both route families.

### 13.1 Child surface

| Method / RPC | Input | Result |
| --- | --- | --- |
| `GET /api/child/thinking-games/state` | child session cookie, `expectedLocalDay?` | `{serverLocalDay, featureState, ageTrack, main, bonus, journey, bedtime, quiet}` |
| `POST start` | `slot`, `expectedLocalDay`, `commandId` | entitlement + attempt + approved payload, or stable error |
| `POST finish` | `attemptId`, `answer`, `commandId` | server-validated result, no points/star change, attempt history |
| `POST pause` | `attemptId`, `commandId` | paused attempt, resumable same day |
| `POST excuse?` | never child | child cannot excuse a task |

### 13.2 Parent surface

| Method / RPC | Input | Result |
| --- | --- | --- |
| `GET /api/parent/thinking-games/settings` | parent session | settings + effective day + preview |
| `PUT /api/parent/thinking-games/settings` | master, timezone, cutoff, bedtime, child age override, `commandId` | next-day effective settings; PIN checked when configured |
| `GET /api/parent/thinking-games/day-preview` | childId, localDay | frozen snapshot task list and bonus reason |
| `POST /api/parent/thinking-games/excuse` | childId, localDay, taskId, reason, `commandId` | audited excusal, recompute |

Server RPCs proposed for P04 (names are contract, signatures may be refined without changing semantics):

- `thinking_game_state(session_token_hash, expected_local_day)`
- `thinking_game_start(session_token_hash, slot_type, expected_local_day, command_id)`
- `thinking_game_finish(session_token_hash, attempt_id, answer jsonb, command_id)`
- `thinking_game_pause(session_token_hash, attempt_id, command_id)`
- `thinking_game_update_settings_as(actor_user_id, ..., command_id)`
- `thinking_game_preview_day(actor_user_id, child_id, local_day)`
- `thinking_game_excuse_task_as(actor_user_id, child_id, local_day, task_id, reason, command_id)`
- `sync_thinking_game_bonus_for_child(child_id, local_day)` — internal only

Authorization:

- Child RPCs derive `family_id` and `child_id` from the device session; they never accept either from the body.
- Parent RPCs derive the family from `current_family_id()` and require `can_manage_family`.
- `*_as` wrappers are `service_role` only and are used after the route's PIN check, matching `review_habit_command_as`.
- Cross-family ids return not-found/denied without leaking existence.

### 13.3 Idempotency

- `commandId` is a UUID generated once per user action and reused only for its retry.
- A repeated `start` returns the same entitlement/attempt.
- A repeated `finish` returns the same result.
- A repeated settings update returns the same effective version.
- A stale response must never overwrite a newer day/child state; client state keys include `childId`, `localDay`, `contentVersion`, `settingsVersion`.

### 13.4 Response envelope (R6)

The game routes use a **new** `thinkingGameResponseSchema`; they do not reuse `requestDomainCommand` or `domainCommandResultSchema`, and the existing habit command envelope stays closed and unchanged.

```ts
type ThinkingGameSuccess = {
  ok: true;
  schemaVersion: 'v1';
  status:
    | 'available' | 'started' | 'finished' | 'paused'
    | 'bonus_locked' | 'bonus_not_eligible'
    | 'bonus_pending_approval' | 'bonus_quiet_hours'
    | 'duplicate' | 'journey_complete';
  data?: unknown;
};

type ThinkingGameFailure = {
  ok: false;
  schemaVersion: 'v1';
  code: GameErrorCode;
  messageKey: string;
};
```

- HTTP 200 is used only for `ok: true` statuses. The four `bonus_*` values are informational success states, not failures.
- Failures use the HTTP status in §14 and the same `{ok:false, code, messageKey}` envelope; no 200 body contains an error code.
- The client parses with `thinkingGameResponseSchema.safeParse`; an invalid body is a hard client error, not a guessed state.
- This is a new route-family contract, so it does not require a version bump to the existing domain command enum.

## 14. Error states

All errors are stable codes; the child-facing copy is Vietnamese `mình – bạn`, calm and non-punitive.

| Code | HTTP | Meaning | Child-facing behavior |
| --- | --- | --- | --- |
| `feature_off` | 404 | Master flag off or family disabled | No card; no error toast |
| `settings_required` | 409 | Parent has not completed game settings | Parent-only setup prompt; no game card |
| `timezone_required` | 409 | No IANA timezone | Parent setup prompt; no grant |
| `timezone_invalid` | 400 | Timezone not recognized | Parent fix prompt; no grant |
| `age_track_unavailable` | 409 | Age outside 6–12 or not known | Calm “not ready for your age yet”; no substitute track |
| `content_unavailable` | 409 | No approved payload for day/slot/track | Calm “new puzzle not ready”; no fallback content |
| `content_not_approved` | 409 | Payload exists but not approved | Same as unavailable; never serve unreviewed |
| `format_unavailable` | 409 | Mechanic not implemented in this release | Calm “new puzzle not ready”; never fake a solver |
| `invalid_answer` | 400 | Malformed answer shape (not a wrong answer) | Calm retry; wrong answers are a 200 `finished` result |
| `bedtime` | 409 | Inside bedtime blackout | Calm rest message; no invitation |
| `outside_play_window` | 409 | Before start of day or after window | Calm rest message |
| `paused` | 409 | Family or local day paused; no new grant | Calm rest message; a started attempt may finish |
| `bonus_locked` | 200 (`ok:true`) | Bonus not yet qualified | Show why gently (waiting for tasks/approval) |
| `bonus_not_eligible` | 200 (`ok:true`) | Day has no mandatory tasks or was excused to none | No bonus card; no guilt |
| `bonus_pending_approval` | 200 (`ok:true`) | Tasks waiting for review | “Waiting for a grown-up”; no countdown |
| `bonus_quiet_hours` | 200 (`ok:true`) | Qualified but bedtime now | “Approved; now rest time”; no popup |
| `day_changed` | 409 | Client expected day differs from server | Replace view with new day; no mutation |
| `attempt_expired` | 409 | Old-day attempt/finish | “That puzzle belongs to yesterday”; no extra slot |
| `not_found` | 404 | No attempt **or** id from another family | One generic response; never reveal existence |
| `journey_complete` | 409 | `nextDayIndex > 365`; no new main content | Completion state; no invented index |
| `already_finished` | 409 | Duplicate finish with different command | Show finished result |
| `duplicate` | 200 (`ok:true`) | Same command replayed | Return original result |
| `offline_no_entitlement` | 409 | Start attempted with no server grant | “Need a connection for a new puzzle” |
| `session_invalid` | 401 | Child session expired/revoked | Return to pairing; clear cookie |
| `rate_limited` | 429 | Per-session limit exceeded | Calm retry later; `Retry-After` header |
| `internal` | 500 | Unexpected | Calm retry; log correlation id |

`attempt_not_found` and `family_mismatch` are **removed** as separate responses; both are `not_found` with an identical body. Rate limits are per child session: 120 state reads/min, 10 starts/min, 20 finishes/min, 20 pauses/min; exceeding one returns 429 with `Retry-After: 30` and no game data. P04 may tune the numbers only with a test update.

No error may reveal the answer, another child's data, or an unapproved payload.

## 15. Given/When/Then (binding)

### Day, snapshot, rollover

**GWT-01 Server day**
Given a family timezone `Asia/Ho_Chi_Minh` and the database clock at 2026-10-21T18:00Z,
when the child opens the game,
then the server local day is 2026-10-22 and the client clock is ignored.

**GWT-02 Missing timezone**
Given a family with no timezone,
when a child opens the game,
then the state is `timezone_required`, no snapshot or entitlement is created, and the parent sees a setup action.

**GWT-03 Snapshot freeze**
Given a snapshot taken at 08:00 with cutoff 19:00 and tasks A/B,
when the parent adds task C at 12:00,
then C is not part of today's bonus condition and the snapshot still lists A/B.

**GWT-04 Settings next day**
Given a family changes cutoff from 19:00 to 18:00 at 12:00,
when the child plays the same local day,
then 19:00 still applies; when the next local day starts, 18:00 applies.

**GWT-05 Mid-play rollover**
Given an attempt started at 23:50 local,
when the child finishes at 00:10 the next local day,
then the server returns `attempt_expired`, records `abandoned_rollover`, grants no third slot and shows the new day.

**GWT-06 Reload and tabs**
Given a main attempt already assigned,
when the child reloads or opens a second tab,
then the same entitlement/attempt and content version are returned and the journey index is unchanged.

**GWT-07 DST**
Given a zone with a spring-forward or fall-back transition,
when the local day changes,
then exactly one new snapshot exists for the new date and no duplicate or missing local day is produced.

### Main and bonus

**GWT-08 Main without habits**
Given feature on, timezone set, content approved, and no completed habits,
when the child starts `main`,
then one main entitlement and attempt are created; no bonus is granted.

**GWT-09 Bonus before approval**
Given all mandatory tasks require approval and are pending,
when the child opens the dashboard,
then bonus shows `bonus_pending_approval` and cannot start.

**GWT-10 Timely approval late**
Given a task received at 18:30 with cutoff 19:00 and approved at 20:00 with bedtime 20:30,
when the bonus sync runs,
then the bonus is granted for that day and is playable before 20:30.

**GWT-11 Approval in blackout**
Given a task received before cutoff but approved at 21:00 inside the bedtime blackout,
when the sync runs,
then the entitlement is not invitable, the child sees the calm rest message, and no extra slot is created after midnight.

**GWT-12 Late receipt**
Given a task completed at 19:05 with cutoff 19:00,
when it is approved,
then bonus is not granted for that day.

**GWT-13 Empty day**
Given a snapshot with zero mandatory tasks,
when the child opens the dashboard,
then main is available but bonus is `bonus_not_eligible` and no bonus entitlement is created.

**GWT-14 Deferral**
Given a mandatory task is deferred,
when bonus is evaluated,
then it is not treated as completed and bonus is not granted.

**GWT-15 Concurrent starts**
Given 20 simultaneous `start main` requests for the same child/day,
when they commit,
then exactly one entitlement and one attempt exist and every response is consistent.

**GWT-16 Batch review**
Given two pending tasks and a batch approve,
when the batch completes,
then the bonus sync runs once after the last item; no transient grant/revoke occurs and bonus is granted only if both are approved and timely.

**GWT-17 Undo before bonus start**
Given bonus granted but not started and the parent undoes a completed task,
when the undo commits,
then the entitlement is `revoked_unused`, no bonus can start, and habit status reflects the undo.

**GWT-18 Undo after bonus start**
Given bonus started and the parent undoes a completed task (allowed because it was not approval-terminal),
when the undo commits,
then the entitlement is `revoked_after_use`, the attempt stays in history, no replacement bonus is granted and the approved habit state is not rewritten by game logic.

**GWT-19 Reject**
Given a pending-approval task is rejected,
when bonus is evaluated,
then bonus is not granted and the child sees no failure message.

**GWT-20 Revocation separation**
Given a game entitlement is revoked,
when the parent views the habit log,
then an approved habit remains approved with its points; only the game ledger changed.

**GWT-21 Bonus without main**
Given bonus is granted and main has not been started,
when the child starts `bonus`,
then bonus content is served for the day's journey index and the journey index does not advance.

### Content, age, flags

**GWT-22 Age 6–8**
Given the child's server-known age is 7,
when state is read,
then the track is `age_6_8` and only that track's approved payload is served.

**GWT-23 Age unknown**
Given no birth year/age and no parent override,
when state is read,
then `age_track_unavailable` is returned and no other track is substituted.

**GWT-24 Parent age override**
Given a parent pins `age_9_12` for an 8-year-old,
when the next local day starts,
then the 9–12 track is used; the started attempt's track cannot change mid-attempt.

**GWT-25 Pilot manifest**
Given the 3-format/7-day pilot manifest with `isPilotFixture: true` and `minFormatSpacingDays: 1`,
when the production validator runs,
then it rejects the manifest unless the pilot profile is explicitly allowed, and never reports 24-format or 730-slot coverage.

**GWT-26 Production spacing**
Given a non-pilot manifest with a repeated format after 3 days,
when the validator runs,
then the manifest is rejected for violating `minFormatSpacingDays: 7`.

**GWT-27 Skill difference**
Given a candidate manifest where main and bonus skill groups are equal on any day,
when the validator runs,
then it is rejected; the current CSV passes with 0 equal / 365 different.

**GWT-28 Unapproved content**
Given the only payload for a slot is `design_only`,
when a child starts,
then `content_unavailable`/`content_not_approved` is returned and no unreviewed content is served.

**GWT-29 Flags off**
Given `dailyThinkingGames=false`,
when any game route or dashboard is requested,
then no game data is returned or prefetched and existing habit flows are unchanged.

**GWT-30 Bonus flag off**
Given master on and `thinkingGamesBonus=false`,
when tasks complete,
then no bonus entitlement is created; main still works.

### Safety, access, offline

**GWT-31 Child isolation**
Given child A's device session,
when it requests or mutates child B's entitlement,
then the server rejects without revealing B's data.

**GWT-32 Cross-site/expired session**
Given a cross-site mutation or an expired/revoked session,
when the request arrives,
then it fails closed and the client clears stale ready state.

**GWT-33 Offline start**
Given no connection and no prior server entitlement,
when the child tries to start,
then `offline_no_entitlement` is returned and no local grant is created.

**GWT-34 Offline finish**
Given a started attempt and a finish queued offline,
when the retry reaches the server the same day,
then it is processed idempotently with server `received_at`; after rollover it returns `attempt_expired`.

**GWT-35 Tap and keyboard**
Given a drag-based mechanic,
when the child uses two taps or the keyboard (Tab/arrows/Enter/Space/Escape),
then the same valid solutions are possible and focus returns to the trigger.

**GWT-36 Reduced motion and mute**
Given `prefers-reduced-motion: reduce` and mute enabled,
when the child plays,
then no shake/confetti/3D spin plays, fades are ≤150ms, and TTS/SFX are muted with the mute state persisted.

**GWT-37 Wrong answer/hint/rest**
Given the child answers wrong, uses both hints, pauses or leaves,
when the day ends,
then no stars/points are deducted, no replay is forced and the journey is unchanged.

**GWT-38 No approval bypass**
Given a parent approval is required,
when the child completes the habit and a bonus would otherwise be ready,
then bonus waits for `approved`; a pending state never unlocks it.

**GWT-39 Pause blocks main**
Given a paused family or paused local day and no started attempt,
when the child calls `start main`,
then `paused` is returned, no snapshot/entitlement/attempt is created, and an already started attempt may still finish.

**GWT-40 Game-owned receipt**
Given a completion with no client timestamp,
when the completion transaction commits,
then a `thinking_game_habit_receipts` row exists with server `received_at`, and bonus timeliness uses that row rather than an assumed `activity_logs.completed_at` default.

**GWT-41 Response envelope**
Given a bonus-locked state,
when the child client parses the game route response,
then it receives `{ok:true,status:'bonus_locked'}` through `thinkingGameResponseSchema`; the existing habit `domainCommandResultSchema` is not involved and is not extended.

## 16. Implementation gates (not satisfied in this task)

- P01 independent review: **PENDING** (R2 docs await a new independent review).
- P03 engine/backend implementation: **NOT STARTED** (must not start from this lane).
- P05 pilot content: **NOT STARTED**.
- P05A early usability checkpoint: **NOT RUN**; actual child/family pilot is **PENDING**.
- Content semantic/age approval: **PENDING**.
- 24/24 mechanics: **NOT IMPLEMENTED**.
- 365×2 approved payloads: **NOT IMPLEMENTED**.
- 4 track/year: **LATER MILESTONE**.
- SQL/concurrency/browser/pilot evidence: **NOT RUN**.
- **Real-PostgreSQL harness:** P04 must add a harness satisfying the five-point minimum (disposable DB, two connections, loopback-only guard, explicit `BLOCKED` on no DB, per-case evidence). Without it, GWT-15 (concurrent starts), GWT-16 (batch review) and GWT-31 (child isolation) are **MOCK-ONLY**, not passed.

No statement in this file may be reused as evidence that a phase passed.
