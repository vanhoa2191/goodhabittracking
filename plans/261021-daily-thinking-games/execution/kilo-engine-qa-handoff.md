# Kilo independent engine QA — P03 / pilot bounded contract readiness

**Reviewer:** Kilo (independent QA), dispatched worker `term_c52bd20c-5152-4f3a-b348-c3f059a7ce6e`
**Task / dispatch:** `task_f9437644a8c7` / `ctx_818972831ddc`
**Date:** 2026-10-21
**Scope reviewed:** `src/lib/thinking-games/**` (pure modules only, `server/**` excluded),
`content/thinking-games/pilot/pilot-manifest-v1.json`,
`content/thinking-games/manifests/release-365-v1.json`,
`scripts/check-thinking-games-content.mjs`, existing engine unit tests.
**Engine author under review:** OpenCode `task_98e0679d0ebc` / dispatch `ctx_5d45d4a3409e`
**Hand-off reviewed:** `plans/261021-daily-thinking-games/execution/opencode-engine-handoff.md`
**Contract reviewed:** `plans/261021-daily-thinking-games/contracts.md` (p01 R2, ACCEPTED in
`execution/copilot-contract-review.md`)

**VERDICT: REWORK** for this bounded engine-contract scope (2 P1 defects, 0 P0).
Readiness statement is about the *bounded engine contract only*, not about the whole feature.

---

## 1. Exact commands run, exact exits, exact counts

All commands run from `/home/opc/orca/goodhabittracking`. No app build, no dev server, no
dependency change, no commit, no push, no deploy, no native Codex subagent.

| # | Command | Exit | Result |
| --- | --- | --- | --- |
| 1 | `npx vitest run "tests/unit/thinking-games/"` (pre-existing engine suite, excl. new file) | **0** | 10 files, **42 passed / 0 failed** |
| 2 | `npx vitest run tests/unit/thinking-games-copy.test.ts` (pre-existing, adjacent) | **0** | 1 file, 3 passed |
| 3 | `npx vitest run tests/unit/thinking-games-adversarial.test.ts` (new Kilo file) | **1** | 1 file, **34 passed / 2 failed** |
| 4 | `npx vitest run tests/unit/thinking-games tests/unit/thinking-games-adversarial.test.ts` (task-mandated command) | **1** | **12 files, 79 passed / 2 failed (81 total)** |
| 5 | `npx tsc --noEmit --pretty false` (repo-wide) | **0** | no output, no errors |
| 6 | `npx eslint src/lib/thinking-games tests/unit/thinking-games tests/unit/thinking-games-adversarial.test.ts scripts/check-thinking-games-content.mjs --max-warnings=0` | **0** | no output, no issues |
| 7 | `node scripts/check-thinking-games-content.mjs` | **0** | 2 PASS + 2 **expected** production rejections (see §3.4) |
| 8 | `node scripts/check-thinking-games-content.mjs --help` | **0** | `--help` is **not** implemented; the script just runs the check |

Command 4 exits 1 for exactly two assertions, both of which are **deliberate contract-violation
assertions** described in §4.1 and §4.2. Every other assertion in the new file passes, and all 45
pre-existing tests still pass unmodified. No engine file, fixture, answer, validator or pre-existing
test was edited to obtain any result. No assertion was weakened after it failed.

Note on filter behaviour: `tests/unit/thinking-games` is a substring filter and also matches the
adjacent `tests/unit/thinking-games-copy.test.ts`; `tests/unit/thinking-games/` (trailing slash)
selects the engine directory only. Both counts are reported above so the baseline is unambiguous.

### 1.1 New file

`tests/unit/thinking-games-adversarial.test.ts` — 36 tests, 34 pass, 2 fail (the two P1s).
It is the only file I created. It is written from independently reasoned fixtures and an
independent brute-force enumerator; it never calls the same shared checker twice as "proof".

---

## 2. Hand-off claim verification (opencode-engine-handoff.md §4–§5)

Every claim was re-derived by my own command, not by trusting the hand-off text.

