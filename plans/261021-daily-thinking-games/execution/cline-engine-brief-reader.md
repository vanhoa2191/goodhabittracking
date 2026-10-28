# Cline Engine Brief — Pure Quality Snapshot

**Read-only verifier. No Orca CLI calls. No source/test/config edits.**
Task `task_b599cfce90c2` / dispatch `ctx_593dd87ab7a4`.

## 1. Source integrity (independent SHA256, Python hashlib)

- Engine scope: `src/lib/thinking-games/**` (19 files).
- combinedHash **before**: `7443f2de183016e9eccf2187439dd3ad722a04757d03f6a51e833547e4440098`
- combinedHash **after** : `7443f2de183016e9eccf2187439dd3ad722a04757d03f6a51e833547e4440098`
- hashUnchanged: True  (rawBytes before==after: True)
- Per-file + combined hashes machine-written to `/tmp/engine-brief-hash-before.json` / `-after.json`.
- **Source did not mutate during the 12.5s verification window → failures are not RNG flakiness** (rule: cannot label flaky without stable hash; hash is stable).
- Note: poolside source-owner `ctx_9b00c8c4726e` was still `running` in the coordination file; `sourceFreeze=false`. Treat as a point-in-time snapshot — re-hash if that agent mutates afterward.

## 2. Commands executed (actual)

| # | command | exit | elapsed (s) | notes |
|---|---------|------|------------|-------|
| 1 | `vitest run` generator-quality + all-mechanics + year-candidates | 1 | 12.507 | 3 files |
| 2 | `tsc --noEmit --pretty=false` | 1 | 0.115 | **rejected**: TS5023 Unknown compiler option `--pretty=false`; did NOT typecheck |
| 3 | `tsc --noEmit` (canonical repo `typecheck`) | 1 | 10.065 | corrected re-run |
| 4 | python `sha256` over engine files | 0 | — | before+after |

Logs: `/tmp/engine-brief-tests.stdout|.stderr`, `/tmp/engine-brief-tsc.stdout|.stderr`, `/tmp/engine-brief-tsc2.stdout|.stderr`.

## 3. Results

### 3.1 Vitest: **3 failed | 21 passed (24)** across 2 files (generator-quality = 1 PASS)

Summary: ` Test Files  2 failed | 1 passed (3) |       Tests  3 failed | 21 passed (24)`

- `FAIL  tests/unit/thinking-games/all-mechanics.test.ts > P06 remaining mechanics > generates, solves, checks, validates and fingerprints every variant on all four tracks`
- `FAIL  tests/unit/thinking-games/year-candidates.test.ts > year candidate catalog > has 365 continuous days, four tracks, and all CSV slot mappings`
- `FAIL  tests/unit/thinking-games/year-candidates.test.ts > candidate negative controls > rejects the unreviewed candidate manifest under the production release profile`

### 3.2 Failure A — genuine engine defect (all-mechanics)  ⚠

- File: `tests/unit/thinking-games/all-mechanics.test.ts:107`, test "generates, solves, checks, validates and fingerprints every variant on all four tracks".
- Message: `AssertionError: g08-t2 age_3_5 hướng và đường viền: expected null not to be null`
- Minimal: **mechanic `g08-t2`, ageTrack `age_3_5`, variant "hướng và đường viền"`** — assertion `expect(solved,...).not.toBe(null)` failed because `mechanic.solve(board)` returned null for a board its own generator emitted (parseBoard→solve contract breach).
- Locus: `src/lib/thinking-games/mechanics/...` (g08-t2 solve path).
- Classification: **stable reproducible defect** (engine hash unchanged; engine has no Date.now/Math.random per audit). NOT flaky.
- Bounded fix: audit g08-t2 generate/solve for `age_3_5` in `src/lib/thinking-games/mechanics/{path-planning|remaining}.ts`; ensure `solve()` returns a non-null solution for any board its generator emits (or exclude the unsolvable board shape / variant).

### 3.3 Failure B — stale V1 provenance (year-candidates)  [fixture, not a live engine defect]

- File: `tests/unit/thinking-games/year-candidates.test.ts:45`, `expect(meta.engineHash).toBe(loaded.engineHash)`.
- Message: `AssertionError: expected '0f7da85273374e834be53d646d323f92ea366…' to be 'd1c114c2f26ce646d48eef0fd2b0d7df1b3b2…' // Object.is equality`
- Stored meta (V1 provenance) engineHash `d1c114c2f26ce646d48eef0fd2b0d7df1b3b2cd726ce322463882eb04735b755` ≠ live esbuild bundle hash `0f7da85273374e834be53d646d323f92ea366baebd486989f59bd9504f488750`.
- Classification: **stale fixture pin**, the V1 engineHash recorded in the candidate meta no longer matches current engine bytes. This is the documented "V1 historical bytes must preserve / future V2 refresh" gap — matches the separate SQL-calendar fixture task (`ctx_e208080560bf`), not this engine task.
- Bounded fix: V2 refresh of candidate meta via `scripts/generate-thinking-games-candidates.mjs` so `meta.engineHash == loaded.engineHash` (or make the assertion version-aware). **No engine source change required.**

