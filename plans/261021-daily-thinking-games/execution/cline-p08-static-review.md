# P08 Integration Audit — Cline Static Review

- **status**: VERIFIED
- **worker**: cline (openrouter/free, known-working router only; NO paid/Codex; no guessed/pinned-unavailable IDs)
- **UTC timestamp**: 2026-10-21T13:32:58Z
- **workspace root**: /home/opc/orca/goodhabittracking
- **dispatch**: task_ecf0a8ad344f / ctx_9622521d15a5
- **mode**: READ-ONLY static audit (no app source/content edits, no deps, no deploy, no native agents)
- **owned artifacts**:
  - plans/261021-daily-thinking-games/execution/cline-p08-static-review.md (this file — single source of truth)
  - /tmp/goodhabit-cline-p08-* (evidence snapshots)

## Scope (to be VERIFIED via structured reads)
1. P08 phase + test spec + the P08 "claimed complete but no test files listed" assertion.
2. Current owned Card / settings / client / localadapter / flag seams.
3. KidDashboard / ParentSettingsTab seams (rg narrow reads, not whole 68k file).
4. Source integration table; Copilot currently SQL-only; AGY owns renderers folder.
5. Functional wire:
   - cloudparent + paired context
   - publicpuzzle -> realPlayer -> start/finish/pause -> actual server grader
   - localdemo explicit practice (NO fake cloud rights)
   - history (no card/replay)
   - child/date/authswitch stale async guards
   - multitab storage/refetch
   - failure rollback
   - parentPIN / cutoffpreview / disablecontrols
   - flags default false/off, 0 requests / lazy bundle / no all-year imports
   - no new stars/reward points / copy "mình-bạn"
6. Distinguish CONFIRMED codepath defect vs UNTESTED gap. Do NOT mark missing tests as working feature.
7. No production browser/API calls. Lint/typecheck existing tools allowed; report ACTUAL exit (not source-level "test pass").
8. No shared Next build/server cleanup. Wrong root-relative handoff artifact flag but do NOT delete/move others.

## Status: VERIFIED — findings populated via structured code reads (regex/narrow reads, not whole-file). P0/P1 defects are confirmed code-path defects; P2 items are observations/gaps. No production browser/API calls were made. Lint/typecheck existing tools allowed; actual exit codes reported below.

## 1. Verified Findings (P0/P1/P2)

### P0 CONFIRMED DEFECTS

**1. `ThinkingGameCard.tsx:40-61` — Stale async guard always discards cloud start result**

- **Code** (lines 40-61): `useCallback(async () => { const id = requestId + 1; setRequestId(id); ... const result = await ...; if (id !== requestId || !result.ok) return; })`
- **Defect**: `id` is `requestId + 1` at call time, but `requestId` in the closure is stale render-state value. So `id !== requestId` evaluates to `requestId + 1 !== requestId` → **always true**. Guard unconditionally returns early, discarding entire cloud-start response.
- **Impact**: In cloud mode (paired/parent), clicking "Chơi" fires API request but **never sets the puzzle, never opens player, never surfaces notice**. Card stays collapsed. Local practice unaffected.
- **Source**: `src/components/ThinkingGameCard.tsx:40-61`.
- **Confidence**: P0 — codepath non-functional.

**2. `src/app/api/child/thinking-games/finish/route.ts:34` + `src/app/api/domain/thinking-games/finish/route.ts:38` — Finish API always returns 409**

- **Code**: Both finish routes call `parsePuzzleItem(content)` where `content` is a raw DB row from `thinking_game_content(*)` with extra top-level keys and missing top-level `boardData`. `parsePuzzleItem` uses `puzzleItemSchema` which is `.strict()`; validation fails → always returns `failure('invalid_puzzle')` with HTTP 409.
- **Impact**: Both child and parent `finishThinkingGame` API endpoints **never succeed**. Finish path broken; underlying RPCs are functional but never reached.
- **Source**: `src/app/api/child/thinking-games/finish/route.ts:34` and `src/app/api/domain/thinking-games/finish/route.ts:38`.
- **Confidence**: P0 — API path non-functional; unit tests mock fetch, do not catch.

### P1 CONFIRMED DEFECTS

**3. `ThinkingGameCard.tsx:63-68` — Storage subscription guard inverted; multitab sync broken**

- **Code** (lines 63-68): `useEffect(() => { if (mode !== 'local') return subscribeLocalThinkingGame(() => { const state = startLocalThinkingGame('main'); if (!state) { setPuzzle(null); setAttemptId(null); } }); }, [mode]);`
- **Defect**: Subscription only activates in **non-local mode**. Local practice gets no multi-tab sync; only clears `puzzle/attemptId` when `!state`, never re-populates when state exists. In cloud mode, subscriber calls `startLocalThinkingGame('main')`, which creates a local practice attempt as side effect. Cross-mode pollution.
- **Source**: `src/components/ThinkingGameCard.tsx:63-68`.
- **Confidence**: P1 — sync path broken; side-effect bug.