| Hand-off claim | Verdict | My evidence |
| --- | --- | --- |
| 28 pilot payloads = 7 days × 2 slots × 2 initial ages × 1 locale (`vi`) | **TRUE** | manifest has 28 items; distinct `dayIndex`={1..7}, `slotType`={main,bonus}, `ageTrack`={age_6_8,age_9_12}, `locale`={vi}; per-(day,track) group holds exactly main+bonus (14 groups × 2) |
| Implemented mechanics = exactly `g01-t1`, `g06-t1`, `g03-t1` | **TRUE** | `IMPLEMENTED_GAME_TYPE_IDS` = 3 ids; the pilot's playable id set equals it exactly |
| 24 measured ids in metadata | **TRUE** | `GAME_MECHANICS` length 24 = `GAME_TYPE_IDS` |
| 96 `(type_id, rule_variant)` pairs in metadata | **TRUE** | `RULE_VARIANTS` length 96, ids unique |
| Other 21 mechanics explicit `format_unavailable`, no fake solvers | **TRUE for `solvePuzzle`/`validatePuzzle`**, see P2-5 | all 21 return `{ok:false, code:'format_unavailable'}`; `checkAnswer` instead returns `invalid_answer` |
| 3 distinct skill/theme bands in the pilot | **TRUE** | pilot skill groups = {rule, planning, memory} (3); the 8-band set is metadata only |
| Unknown age → explicit error | **TRUE** | `age_3_5` → `age_track_unavailable`; no other track substituted |
| Unknown locale → explicit error | **TRUE** | `en` → `locale_unavailable` |
| Day 366 → `journey_complete`; day 0 / missing slot / unknown content version → `content_unavailable` | **TRUE** | all four observed exactly |
| "The same request never rerolls" | **TRUE** | two identical requests → identical `pin`, identical item, identical `seededOrder`; also stable when the manifest item order is reversed, and with two competing candidates |
| Pilot = `design_only`, `editorial: null`, `source: null`, 2 hints, no answer leak | **TRUE** | verified for all 28 items; leak re-checked with my own `answerText` reconstruction |
| 28 unique canonical fingerprints | **TRUE** | 28 unique stored fingerprints, each equal to my recomputed canonical hash; my independent dihedral-orbit scan found **no** rotation/reflection-equivalent pair inside the pilot |
| Main ≠ bonus skill on every day and track | **TRUE for the shipped pilot** | per-(day,track) scan: 0 violations. **But the validator cannot enforce it — see P1-1** |
| Age difficulty changes structure, not skin | **TRUE** | 6–8: 5×5 grid / ≤5-token rule seq / 3–4-token memory; 9–12: 7×7 + waypoint / 5–6-token numeric seq / 5-token memory + 1 distractor |
| Release profile MUST reject the pilot | **TRUE** | `pilot_fixture_not_release`; metrics stay `coverageKind:'pilot'`, `typeIds:3`, `itemCount:28` — never 24/730 |
| Release placeholder is `not_ready`, zero items, rejected | **TRUE** | `release_editorial` + `release_item_count` (+9 more codes), `itemCount:0` |
| No `Date.now()` / `Math.random()` in engine paths | **TRUE** | my own grep over `src/lib/thinking-games/**`: no match |
| Barrel is client-safe (no `server/**`, `node:`, `next/`) | **TRUE** | my own grep over the pure engine: no `node:`/`next:`/`server/` import |
| "full 730 / 2920 not claimed" | **TRUE** | release manifest declares `coverage 365/2/24/96` but has 0 items and `editorialApproval:null`; validator rejects it. The 365-row CSV is **editorial only** (`coverageKind:'editorial'`, `itemCount:0`) and is never a playable catalog |
| No client-selected permissive profile | **TRUE today** | no file under `src/app`, `src/components`, `src/lib/store`, `src/lib/i18n` contains `allowPilotProfile`; the server routes do not yet import the engine's manifest/assignment modules. The engine does expose `validateManifest(input, {profile, allowPilotProfile})` — the guard must be preserved when the server lane wires it |
| `npx vitest tests/unit/thinking-games` → PASS (45) FAIL (0) | **TRUE** | 45 pre-existing tests pass unmodified (42 engine + 3 adjacent copy) |
| `npx tsc --noEmit` → exit 0 | **TRUE** | exit 0 |
| `npx eslint … --max-warnings=0` → exit 0 | **TRUE** | exit 0 |
| `node scripts/check-thinking-games-content.mjs` → exit 0, editorial PASS 365/730/24/96/8/0/358-358/11, pilot PASS 7/28/3/3/0, pilot-as-release FAIL, release-placeholder FAIL | **TRUE, byte-for-byte** | reproduced exactly (see §3.4) |
| "Hints must not contradict the solution" (`contracts.md:341`) for the shipped pilot | **FALSE** | age 9–12 rule items carry a repetition hint on a non-repeating numeric board — **P1-2** |
| "`ruleVariantId` describes the board" | **NOT ENFORCED / MISLABELLED** | generator ignores the variant on 9–12 and mis-maps `'lặp'` → alternating — **P2-1** |
| "no unreviewed content is served" (`GWT-28`, `contracts.md:663-666`) | **FALSE at engine level** | `resolveAssignment` served `D001-main-68` with `status:'design_only'` — **P1-3** |

