# Contracts handoff — daily thinking games (P01 R2)

Status: **R2 READY FOR INDEPENDENT REVIEW**. Kilo REWORK items resolved; not accepted; not implemented. No source/SQL/dependency/commit/deploy.
Version: `p01-2026-10-21-r2`.
Task: `task_37b9288f5043`; dispatch: `ctx_e4ba249ddaf1`; worker terminal: `term_5bd8da0d-f005-47a7-9707-cd0bffca4b85`.
Base SHA: `9db0c946c9a23d2069d71ba7878bd3079af149ff`.

## Exact paths

- `plans/261021-daily-thinking-games/contracts.md` — normative contracts + GWT-01…41; version `p01-2026-10-21-r2`.
- `plans/261021-daily-thinking-games/decisions.md` — D01–D40 with status; version `decisions-2026-10-21-r2`.
- `plans/261021-daily-thinking-games/prd.md` — initial 6–12 slice and non-goals.
- `plans/261021-daily-thinking-games/plan.md` — milestones, phases, DAG, ACs.
- `plans/261021-daily-thinking-games/test-spec.md` — T01–T50.
- `plans/261021-daily-thinking-games/handoffs/P01.md` — original P01 receipt; not rewritten.
- `plans/261021-daily-thinking-games/execution/opencode-engine-handoff.md` — proposed engine exports, pending gate.
- `plans/261021-daily-thinking-games/execution/kilo-backend-test-review.md` — source of the REWORK items.
- `/home/opc/orca/goodhabittracking/execution/copilot-contract-review.md` — earlier Copilot ACCEPTED report; not sufficient for the new source gate.

## Kilo REWORK resolution

| Item | Resolution |
| --- | --- |
| R1 `received_at` | Removed the assertion that `activity_logs.completed_at` is server-set. P04 adds game-owned `thinking_game_habit_receipts` with server `received_at`/`reviewed_at`; completion/review write it in-transaction; preflight asserts non-null and no client grants. GWT-10/12 now rest on the receipt table. |
| R2 SQL local day | Contract now requires `(now() at time zone tz)::date` inside SQL; `now()` is transaction-start authority; invalid zone maps to `timezone_invalid`; TS `getLocalDateKey` is display parity only. |
| R3 advisory lock | Exact `thinking_game_lock_key(uuid)` SQL; lock is **unconditional** for all six habit RPCs, taken before row locks; helper does not reacquire; batch locks sorted child ids; AC13 performance budget required. |
| R4 habit tombstone/PIN | Recorded as accepted residual: habit undo stays a hard delete; game receipt/entitlement is the compensating control; parent game revoke/settings are PIN-gated; child cannot revoke another child's game. |
| R5 helper reads | Changed to “reads habit rows, writes only game tables”. |
| R6 response envelope | New `thinkingGameResponseSchema`; `bonus_*` are `ok:true` HTTP 200 statuses; existing habit `domainCommandResultSchema` is untouched. |
| R7 pause/main | Pause blocks new main and bonus grants; `paused` 409; started attempt may finish; unused grant waits for same-day resume or expires. |
| R8 journey index | Main start consumes current `nextDayIndex`, then increments; it is the next content index, not a calendar mapping; `journey_complete` after 365. |
| R9 real DB gate | §16 requires a real-PostgreSQL harness; GWT-15/16/31 are MOCK-ONLY without it. |
| R10 flags | Master flag is client-registry owned (`src/lib/experience-flags.ts`, P08 lock); pilot/bonus/serve-pilot are server-only. |
| R11 errors | `attempt_not_found` + `family_mismatch` collapse to one `not_found`; added `journey_complete`, `paused`, `format_unavailable`; explicit per-session rate limits. |
| R12 routes | New `/api/child/thinking-games/*` and `/api/parent/thinking-games/*` are deliberate; game envelope is separate from `/api/domain/commands`. |

## Review correction (source evidence)