### 3.4 Failure C — test timeout / perf (year-candidates)  [test-config]

- File: `tests/unit/thinking-games/year-candidates.test.ts:162`, "rejects the unreviewed candidate manifest under the production release profile".
- Message: `Error: Test timed out in 5000ms.`
- `engine.validateManifest(manifest, { profile: "release" })` on 2920 items exceeds the default 5000ms test timeout (no `{timeout}` passed to this `it`).
- Classification: test-config/perf, not a correctness assertion failure.
- Bounded fix: pass `{ timeout: 30000 }` to this `it` (cf. the monotonicity test which already uses `{timeout:30000}`); if release validation is genuinely >5s, profile `src/lib/thinking-games/manifest.ts::validateManifest`.

### 3.5 tsc `--noEmit` (corrected re-run) — 10 type errors (7 engine + 3 test)

- exit 1, 10 diagnostics. Complete list: `/tmp/engine-brief-tsc2.stdout`.
- Engine (7): `path-planning.ts` — 3× `TS2737` BigInt literals unavailable at ES2017 target (lines 60, 87, 97); `remaining.ts` — 4× `TS2542` cannot write `Readonly<Record<string,string>>` index signature (lines 845, 846, 847, 850) — a mutable-vs-readonly mutation.
- Tests (3): `generator-quality.test.ts` — 2× `TS2820` literal `"unordered"` not assignable to `"any"|"ordered"|undefined` (lines 64, 93); 1× `TS2322` `string[]` not assignable to `readonly [string,string]` (line 124).
- `TS2737` stems from `tsconfig.json` `"target":"ES2017"` while the engine uses `BigInt` literals (valid only at ES2020+). Bounded fix: drop `BigInt` literals from the engine, or raise target/lib — but global tsconfig changes are out of scope per constraints; flagged as a real current type error needing a source decision (note: `tsc` itself is unaffected by this when Next builds since Next uses its own transpilation, but the project `typecheck` gate fails).

## 4. Coordination owners (from `/tmp/goodhabit-live-coordination.json`, updatedAt 2026-10-22T00:13:50.174526+00:00)

- current pure-engine source owner: `ctx_9b00c8c4726e` (cline-pure-quality-poolside) — state `running`.
- separate SQL tests / SQL calendar QA: `ctx_c2277e30d295` / `ctx_e208080560bf` (fixture-only, not this engine task).
- real-stack preview owner-only: `ctx_7a9265faa6bf`.
- `sourceFreeze`: False; `readerCurrentlyActive`: cline-engine-brief-reader; `sqlCheckpointSHA256`: a0c1145ab501a94414188b25c9827f99e8fae48c7f83bf24960e02f1bd84e499.
- This reader is the sole active engine snapshot verifier.

## 5. Readiness / blockers

NOT all green → **do NOT freeze author / do NOT start V2 generator handoff yet**.
1. Failure A (g08-t2 solve→null) is a **live engine defect** — must be fixed in source before handoff.
2. Failure B (stale V1 engineHash) needs a **fixture/meta V2 refresh** (separate from SQL task); no source change.
3. Failure C (test timeout) is a **test-timeout** item — add `{timeout:30000}`.
4. `tsc --noEmit --pretty=false` is invalid for this tsc; canonical `tsc --noEmit` used for corrected run.

After Failure A is resolved and a V2 meta refresh is done, re-capture engine SHA256 (expect same `7443f2de…` if no further source change) and re-run the 3 files + `tsc --noEmit`; green on all + tsc 0 + stable hash = proof to allow `root` to freeze author and start V2 generator.

## 6. Artifacts
- `/tmp/engine-brief-hash-before.json` / `-after.json` (machine-computed SHA256).
- `/tmp/engine-brief-run.json` (test+tsc meta incl. original `--pretty=false` run).
- `/tmp/engine-brief-tsc2-meta.json`, `/tmp/engine-brief-tsc2.stdout|.stderr`.
- `/tmp/engine-brief-tests.stdout|.stderr`.
- This report: `/home/opc/orca/goodhabittracking/plans/261021-daily-thinking-games/execution/cline-engine-brief-reader.md`.