---

## 3. What I independently confirmed as correct

### 3.1 Determinism / no reroll
* Same request → identical `pin` (contentVersion + itemId + fingerprint), identical item, identical `seededOrder`.
* **Order independence (new property, not covered by the author's tests):** reversing the manifest item array does not change the selected item, pin or seeded order. The scheduler sorts candidates by canonical fingerprint before selecting, so the manifest's physical order is irrelevant.
* With two competing candidates in one slot, the selection is stable across repeated attempts for the same child.
* No cross-track leakage: `age_6_8` and `age_9_12` requests never receive each other's item.
* `publicPuzzle` carries neither `solution` nor `explanation`.

### 3.2 Schema hardening (all rejected as expected)
`NaN`, `Infinity`, fractional, negative, out-of-bounds and out-of-grid coordinates; wall on start or
goal; duplicate walls; wall on a waypoint; duplicate waypoint ids; duplicate waypoint positions;
waypoint out of bounds; `start === goal`; unknown extra keys (`.strict()`); >12 walls; >3 waypoints;
wrong board `kind`; duplicate rule options; `repeat` without `period`; `period` on a non-repeat
rule; sequence shorter than the minimum; empty token; memory option set too small; memory option
duplicates; memory token missing from the option set; `displayMs` 999/2001; item `dayIndex` 0/366;
`targetSeconds` 59/121; unknown age track; unknown locale; malformed fingerprint; malformed id;
malformed `contentVersion`; extra item key.

### 3.3 Grading agrees with an independent reference
* **Rule sequence** — I recomputed the next token with my own implementation (alternating parity,
  repeat-block residue, constant-difference step). It agrees with the engine on 5 hand-written
  boards and on all 10 shipped pilot rule items, and every non-answer option is graded as a miss
  (`{ok:true, correct:false}`), not as a malformed answer.
* **Memory** — my own exact-order predicate agrees with the engine on the shipped items; a reversed
  order is a graded miss, a truncated order is a graded miss, a non-array is `invalid_answer`.
* **Path** — I enumerated **all** simple paths on a 4×4 board (32 paths; 20 through the waypoint,
  12 without) with my own DFS and compared every one against the engine's `checkPath`: **zero
  disagreements** (no false accept, no false reject).
* **Multi-answer path** — two structurally different valid paths (both through the waypoint, both
  avoiding the wall) are both accepted, and the pilot's own stored solution is one of them.
* **Rejected path shapes** — teleport/diagonal, wall crossing, repeated cell, out-of-bounds,
  wrong start, non-terminal path, and a valid path that misses the waypoint are all rejected.
* **Answer-shape contract** — a 1-cell path array and a non-array are `invalid_answer` (400-class);
  a well-formed but wrong path is `{ok:true, correct:false}`. This matches `contracts.md:497`.

### 3.4 Profile gates and honest coverage accounting
`node scripts/check-thinking-games-content.mjs` → **exit 0**, output verbatim:

```
editorial: PASS {"coverageKind":"editorial","dayCount":365,"slotCount":730,"typeIds":24,"variantPairs":96,"skillCount":8,"equalSkillDays":0,"rollingEightDayWindows":358,"rollingEightDayCovered":358,"minFormatSpacingDays":11,"itemCount":0}
pilot: PASS {"coverageKind":"pilot","dayCount":7,"slotCount":28,"typeIds":3,"variantPairs":6,"skillCount":3,"equalSkillDays":0,"rollingEightDayWindows":0,"rollingEightDayCovered":0,"minFormatSpacingDays":1,"itemCount":28}
pilot-as-release: FAIL [{"code":"pilot_fixture_not_release","path":"isPilotFixture","message":"release profile rejects pilot fixtures"}]
release-placeholder: FAIL [{"code":"release_editorial",…},{"code":"release_item_count","message":"expected 1460, got 0"},… 11 errors total]
```

**The two `FAIL` lines are the intended production rejections, not tool failures** — the script's own
gate asserts `!pilotAsRelease.ok && !releaseResult.ok` and therefore exits 0. They are recorded here
separately from the two real assertion failures in §1 so the distinction is not lost:
* content-CLI profile rejections = **expected, exit 0**;
* adversarial-suite assertion failures = **real source defects, exit 1**.

Note `pilot.variantPairs` is 6 (not stated in the hand-off, not claimed there either).

### 3.5 Fingerprints
* Option reordering (rule, memory) → identical fingerprint.
* All 8 dihedral transforms of a **non-square** 5×7 path board → identical fingerprint. The
  transform set is closed, so the min-over-orbit is a genuine canonical form.
* 240 distinct rule/memory boards → 240 distinct fingerprints (no accidental collapse).
* Orbit-aware path check over 27 generated boards: each dihedral orbit maps to exactly one
  fingerprint, and different orbits never share one.
* Semantically different boards stay apart: different wall, no wall, added waypoint, moved
  start/goal, different sequence, different `ruleKind`/`period`, reordered memory sequence,
  different `displayMs`.

### 3.6 Engine boundary
The pure engine never emits `paused`, `bedtime`, `outside_play_window`, `day_changed`,
`attempt_expired`, `rate_limited` or `feature_off` — pause/bedtime/rollover is server-lane work
(Copilot), not engine work. No `Date.now()`, no `Math.random()`, no `node:`/`next:`/`server/`
import in the pure engine. **No client-facing module can select `allowPilotProfile`.**

---

## 4. Defects (P0 / P1 / P2) with repro, expected vs actual, and minimal fix direction

### 4.1 P1-1 — Pilot profile cannot detect a per-track equal-skill day (GWT-27 hole)

* **Where:** `src/lib/thinking-games/manifest.ts:125-133` (the `equalSkillDays` computation inside
  `manifestMetrics`) and `src/lib/thinking-games/manifest.ts:260-262` (the `pilot_equal_skill` gate).
  Compare the correct release-side check at `src/lib/thinking-games/manifest.ts:370-378`.
* **Contract:** `plans/261021-daily-thinking-games/contracts.md:658-661` (GWT-27) and
  `contracts.md:20` ("Main skill different from bonus skill | 365 days | Must remain true after any
  content change").
* **Repro (my test):** take the shipped pilot, set day 1 / `age_9_12` main **and** bonus both to
  `g01-t1` (skill `rule`) with two distinct valid boards, then
  `validateManifest(manifest, { profile: 'pilot' })`.
* **Expected:** rejected with `pilot_equal_skill`.
* **Actual:** `ok: true`, `metrics.equalSkillDays === 0`, error list `[]`.
* **Root cause:** `equalSkillDays` aggregates main/bonus skills over **all age tracks of a day**
  before comparing. With `age_6_8` bonus = `planning` and `age_9_12` bonus = `rule`, the aggregated
  bonus set has size 2, the `mainSkills.size === 1 && bonusSkills.size === 1` guard never fires, and
  the per-track violation is masked. The same masking hides a violation affecting *both* tracks when
  the two tracks use different skills.
* **Minimal fix direction:** compute the pilot equal-skill check **per (day, ageTrack)** — i.e. reuse
  the release-side per-track logic (release profile already does this at `manifest.ts:370-378`) —
  and report `pilot_equal_skill` per offending `ageTrack.day`. The shipped pilot content itself is
  clean (0 per-track violations), so this is a validator-robustness defect, not a content defect.
* **Evidence in my suite:** `tests/unit/thinking-games-adversarial.test.ts` →
  `adversarial: pilot profile rejects a per-track equal-skill day` — currently **FAILING**.

### 4.2 P1-2 — Shipped 9–12 rule items carry a hint that contradicts the board

* **Where:** `content/thinking-games/pilot/pilot-manifest-v1.json`, `hints[0]` of
  `D001-main-912`, `D002-bonus-912`, `D004-main-912`, `D006-bonus-912`, `D007-main-912`:
  `"Nhìn xem các hình lặp lại theo nhịp nào."` ("look at how the *shapes* *repeat* in a rhythm").
  Shared from the 6–8 alternating track by `src/lib/thinking-games/mechanics/rule-sequence.ts:104-118`
  and the pilot's single hint template per mechanic.
* **Contract:** `contracts.md:341` ("Hints must not contradict the solution") and `contracts.md:342`
  ("Labels must not leak the answer").
* **Repro:** the 9–12 rule boards are numeric `ruleKind:'increment'` sequences with no repeated
  value, e.g. `D001-main-912` = `["2","5","8","11","14","17"]` (all distinct, step 3), yet the
  public hint asserts the items *repeat* and that they are *shapes* ("các hình"). The board has
  numbers, not shapes, and nothing repeats. The engine's own leak check
  (`assertNoAnswerLeak`, `schema.ts:284-290`) cannot see this because it only tests whether the
  hint *contains the full answer*.
* **Expected:** a hint that matches the board's rule family (e.g. "Nhìn xem mỗi số tăng thêm bao nhiêu.").
* **Actual:** the alternating/repetition hint ships on five numeric increment items.
* **Minimal fix direction:** give the 9–12 increment track its own hint pair in
  `content/thinking-games/pilot/pilot-manifest-v1.json` (content lane / engine author), and consider
  deriving hints from `boardData.ruleKind` in the generator instead of reusing one string per
  mechanic. Human Vietnamese review stays PENDING — I am not approving wording.
* **Evidence in my suite:** `tests/unit/thinking-games-adversarial.test.ts` →
  `adversarial: pilot hints and explanations agree with the board > does not attach a repetition hint
  to a board whose items never repeat` — currently **FAILING**.

### 4.3 P1-3 — The engine serves `design_only` content (GWT-28 not enforced)

* **Where:** `src/lib/thinking-games/scheduler.ts:51-60` — the candidate filter excludes only
  `item.status === 'retired'`; `design_only` and `reviewed` items are eligible.
  `content_not_approved` exists in `src/lib/thinking-games/types.ts:44`, is mapped to HTTP 409 in
  `src/lib/thinking-games/server/rpc-error.ts:9` and has Vietnamese copy in
  `src/lib/i18n/thinking-games-copy.ts:222`, but **no engine path ever returns it**.
* **Contract:** `contracts.md:663-666` (GWT-28) and `contracts.md:495`
  ("Payload exists but not approved → 409 → never serve unreviewed").
* **Repro:** `resolveAssignment({ manifest: pilot, childId: 'probe', dayIndex: 1, slotType: 'main',
  ageTrack: 'age_6_8', locale: 'vi', contentVersion: 'pilot-2026-10-21' })` → served
  `D001-main-68` with `status: 'design_only'`.
* **Expected:** `content_unavailable` / `content_not_approved` when the only payload for the slot is
  not approved.
* **Actual:** the unreviewed payload is served.
* **Severity note (important for the fix):** the *target* behaviour is ambiguous in the pure engine,
  because the accepted test `tests/unit/thinking-games/pilot-content.test.ts:86-93` ("resolves every
  item by its exact key without rerolling") **requires** the engine to resolve `design_only` pilot
  fixtures. A blanket `status === 'approved'` filter would break that accepted test. The correct
  resolution is a **profile-scoped** gate, not a blanket filter — e.g. `resolveAssignment` takes an
  explicit production/pilot profile (or an explicit `allowUnapproved` flag owned by the server lane)
  and returns `content_not_approved` for non-approved items under the production profile.
* **Minimal fix direction:** add the gate in the engine with a profile parameter, wire the server
  lane to the production profile, and keep the pilot fixtures reachable only under the pilot
  profile. I did not change the engine or the accepted test.
* **Note:** this is a contract-level finding, not a proven production leak — the server lane does not
  yet call the engine's assignment path, and no client can select the permissive profile today.

### 4.4 P2-1 — `ruleVariantId` is decorative and mis-mapped by the generator

* **Where:** `src/lib/thinking-games/mechanics/rule-sequence.ts:104-118`.
* **Repro (my probe, `generateRuleSequencePuzzle` with a fixed seed):**

  | declared variant | 6–8 board | 9–12 board |
  | --- | --- | --- |
  | `g01-t1:lặp một thuộc tính` ("repeat one property") | `ruleKind: alternating` | `ruleKind: increment` |
  | `g01-t1:tăng số phần tử` ("increase element count") | `ruleKind: repeat` | `ruleKind: increment` |
  | `g01-t1:xen kẽ hai chuỗi` ("interleave two strings") | `ruleKind: alternating` | `ruleKind: increment` |
  | `g01-t1:suy ngược phần đầu` ("reverse the head") | `ruleKind: repeat` | `ruleKind: increment` |

* **Expected:** the declared variant and the rendered board agree; the 96 `(type_id, rule_variant)`
  pairs of `contracts.md:18` are distinguishable by the engine.
* **Actual:** the 9–12 track ignores the variant completely (all four variants → `increment`), and
  the 6–8 track collapses 4 variants into 2 board kinds. `'lặp'` (repeat) is mapped to
  `alternating`, while `'tăng'` (increase) falls through to `repeat`. The shipped pilot therefore
  labels `g01-t1:lặp một thuộc tính` on an `alternating` board, and
  `src/lib/thinking-games/schema.ts:186-215` never cross-checks `ruleVariantId` against
  `boardData.ruleKind`.
* **Severity:** P2 (content semantics, not scoring). My reading of the Vietnamese variant names is
  stated explicitly so the author can confirm or correct it — the *defect* is that the engine
  cannot honour the variants it declares, and that no validator catches the mismatch.
* **Minimal fix direction:** map each declared variant to a concrete board kind (and honour the
  variant on the 9–12 track), then add a `ruleVariantId` ↔ `ruleKind` cross-check to
  `puzzleItemSchema.superRefine` so a mislabelled item cannot ship.

### 4.5 P2-2 — Pilot profile accepts a manifest whose items use different `contentVersion` values

* **Where:** `src/lib/thinking-games/manifest.ts:240-295` (pilot validation never checks
  `contentVersion`).
* **Repro:** set one pilot item's `contentVersion` to `pilot-2026-10-21-b` →
  `validateManifest(..., {profile:'pilot'})` returns `ok: true` (28 items), but
  `resolveAssignment` for that slot with `contentVersion:'pilot-2026-10-21'` now returns
  `content_unavailable` — the slot is unreachable for every client.
* **Expected:** the pilot profile should reject a manifest that silently strands slots (the
  "28 playable payloads" claim must hold for one reachable content version).
* **Actual:** accepted.
* **Minimal fix direction:** require a single `contentVersion` across pilot items (or declare it on
  the manifest and validate it). The shipped pilot has one version, so this is robustness only.

### 4.6 P2-3 — `validateCatalog` can report a passing verdict for a 0-payload catalog

* **Where:** `src/lib/thinking-games/manifest.ts:428-446`.
* **Repro:** `validateCatalog({ rows: <365 CSV rows>, profile: 'release' })` returns `ok: true`. The
  verdict is about the *editorial calendar*, but the API surface is the same one a release gate would
  use. When both `rows` and `manifest` are supplied, the returned `metrics` come from `results[0]`
  (the editorial rows) even if the manifest is the release manifest and is rejected.
* **Expected:** a release-profile verdict must never be `ok` while `metrics.itemCount === 0`, and
  the reported metrics must describe the artifact the verdict is about.
* **Actual:** `ok: true` with `coverageKind: 'editorial'` and `itemCount: 0`.
* **Mitigation already present:** `coverageKind` and `itemCount` distinguish editorial from
  playable, and the content CLI prints them on separate lines. This is a **misuse hazard**, not a
  false claim by the author.
* **Minimal fix direction:** make the release profile require a manifest, or return a distinct
  verdict/metrics kind for an editorial-only check.

### 4.7 P2-4 — `slotCount` counts item ids, and the release profile never checks id uniqueness

* **Where:** `src/lib/thinking-games/manifest.ts:138` (`slotCount: new Set(items.map(i => i.id)).size`).
* **Actual:** with duplicated ids the metric under-reports the real slot count; the release profile's
  expected-count check uses `manifest.items.length` (`manifest.ts:320-323`), and its only uniqueness
  check is `release_duplicate_slot` on `(day, slot, track, locale, contentVersion)`
  (`manifest.ts:330-333`) — never on `id`. Two different slots may therefore share an id, which
  makes the `itemId` component of `AttemptContentPin` ambiguous on its own.
* **Minimal fix direction:** count slots by the composite slot key, and add an id-uniqueness check
  to the release profile (the pilot profile already has `pilot_duplicate_id`).

### 4.8 P2-5 — `checkAnswer` answers `invalid_answer` for an unimplemented mechanic

* **Where:** `src/lib/thinking-games/checkers.ts:47` (final `return { ok:false, code:'invalid_answer' }`),
  versus `checkers.ts:53-54` and `checkers.ts:83-86`, which correctly return `format_unavailable`.
* **Contract:** `contracts.md:496` — `format_unavailable` = "Mechanic not implemented in this release".
* **Actual:** `checkAnswer(<item with gameTypeId 'g01-t2'>, …)` → `invalid_answer` (a 400-class
  "malformed answer" signal) instead of the 409-class "format not available" signal.
* **Minimal fix direction:** return `{ ok:false, code:'format_unavailable' }` from `checkAnswer` for a
  non-implemented mechanic (the return type needs widening to `GameErrorCode`).

### 4.9 P2-6 — Answer-leak detection is whole-answer only

* **Where:** `src/lib/thinking-games/schema.ts:148-159` (`answerText`) and `schema.ts:210-214`
  / `284-290` (the containment test).
* **Actual:** a public hint that names **one** token of a 5-token memory answer, or one coordinate
  of a 13-step path answer, is not detected, because the check only asks whether the hint contains
  the whole answer string. The contract's literal requirement is the full answer
  (`contracts.md:328`), but `contracts.md:342` also asks that labels not leak the answer.
* **Observed:** all 28 shipped pilot hints are clean under the full-answer rule (verified with my
  own reconstruction of the answer text). The gap is in the detector's granularity, not in the
  shipped content.
* **Minimal fix direction:** also test every token of a multi-part solution (and every cell of a
  path solution) individually, at least for solutions of 2+ parts.

### 4.10 P2-10 — `seededOrder` and the actual selection come from two different derivations

* **Where:** `src/lib/thinking-games/scheduler.ts:62-66`.
* **Actual:** `seededOrder = shuffleDeterministic(createSeededRandom(key), fingerprints)` while the
  selection is `hashSeed(key) % candidates.length`. The exposed "seeded order" therefore does not
  describe the order in which the selection was made, and a modulo of a 32-bit hash is a mildly
  biased pick. `assignmentKey` (`scheduler.ts:31-38`) also omits `ageTrack` and `locale`, so the
  key is not a unique identifier of an assignment (harmless today because candidates are filtered
  first).
* **Contract:** `seededOrder` is not specified in `contracts.md`, so this is an internal
  consistency issue, not a contract violation.
* **Minimal fix direction:** derive the selection from `seededOrder[0]` (or drop `seededOrder`) and
  add `ageTrack`/`locale` to the key if the key is meant to identify an assignment.

### 4.11 P2-11 — Unguarded fallback in the path generator

* **Where:** `src/lib/thinking-games/mechanics/path-planning.ts:130-134`.
* **Actual:** after 24 attempts to build a solvable 7×7 board, the generator falls back to a 2-wall
  board **without re-checking solvability**; a genuinely unreachable fallback would produce an
  item that `validatePuzzle` later rejects as `invalid_puzzle`.
* **Minimal fix direction:** assert solvability on the fallback too (or raise instead of falling back).

### 4.12 P3 / decisions to record (no defect asserted)

1. The release validator's fingerprint-spacing check (`manifest.ts:342-352`) compares days **across
   all age tracks and locales**, so the same board on day 1 for `age_6_8` and day 2 for `age_9_12`
   is a spacing violation. Stricter than the contract strictly requires — confirm the intent.
2. `content/thinking-games/manifests/release-365-v1.json` declares `coverage 365/2/24/96` while
   holding 0 items. The validator rejects it, so no claim is made, but the shape declaration could
   still be misread by a human reader.
3. Five of the ten 6–8 path items share the same canonical solution path (the 5×5 board is trivial
   around its single wall). Content-variety observation, not a defect.
4. `node scripts/check-thinking-games-content.mjs --help` silently ignores `--help`; the CLI has no
   profile switch, so "pilot" and "release" are both always exercised. That is a good default,
   but the help text is missing.

---

## 5. Explicitly NOT RUN / NOT CLAIMED (not obtainable from unit code, not demanded of this review)

* **Human semantic and age approval of the 28 pilot payloads — NOT RUN.** The engine only checks
  structure. `contracts.md:369` requires human sign-off before any "ready" claim; `editorial` is
  `null` on all 28 items and they remain `design_only`.
* **Target-age pilot, time-on-task, efficacy, difficulty calibration — NOT RUN.** Not derivable
  from unit code; I did not ask unit code to prove it.
* **Real browser / renderer / UI behaviour — NOT RUN.** No renderer exists (only interface types);
  the UI is the AGY lane's scope. I ran no dev server and no build.
* **Pause, bedtime, play-window, rollover, attempt expiry, rate limiting — NOT RUN / out of engine
  scope.** Verified that the pure engine never emits those codes; they belong to the Copilot server
  lane. No claim is made about their behaviour.
* **Real PostgreSQL 18.4 two-tenant / auth-role RLS, concurrency and lock-budget harness — NOT RUN.**
  Still a future release gate per `contracts.md` / `test-spec.md`.
* **Production enablement, migration, performance, deployment — NOT RUN.**
* **Release 730 / 2920 payloads — NOT CLAIMED and NOT PRESENT.** The release manifest is an empty
  `not_ready` placeholder; 21 of 24 mechanics are metadata-only.
* **The editorial 365-row CSV is a calendar, not a playable catalog** (`coverageKind: 'editorial'`,
  `itemCount: 0`). It must never be quoted as playable coverage.

---

## 6. Recommended next actions (routing for the source author / root)

| Priority | Action | Owner | Scope |
| --- | --- | --- | --- |
| P1 | Fix the pilot equal-skill check to be per `(day, ageTrack)` | engine author | `src/lib/thinking-games/manifest.ts` |
| P1 | Replace the 9–12 rule hints with increment-appropriate copy (needs Vietnamese review) | engine author + content | `content/thinking-games/pilot/pilot-manifest-v1.json` |
| P1 | Decide and implement the profile-scoped approval gate for `resolveAssignment`; emit `content_not_approved` | engine author + root decision (conflicts with the accepted pilot test) | `src/lib/thinking-games/scheduler.ts` |
| P2 | Honour `ruleVariantId` in the generator and validate variant ↔ `ruleKind` | engine author | `mechanics/rule-sequence.ts`, `schema.ts` |
| P2 | Require one `contentVersion` per pilot manifest | engine author | `manifest.ts` |
| P2 | Make `validateCatalog`'s release verdict impossible to pass with 0 payloads; report metrics for the artifact the verdict is about | engine author | `manifest.ts` |
| P2 | Count slots by slot key; add release-profile id uniqueness | engine author | `manifest.ts` |
| P2 | Return `format_unavailable` from `checkAnswer` for unimplemented mechanics | engine author | `checkers.ts` |
| P2 | Granular answer-leak detection (per token / per path cell) | engine author | `schema.ts` |
| P2 | Align `seededOrder` with the selection; extend `assignmentKey` | engine author | `scheduler.ts` |
| P2 | Guard the path-generator fallback | engine author | `mechanics/path-planning.ts` |
| — | Keep the two failing Kilo assertions red until the P1s are fixed, then re-run; do not weaken them | root / author | `tests/unit/thinking-games-adversarial.test.ts` |

---

## 7. Scope discipline

* Files I created: `tests/unit/thinking-games-adversarial.test.ts` and this report.
* Files I modified: none outside those two.
* Engine source, content fixtures, answers, validator, schema, registry, scheduler, server lane,
  client/UI lane, i18n and the pre-existing engine tests were **read only**.
* No dependency added, no property-testing library introduced, no commit, no push, no deploy, no
  app build, no dev server, no native Codex subagent, no other writer's scope touched.
* The only failures I report are the two contract-violation assertions named in §4.1 and §4.2; I
  did not weaken, delete or re-scope any assertion to obtain a green run.