Kilo's R1 cites `supabase/migrations/202609230001_experience_foundation.sql:39` as an `activity_logs` timestamp. That line is inside `create table public.secret_quests` (starts at `:32`), not `activity_logs`. No repository migration creates `activity_logs`; only `family_id` is added by `202609190001_family_tenancy.sql:165`. The R1 risk conclusion is retained, but the contract no longer asserts an unverifiable `completed_at` default. This is the only rejected citation detail; no substantive finding was dismissed.

## Locked decisions (short)

1. Server local day in SQL from family IANA timezone; no device clock, no guessed default.
2. Immutable lazy snapshot; settings next local day; disable immediate.
3. Two slots max; main independent; bonus only after snapshot mandatory tasks are successful and received by cutoff.
4. Game-owned receipt `received_at` ≠ `reviewed_at`; late approval keeps timeliness but no night popup/no make-up.
5. Rollover closes an unfinished attempt; no third slot; `nextDayIndex` is consumed by main, not calendar.
6. Offline never creates entitlement; retries idempotent and not backdated.
7. Game entitlement ledger separate from approved habit state; revoke never rewrites habit points.
8. Undo before bonus start → `revoked_unused`; after start → `revoked_after_use` with history; habit tombstone is an accepted residual.
9. Single and batch review share one bonus sync; batch calls it once after the loop.
10. Common lock order: unconditional child-scoped advisory lock first, then device → activity → log → receipt → child → settings → snapshot → entitlement → attempt.
11. Initial `vi`, `age_6_8`, `age_9_12`; 3–5, 13+ and four-track year are later.
12. Pilot 3 formats/7 days uses a separate manifest with explicit spacing exception; never counts as 24/730 coverage. Chosen IDs: `g01-t1`, `g06-t1`, `g03-t1`.
13. Flags default false, fail closed; master client registry, other flags server-only.
14. No dependency, no live puzzle generation.
15. New game response envelope; existing habit command envelope stays closed.

## Measured facts

CSV: 365 days / 730 slots / 24 type ids / 96 variant pairs / main_skill equal 0, different 365 / 358 of 358 rolling 8-day windows cover 8 groups / min spacing 11 days / all `design_only` / 0 of 730 playable approved. Playable content is not ready. The 24 measured IDs are `g01-t1`…`g08-t3`; the earlier `g01`…`g24` wording is clarified, not a new count.

## Risks requiring review

- Unconditional per-child advisory lock adds serialization to the habit write path; AC13 performance evidence is mandatory.
- `activity_logs` is legacy and has no repository `create table`; do not assume any timestamp default.
- Pilot spacing mathematically cannot meet 7 days; exception must be visible and production validator must reject it.
- Human pilot and content semantic/age approval are PENDING; P05A/P07/P10 cannot be marked done without them.
- 24 mechanics vs 96 variants must be reported separately; do not inflate coverage.
- P04 must implement the new receipt table and the six-RPC lock-order changes before bonus can be enabled.

## Validation performed

- Read AGENTS.md, research Markdown/CSV, current `types`, command schema, local-date, age-band, flags, relevant SQL RPCs, PIN wrappers, dashboard/settings anchors.
- Re-read Kilo §7.3 and the Copilot report; corrected the `secret_quests` citation against `202609230001:32-39` and `202609190001:165`.
- CSV parsed and counted with local Python; explicit equal=0 / different=365 and 24/96 counts.
- Relative markdown links/references checked; historical `.omx` records marked historical.
- No lint/typecheck/test/migration/browser/pilot run: no feature source exists. Gameplay PASS is not claimed.

## Review asks

1. Re-check R1–R12 against the updated contract with file:line references.
2. Verify the game-owned receipt table, SQL local-day rule, unconditional lock and new response envelope.
3. Verify pause/main, journey index, error/route changes and the accepted habit-tombstone residual.
4. Return ACCEPTED / REWORK / BLOCKED. A new independent ACCEPTED is required before any engine source edit.

**Do not start engine/backend from this handoff.** Root owns the next dispatch.
