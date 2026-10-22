# Decision log — daily thinking games

Version: `decisions-2026-10-21-r2`.
Status: decisions D01–D24 and D30 are locked for P01 review; D25–D29 remain pending/deferred/proposed; D31–D40 resolve the Kilo REWORK items. Decisions marked PENDING are **not** silently implemented.

| ID | Decision | Status | Rationale / rejected alternative |
| --- | --- | --- | --- |
| D01 | Journey is personal, 365 experience days, not calendar year. | LOCKED | Research chooses no punishment for absence. Rejected: Jan 1–Dec 31 calendar, which would expire content. |
| D02 | Day index advances only on first successful `main` start of a new local day. | LOCKED | Reload/tabs must not advance; bonus must not advance. Rejected: advance on dashboard view or bonus. |
| D03 | Maximum two entitlements per child/local day: `main`, `bonus`. | LOCKED | Research and two-slot design. Unique key plus transactional admission. Rejected: per-device limits, retry as new slot. |
| D04 | Server local day from family IANA timezone; no guessed timezone. | LOCKED | Prevent extra grants and DST errors. Rejected: device clock, fixed UTC+7, silent default. |
| D05 | Day snapshot is immutable and lazy per local day. | LOCKED | A promise made in the morning cannot change at noon. Rejected: live recompute from current schedule. |
| D06 | Settings changes apply next local day; disable applies immediately. | LOCKED | Predictability while allowing a kill switch. Rejected: immediate mid-day cutoff changes. |
| D07 | Main is independent of habit completion; bonus is conditional. | LOCKED | Research and product intent. Rejected: gating main behind chores. |
| D08 | Bonus requires every snapshot mandatory task successful and received by cutoff. | LOCKED | Explicit, testable condition. Rejected: completed count, progress percent, deferral as completion. |
| D09 | `received_at` is server commit time; timeliness ignores `reviewed_at`. | LOCKED | Late parent review must not punish the child. Rejected: client timestamp, review time as timeliness. |
| D10 | Late approval in blackout is eligible but quiet and non-invitable; no make-up next day. | LOCKED | Preserve fairness without a night popup. Rejected: push notification, bonus carried to next day. |
| D11 | Game entitlement ledger is separate from `activity_logs` status/points. | LOCKED | Revoking a game cannot rewrite an approved habit. Rejected: delete/rewrite habit history, store game state only in habit status. |
| D12 | Revoke unused bonus on undo; after use, keep history and block re-grant. | LOCKED | No double reward, no punishment of the child. Rejected: delete attempt, re-grant replacement. |
| D13 | Rollover closes an unfinished attempt as `abandoned_rollover`; no grace period. | LOCKED | Keeps the two-slot promise honest. Rejected: allow finish plus today's main (three slots), infinite resume. |
| D14 | Offline creates no server right; cached previously assigned attempt is resumable. | LOCKED | Server is the entitlement authority. Rejected: local grants, client backdating. |
| D15 | Initial release is `vi` only, ages `age_6_8` and `age_9_12`. | LOCKED | Pilot scope and safety. Rejected: four age tracks in the first release; reusing `ageBandOverride` directly. |
| D16 | 3–5 and 13+ plus all four tracks/year are later milestones, not pilot claims. | LOCKED | Honest scope; 2,920 payloads if fully shipped. Rejected: claiming 365 days for all ages. |
| D17 | 24 game *type ids* and 96 *variant pairs* are different counts. | LOCKED | Prevents “24 formats” inflation. Rejected: counting 96 variants as 96 mechanics. |
| D18 | Production spacing ≥ 7 days; CSV currently has 11. | LOCKED | Preserves measured design rule. Rejected: dropping spacing for convenience. |
| D19 | Pilot 3 formats/7 days uses a separate manifest with explicit spacing exception. | LOCKED | 14 slots over 3 formats cannot satisfy ≥7-day spacing. The exception must be visible, not silently bypassed. Rejected: pretend the pilot satisfies production spacing. |
| D20 | Pilot manifest never counts toward 24-format/730-slot coverage. | LOCKED | Avoid false completion. Rejected: adding pilot payloads into the production coverage counter. |
| D21 | Master, pilot, bonus and pilot-content flags default false and fail closed. | LOCKED | Safe rollout and clean kill switch. Rejected: enabling via absence of config. |
| D22 | Common lock order uses child-scoped advisory lock first, then rows in fixed order. | LOCKED | Current complete/undo/review paths lock in different orders; bonus integration would deadlock without a shared first lock. Rejected: ad-hoc lock order per RPC. |
| D23 | Batch review calls bonus sync once after the whole batch. | LOCKED | Avoid transient grant/revoke and per-item races. Rejected: sync after each item. |
| D24 | Early usability checkpoint after 3 games/7 days gates all-year content. | LOCKED | Do not build 365 days before basic comprehension/duration evidence. Rejected: content-first, validate at the end. |
| D25 | Actual human pilot with target-age children. | **PENDING** | Requires consent, real families and observation; cannot be fabricated. Blocks promotion beyond prototype. |
| D26 | Human semantic and age approval of released content. | **PENDING** | Solver/schema checks cannot judge meaning, culture or age fit. Blocks “approved” status and 365-day claims. |
| D27 | Exact production DB migration timestamps/names. | **PROPOSED** | `20261021*_thinking_games.sql` is a placeholder; P04 owns final names after local apply/rollback design. Not applied. |
| D28 | 3–5 and 13+ copy/difficulty details. | **DEFERRED** | Out of initial release; needs separate age research and pilot. Must not be implied by the 6–12 UI. |
| D29 | Additional locales beyond `vi`. | **DEFERRED** | Each locale needs reviewed content. No machine-only release. |
| D30 | Points/stars economy for games. | **LOCKED (none)** | First release awards no points for game play; habit economy unchanged. Revisit only with explicit product decision. |
| D31 | Game-owned `thinking_game_habit_receipts` stores server `received_at`/`reviewed_at`; do not assert an `activity_logs.completed_at` default. | LOCKED | The legacy table has no repository definition; the game feature must own its receipt/review times. Rejected: relying on an unverifiable default or client clock. |
| D32 | SQL computes local day as `(now() at time zone tz)::date`; TS `getLocalDateKey` is display parity only. | LOCKED | The snapshot and slot uniqueness keys live in SQL. Rejected: app-layer day authority. |
| D33 | Advisory lock is unconditional for the six habit RPCs, with exact `thinking_game_lock_key(uuid)` and a performance budget. | LOCKED | A conditional skip can invert with an enabled path. Rejected: per-RPC ad-hoc locks or games-only conditional skip. |
| D34 | Game routes use a new `thinkingGameResponseSchema`; `bonus_*` are `ok:true` 200 statuses; existing habit envelope stays closed. | LOCKED | A 200 error body would fail the existing client parser. Rejected: extending `domainCommandResultSchema` without a version bump. |
| D35 | Pause blocks new `main` and `bonus` grants; a started attempt may finish. | LOCKED | The contract previously only mentioned bonus. Rejected: paused families still receiving a daily main grant. |
| D36 | A `main` start consumes the current `nextDayIndex` then increments it; it is not a calendar mapping. | LOCKED | Prevents skipped or duplicated content days after absence. Rejected: index derived from calendar date. |
| D37 | Habit undo remains a hard delete; game receipt/entitlement is the compensating control; game revoke is PIN-gated. | LOCKED (accepted residual) | Avoids rewriting the habit economy in this feature. Rejected: silent tombstone scope creep. |
| D38 | Master flag is client-registry owned; pilot/bonus/serve-pilot flags are server-only. | LOCKED | The card must not render when master is off; server flags must not be prefetched. Rejected: one mixed registry without owners. |
| D39 | `/api/child/thinking-games/*` and `/api/parent/thinking-games/*` are deliberate new route families. | LOCKED | Keeps the game envelope separate from `/api/domain/commands`. Rejected: overloading the habit command route. |
| D40 | `attempt_not_found` and `family_mismatch` collapse to one `not_found`; add `journey_complete`, `paused`, `format_unavailable`; rate limits are explicit. | LOCKED | Prevents existence leaks and missing states. Rejected: distinct 404 bodies or an unspecified 429. |

