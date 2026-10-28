# PRD — daily thinking games (initial 6–8 / 9–12 slice)

Version: `prd-2026-10-21-r2`.
Status: P01 R2 draft for independent review. Kilo REWORK items resolved in the contracts/decisions. No gameplay, backend, migration or content is implemented.

## 1. Problem

Families already use the habit tracker, but the product has no short, safe daily thinking activity for children. The research proposes a 365-day journey with 24 mechanics, two slots per day and a reward slot tied to finishing mandatory tasks on time. Shipping that whole scope at once would be dishonest: the CSV is an editorial syllabus, not 730 playable puzzles, and no child has played it.

This PRD defines a truthful initial slice and the contracts needed before any engine/backend work.

## 2. Goals

1. Give a child one optional 60–120 second thinking game per local day without requiring habit completion.
2. Unlock a second, independent bonus game only when the day's mandatory habits are completed by the family's cutoff and, if needed, approved.
3. Never punish absence, rest, wrong answers, hints or slow play; never create a third slot.
4. Keep habit state and game entitlement separate so an approval or undo cannot silently corrupt the other.
5. Validate usability with 3 mechanics over 7 days **before** investing in the full year.
6. Make server day, timezone, snapshot, approval, offline and age behavior explicit and testable.

## 3. Non-goals for the initial release

- Full 24 mechanics, 365 days, 730 payloads, four age tracks or nine locales.
- Points/stars/leaderboard rewards for game play.
- Live-generated puzzles.
- Replacing the existing habit reward economy, theme system or UI audit scope.
- Claiming cognitive/IQ benefits. The pilot measures usability, not intelligence.
- Any production deploy, commit or dependency in the planning phase.

## 4. Users

| User | Need | Failure to avoid |
| --- | --- | --- |
| Child 6–8 | Big targets, read-aloud, one rule, tap-not-drag, calm feedback | Feeling tested, rushed or punished |
| Child 9–12 | Short text, 2–3 rule combinations, independence, no babyish UI | Being talked down to, forced replay |
| Parent | Transparent cutoff/bedtime, preview of today's snapshot, simple on/off | Surprise extra play, unclear bonus, PIN bypass |
| Content editor | Versioned schema, solver/fingerprint checks, explicit approval | Publishing design-only or duplicated puzzles |
| Engineer/QA | Stable contracts, idempotency, lock order, explicit errors | Race grants, deadlocks, timezone drift |

## 5. Product behavior

### 5.1 Daily card

- One compact card on today's child dashboard, only when the master flag and family setting are on.
- Shows title, illustration, target duration and a calm invitation.
- Does not auto-open full screen and does not use a countdown.
- History days are read-only; they cannot grant or replay a slot.

### 5.2 Main slot

- Available independently of habits when the feature is enabled, the family/day is not paused, and the age track has approved content.
- First start on a new local day advances the journey exactly once; the start consumes the current `nextDayIndex`, then increments it.
- Reload, second tab, resume and bonus never advance it.
- Pause blocks new main and bonus grants; an already started attempt may finish.

### 5.3 Bonus slot

- Two slots maximum per local day.
- Condition: all mandatory tasks in the frozen day snapshot are successful and were received by the cutoff; approval required where configured.
- Receipt and review times are owned by the game feature (`thinking_game_habit_receipts`), not by an assumed `activity_logs` default.
- A late approval after cutoff still counts if the completion was received on time; it never backdates.
- During bedtime blackout, a qualified bonus is quiet: no popup, calm rest copy, no make-up slot tomorrow.
- Bonus is independent content, not a harder gate for future days.

### 5.4 Approval and undo

- `received_at` and `reviewed_at` are server-set on the game-owned receipt; clients never supply them.
- Parent/child undo follows current habit rules (`completed`/`pending_approval` only; `approved` is terminal); habit undo remains a hard delete, with the game receipt/entitlement as the compensating control.
- Undo before bonus start revokes the unused bonus; after start it keeps history and blocks a replacement.
- Single and batch review must produce the same bonus outcome as one atomic transaction.
- Parent game revoke/undo and settings are PIN-gated when configured; a child cannot revoke another child's game.

### 5.5 Parent settings

- Master on/off, IANA timezone, bonus cutoff (default 19:00), bedtime window (default 20:30–07:00), per-child age-track override, day snapshot preview.
- All changes except disable apply next local day.
- PIN-gated when the family has a PIN, using the existing `parentPinConfigured` / `updateParentPin` flow.
- The preview explains why bonus is locked or granted without exposing answers.

### 5.6 Copy and accessibility

