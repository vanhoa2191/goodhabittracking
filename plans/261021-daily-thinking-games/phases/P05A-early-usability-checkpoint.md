# P05A — Early usability checkpoint (3 games / 7 days)

Status: PLANNED, NOT-RUN. This is a product gate, not a code-complete receipt.
Owner: P10/pilot owner, with P02 UX and P05 implementer.
Receiver: root coordinator + independent reviewer.
Depends: P05.

## Inputs

- Accepted P05 handoff: 3 mechanics, 7 days, 2 age tracks, separate pilot manifest with explicit spacing exception.
- P02 copy/accessibility contract and P05 real-browser evidence.
- Consent/authority process required by the existing product/privacy docs.
- [contracts.md](../contracts.md), [test-spec.md](../test-spec.md), [prd.md](../prd.md).

## Work

1. Verify the pilot is technically playable end-to-end: start → pause/resume → finish → return, main and bonus, same day.
2. Run internal interaction checks for dead ends, tap/keyboard, reduced motion, mute and error states.
3. Recruit the minimum real target-age sample with parent consent (3 children per track for this checkpoint, 6–8 and 9–12).
4. Observe rule comprehension after the example, active duration, hint need, exits, distress and ability to stop.
5. Compare habit quality/reject rate with the family's baseline; do not optimize screen time.
6. Record NOT-RUN/BLOCKED honestly if consent or real observation is unavailable.

## File/artifact scope (future execution, not this task)

- `pilot-protocol.md`
- `consent/authorization record` per the existing system
- `aggregated-results.md`
- `age-track-release-decision.md`
- `handoffs/P05A.md`

## Gate

- [ ] 3 formats/7 days are playable with server-backed state, not mocks only.
- [ ] Pilot manifest exception is explicit and production validator still rejects it.
- [ ] At least 3 children per track observed, or the gate is BLOCKED (no P06/P07 start).
- [ ] ≥80% uninterrupted sessions finish in 60–120 seconds per track.
- [ ] ≥80% understand the rule after the example without extra adult explanation.
- [ ] No sign of rushed habit ticks, distress or inability to stop; parent reject rate not materially worse.
- [ ] Findings are returned to the correct owner (engine, copy, UX, content, backend).
- [ ] No claim of 24-format, 365-day, four-age or cognitive benefit.

## Verification

- Human observation + aggregate records; automation only validates instrumentation and consent metadata.
- Technical browser/SQL evidence must be distinguished from human usability evidence.

## Rollback

Turn off the pilot flag/cohort; retain minimum audit data; do not delete attempts or habit history. Do not invite more families without authority.

## Required handoff

- Artifact: `../handoffs/P05A.md`.
- Send to root + independent reviewer with owner, task/dispatch/run, SHA, contract/content versions, commands, environment, sample size, findings and verdict.
- Receiver records ACCEPTED / REWORK / BLOCKED. A BLOCKED checkpoint stops P06/P07; do not mark it done to keep the schedule.