**4. `ThinkingGamesSettingsSection.tsx:33` — Hardcoded save values; bonusEnabled always reset to false**

- **Code** (line 33): `bonusEnabled: false`, `bedtimeStartLocal: '21:00'`, `bedtimeEndLocal: '07:00'`, `ageTrackOverride: null`
- **Defect**: Save always sends these hardcoded values, ignoring UI state. Parent cannot configure bonus, bedtime, age track override.
- **Source**: `src/components/ThinkingGamesSettingsSection.tsx:29-39`.
- **Confidence**: P1 — UI contract violated.

**5. `ThinkingGamesSettingsSection` not gated by `thinkingGames` flag**

- **Code**: No check of `defaultExperienceFlags.thinkingGames`. ParentSettingsTab mounts it unconditionally at `ParentSettingsTab.tsx:226`.
- **Defect**: With flag unset (default false), parent settings tab still issues GET `/api/domain/thinking-games/settings` request on mount. Violates "flags default false/off 0 requests".
- **Source**: `src/components/ThinkingGamesSettingsSection.tsx:1-27`; `src/components/ParentSettingsTab.tsx:226`.
- **Confidence**: P1 — flag gate omitted.

**6. `ThinkingGamePlayer` pause only sets local React state; server pause API never called from UI**

- **Code** (`ThinkingGamePlayer.tsx:84-86`): `handlePause: () => setGameState('paused')` — purely client-side. No component calls `pauseThinkingGame`/`pauseThinkingGameForParent` from `thinking-games-client.ts:82-87`.
- **Impact**: Pause leg not wired. Paused state lost on reload; no server-side persistence.
- **Source**: `src/components/thinking-games/ThinkingGamePlayer.tsx:84-86`; `src/lib/store/thinking-games-client.ts:82-87`.
- **Confidence**: P1 — missing wire.

### P2 NOTED OBSERVATIONS

**7. `thinking-games-local.ts:28` — dayIndex uses device `getDate()` mod 7, not IANA**

- **Code** (line 28): `const dayIndex = ((new Date().getDate() - 1) % 7) + 1;`
- **Defect**: Uses device wall-clock day-of-month mod 7 instead of IANA-local-day resolution. Acceptable for local demo but not server-authoritative. Manifest filter also hardcodes `ageTrack === 'age_6_8'` and `locale === 'vi'`, limiting local practice to one age/locale.
- **Source**: `src/lib/store/thinking-games-local.ts:28-34`.

**8. Only 17/24 mechanics have renderers; remaining 7 fall through to a placeholder banner**

- **Code**: `ThinkingGamePlayer.tsx:5-21` imports 17 game components; `renderGameRenderer()` dispatches for g01–g06-t1/t2 plus g06-t3. Remaining types (g06-t3, g07×3, g08×3) fall through to the "format unavailable" banner.
- **Source**: `src/components/thinking-games/ThinkingGamePlayer.tsx:5-21,343-358`; `src/lib/thinking-games/renderer.ts:36-60`.

**9. `KidDashboard` correctly guards game card with `isToday`** (P2 positive)

- **Code** (`KidDashboard.tsx:466-468`): `{activeChild && isToday && !isFamilyPaused && (<ThinkingGameCard .../>)}`. The `isToday` check means the ThinkingGameCard **only renders for the current day**, not history. Confirms "history no card/replay".
- **Source**: `src/components/KidDashboard.tsx:466-468,262-265`.

**10. `onFinish` clears local state even in cloud mode** (P2)

- **Code** (`ThinkingGameCard.tsx:96`): `onFinish={() => { clearLocalThinkingGame(); setOpen(false); setPuzzle(null); }}`. In cloud mode this dispatches a synthetic `StorageEvent` after clearing, which triggers the subscriber → `startLocalThinkingGame('main')` → **creates a local practice attempt** as a side effect.
- **Source**: `src/components/ThinkingGameCard.tsx:86-96`.

**11. Provider never mints cloud rights from local practice** (P2 positive)

- `finishLocalThinkingGame` only touches localStorage; `thinking-games-local.ts` has no network calls. Handoff claim "never mints a cloud session, entitlement, approval, points, or child auth" is validated.
- **Source**: `src/lib/store/thinking-games-local.ts:1-76`.

**12. Root-level `handoffs/P08.md` claims complete but plan-owned artifact NOT_STARTED** (process flag)

- Root-level handoff has validation exit 0; plan-owned `plans/261021-daily-thinking-games/handoffs/P08.md` status is `NOT_STARTED — template, không phải receipt hoàn thành` with all evidence columns empty. Per instruction: **flag but do NOT delete/move**.
- **Source**: `handoffs/P08.md` vs `plans/261021-daily-thinking-games/handoffs/P08.md`.

## 2. Coverage Matrix (P0/P1/P2)