## Kilo REWORK corrections (R2)

- **R1 accepted with a citation correction.** `202609230001:39` creates `secret_quests`, not `activity_logs`; no repository migration creates `activity_logs`, so no `completed_at` default may be asserted. The fix is D31: game-owned receipts.
- **R2 accepted.** The SQL rule is now explicit; invalid zones map to `timezone_invalid`.
- **R3 accepted.** The lock is unconditional, with the exact key and a performance budget.
- **R4 accepted as residual.** Habit tombstone is out of scope; game ledger and receipt are compensating controls; PIN boundary is stated.
- **R5 accepted.** The helper reads habit rows and writes only game tables.
- **R6 accepted.** New game envelope; existing habit parser untouched.
- **R7/R8 accepted.** Pause covers main; main consumes `nextDayIndex`.
- **R9 accepted.** Real-PostgreSQL harness gates GWT-15/16/31; otherwise MOCK-ONLY.
- **R10 accepted.** Flag registries and owners are explicit.
- **R11 accepted.** One `not_found`, `journey_complete`, `paused`, `format_unavailable`, explicit rate limits.
- **R12 accepted.** New route prefixes are deliberate.
- **No finding was rejected on substance.** The only rejected detail is Kilo's `activity_logs` line citation; the R1 risk conclusion is retained.

## Historical coordination status

The earlier `.omx/plans/daily-thinking-games-365/` records (baseline, coordination, file locks, phase/handoff templates) are **historical planning artifacts from 2026-10-17**, not evidence of current implementation or review. Their runtime blockers and failed dispatches are superseded by the 2026-10-21 versioned scope. Historical failed attempts:

- prior OpenCode/Kilo launch failures (`--file` argument order) produced zero work;
- prior coordinator runtime/auth blockers prevented independent review;
- no phase was accepted, no source was implemented.

Those records are retained as history only. They must not be used to claim a current gate passed.