- Vietnamese game surface uses `mình – bạn` consistently, including errors, hints, praise, pause, bedtime, offline and approval-wait.
- No guilt/FOMO, no speed rewards, no “smart child” ranking.
- Tap-to-select is the primary interaction; drag is progressive enhancement only.
- Full keyboard path, visible focus, 64px targets for 6–8 and 48px for 9–12, reduced motion ≤150ms, separate mute for SFX/TTS, read-aloud `vi-VN` rate 0.85.
- Habit-flow copy is not silently rewritten by the game project.

## 6. Content and age truth

- Initial release: `vi`, `age_6_8`, `age_9_12`.
- Pilot: 3 mechanics, 7 days, 14 slots per track, 28 payloads total, separate pilot manifest with explicit spacing exception. Chosen measured IDs: `g01-t1` (pattern completion), `g06-t1` (path planning), `g03-t1` (memory sequence); all three use different skill groups.
- Production: 24 type ids, 96 variant pairs, 365 days × 2 slots per released track; 730 payloads per track/locale, up to 2,920 for four tracks.
- CSV measured today: 0 equal main/bonus skill, 365 different; 24 type ids; 96 variant pairs; all `design_only`. Playable approved total: 0/730.
- “365 days ready” is forbidden until approved payloads exist. Pilot coverage is never added to production coverage.
- Human semantic/age approval is PENDING.

## 7. Success and stop criteria

### 7.1 Early usability checkpoint (after 3 games/7 days, before year content)

Technical readiness can be checked internally, but the product checkpoint requires real target-age observation:

- At least 3 children per initial track (6–8, 9–12), with parent consent, each over 7 days; small samples are reported with distribution, not hidden by averages.
- ≥80% of uninterrupted sessions finish within 60–120 seconds.
- ≥80% of children understand the rule after the example without extra adult explanation.
- No sign of rushing habit ticks, distress, or inability to stop; parent reject rate does not rise materially.
- If real observation is unavailable, the checkpoint is **BLOCKED / NOT-RUN**, and P06/P07 do not start.

### 7.2 Full pilot / release

- Same measures per released track, plus hints, exits, pauses and task-quality metrics.
- Stop a cohort if >20% of 6–8 sessions exceed 180 seconds, if distress is observed, or if habit quality degrades.
- No causal claim about IQ or broad cognition from a small pilot.

## 8. Milestones

| Milestone | Contents | Exit condition |
| --- | --- | --- |
| M0 P00–P01 | Baseline + contracts | Independent contract review ACCEPTED |
| M1 P02–P04 | UX contract, engine, server ledger | Contract tests + local SQL concurrency/RLS pass |
| M2 P05 | 3 mechanics, 7 days, 2 tracks, pilot manifest | Real browser start→resume→finish, explicit spacing exception |
| M3 P05A | Early usability checkpoint | Real target-age observation or BLOCKED |
| M4 P06–P07 | 24 mechanics + 365-day production content | Approved, solver-checked, fingerprinted batches |
| M5 P08–P09 | App integration + system QA | Zero P1/P2, a11y/perf/regression evidence |
| M6 P10–P11 | Controlled pilot + release | Human pilot report, rollout/rollback drill |

Only after M4 for a given track/locale may the product claim that track is complete.

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Pilot spacing cannot satisfy 7 days | Separate pilot manifest with explicit exception; production validator rejects it |
| “24 formats” confused with 96 variants | Contract counts them separately; validator reports both |
| CSV mistaken for playable content | Approved payload gate; no `design_only` in release |
| Bonus race with approval/undo | Unconditional child-scoped advisory lock, common row order, one sync per batch |
| Game revoke corrupts habit state | Separate entitlement ledger; approved habit immutable; game-owned receipt audit |
| Game 200 statuses fail the habit client parser | New `thinkingGameResponseSchema`; existing domain command envelope stays closed |
| Legacy `activity_logs.completed_at` has no verifiable default | Game-owned `received_at`/`reviewed_at` receipt table |
| Midnight/offline surprises | Attempt belongs to start day; rollover closes it; no make-up slot |
| Age fallback serves wrong content | Explicit track resolution; no fallback; `age_track_unavailable` |
| Four tracks explode content scope | Initial 6–12 slice; four-track year is a later milestone |
| Planning mistaken for implementation | Status fields, handoff and validation distinguish LOCKED from BUILT/PASS |

## 10. Open human approvals (must remain pending)

- Actual child/family pilot (P10/P05A).
- Human semantic, cultural and age approval for every released payload.
- Authority to apply production migration/enable cohort.
- Any future decision to add points, more locales or 3–5/13+.