| # | Finding | Severity | File:Line | Confirmed? | Affected Path |
|---|---------|----------|-----------|------------|----------------|
| 1 | Stale async guard discards cloud start | P0 | `ThinkingGameCard.tsx:40-61` | YES | Cloud play non-functional |
| 2 | Finish API always 409 (parsePuzzleItem shape mismatch) | P0 | `child finish:34`, `domain finish:38` | YES | Finish API dead |
| 3 | Storage subscription guard inverted; multitab sync broken | P1 | `ThinkingGameCard.tsx:63-68` | YES | Cross-tab/local sync broken |
| 4 | Settings save hardcodes bonusEnabled=false; bedtime/ageTrack override missing | P1 | `ThinkingGamesSettingsSection.tsx:33` | YES | Parent cannot configure |
| 5 | Settings not gated by thinkingGames flag | P1 | `ParentSettingsTab.tsx:226` + section | YES | Flag gate omitted; requests when off |
| 6 | Pause not wired from UI to server API | P1 | `ThinkingGamePlayer.tsx:84-86` + client wrappers | YES | No server pause persistence |
| 7 | dayIndex uses device getDate() mod 7 not IANA | P2 | `thinking-games-local.ts:28` | YES | Local day semantics |
| 8 | Only 17/24 mechanics have renderers | P2 | `ThinkingGamePlayer.tsx:5-21` + `renderer.ts:36-60` | YES | Renderer gap vs design |
| 9 | KidDashboard `isToday` guard limits card to current day | P2 (positive) | `KidDashboard.tsx:466-468` | YES | History no card/replay validated |
| 10 | onFinish clears local state even in cloud mode | P2 | `ThinkingGameCard.tsx:96` | YES | Cross-mode state pollution |
| 11 | Provider never mints cloud rights from local practice | P2 (positive) | `thinking-games-local.ts` | YES | Design validated |
| 12 | Root handoff claims complete; plan handoff NOT_STARTED | Flag (process) | `handoffs/P08.md` vs `plans/.../handoffs/P08.md` | PROCESS | Artifact flag issue |

## 3. Smallest-Fix Recommendations

1. **Fix stale async guard in `ThinkingGameCard.tsx:40-61`**: Replace the `id` guard with a `useRef`-based latest-request-id pattern. Convert `requestId` state to `useRef(currentRequestId)`; compare `ref.current` after `setRequestId(ref.current + 1)`. Minimum: make `if (id !== requestId || !result.ok) return;` compare against the latest ref value so cloud start responses are applied.

2. **Fix finish API shape mismatch**: In both `child finish/route.ts:34` and `domain finish/route.ts:38`, change `parsePuzzleItem(content)` to `parsePuzzleItem({ ...content.public_payload, solution: content.grading_payload?.solution, validSolutionPredicate: content.grading_payload?.validSolutionPredicate })`. The `public_payload` JSONB column already contains the PuzzleItem-shape fields; add `solution`/`validSolutionPredicate` from `grading_payload`.

3. **Fix inverted storage subscription guard in `ThinkingGameCard.tsx:63-68`**: Change `if (mode !== 'local')` to `if (mode === 'local')` so local mode registers the subscriber for multi-tab sync (likely intended).

4. **Gate `ThinkingGamesSettingsSection` by `thinkingGames` flag**: Add `if (!defaultExperienceFlags.thinkingGames) return null;` inside the section component, and gate mount in `ParentSettingsTab.tsx:226` with `enabled`.

5. **Wire pause from UI**: In `ThinkingGameCard.tsx`, add handler calling `pauseThinkingGame`/`pauseThinkingGameForParent`. Minimum: add pause-handler callback wired to client wrappers.

## 4. Tests Needed (coverage gaps)

- Unit test for `ThinkingGameCard.start` verifying cloud puzzle set (currently NOT set; a test would reveal bug and verify fix).
- E2E/API test calling finish route with valid attempt verifying 200 `finished` (currently always 409).
- Test for `thinking-games-local.ts` storage subscription multitab scenario.
- Test mounting `ThinkingGamesSettingsSection` with flag off verifying no API request.
- Test verifying pause client wrapper is invoked from UI.

## 5. Status Summary

All P0/P1 findings are VERIFIED via structured code reads (regex/narrow reads, not whole-file). P2 findings are observed and documented. Two P0 defects: (1) stale async guard permanently discards cloud start responses; (2) finish API endpoints always reject with 409 due to `parsePuzzleItem` receiving a DB-row shape instead of a PuzzleItem. Three P1 defects: inverted storage-submission guard, settings hardcodes + missing flag gate, and unpaused server wire. Handoff conflict confirmed: worker claimed complete in `handoffs/P08.md` but plan-owned `plans/261021-daily-thinking-games/handoffs/P08.md` is NOT_STARTED with no evidence. Wrong root-relative handoff artifact flagged but not deleted/moved. No production browser/API calls made; `eslint` exit 0 on P08 files; `tsc` has 3 pre-existing unrelated errors.
