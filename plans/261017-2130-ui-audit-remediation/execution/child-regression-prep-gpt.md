# Child regression preparation — GPT

Status: test-only preparation complete; ownership released to Phase04. This is **not Phase04 implementation, acceptance, or a dependency-gate waiver**. Phase04 source work still waits for accepted 01/02/03 and the coordinator's file releases. No lifecycle messages sent; shell runner owns lifecycle.

## Scope and authority

Read workspace AGENTS.md and RTK.md; accepted handoffs phase-00/phase-03; phase-04-child-experience.md; test-spec.md; execution/phase00-coordinator-decisions.md; accepted child surface brief. Bounded source inspection covered pairing/session loaders, child command route/schema/client, completion/timer/reward callers and the relevant SQL command definitions. Existing pair-link.spec.ts supplies the exchange → POST session pattern.

Only authored:

- `tests/e2e/ui-audit-child-recovery.spec.ts` — four regression cases.
- `tests/e2e/ui-audit-child-fixture.ts` — new isolated paired-child fixture.
- This report.

No app/CSS/store/existing-test/helper/brief edits, dependencies, agents, commits, deployments, global settings changes, build or dev-server startup. Other owners' concurrent changes (including globals/layout/page/timer) were preserved. No cleanup/refactor of existing code; simplification is one shared new fixture rather than repeated setup in four cases, with explicit routes and no catch-all success responses.

## Fixture and expected contract

Synthetic profile/family/activity/reward IDs only. Browser follows `/?pair=<synthetic token>` → `/api/pairing/exchange` → `/api/child/session`; verifies exchange payload, POST session, kid mode and removal of pair token. No demo button, local-store seeding, production data or live pairing credentials. Session contains a scheduled daily activity, 40 authoritative points, empty logs/redemptions and a selected synthetic 15-point reward goal. Session state changes only on explicit acknowledged completion, not on the outgoing request.

Requests are captured at `/api/child/commands`, parsed with actual strict `childDomainCommandSchema` (UUID command IDs, no parent childId field), and asserted for exact type/target/date/commandId shape. Bodies and actual generated IDs are logged. Parent command endpoint is separately guarded. Held routes permit inspection before acknowledgement. Same-turn DOM click events deliberately exercise guards before React rerenders; native disabled state is checked separately.

Failure is the real child route's RPC-error shape: HTTP409 `{success:false,error:"The child action could not be saved.",correlationId:...}`. Acknowledgements use `{success:true,result:{status,logId,pointsAwarded}}`; pending grants zero points. SQL `complete_child_habit_command` uses commandId as logId, mirrored by the fixture. An observed extra completion gets SQL's real `{status:"duplicate"}` response, while the request-count assertion still fails. Extra reward requests are explicitly refused and counted, never hidden.

Clock is installed before navigation with fixed Date at 2026-10-19 09:00 +07:00. Timer advances 60 × `clock.runFor(1000)` to fire nested React timeouts; no real-minute sleep. Reduced motion avoids relying on animation to convey completion. Vietnamese cookie is set before navigation. Future saving/pending/retry prose comes from the accepted brief/Phase04 draft and existing locale semantics; explicit red assertions are intentional.

## Final verification

Environment: base `83b118367fead8a79f7918c928e4f92dbdd0590e`, shared dirty checkout; Node26.11.1 via per-command PATH. Existing coordinator `http://localhost:3107`, supplied E1 webpack development configuration, synthetic Supabase, optional ageTheme/DreamCity off per accepted baseline. No flags changed or rebuilt; this lane does not certify the full server environment manifest. Chromium desktop 1280×720, vi-VN, synthetic birthYear2017/ageStage6-12, reduced motion. No mobile/WebKit/physical-device or production acceptance claimed.

Commands below ran through `rtk proxy bash -c` with `export PATH=/home/opc/.nvm/versions/node/v26.11.1/bin:$PATH`. Output was redirected to the listed log; shell saved `$?`, printed the log, and exited with the saved value. No piped grep or inferred success.

| Check / exact inner command | Actual exit | Log under `.omx/ui-execution/` |
|---|---:|---|
| `PLAYWRIGHT_BASE_URL=http://localhost:3107 npx playwright test tests/e2e/ui-audit-child-recovery.spec.ts --project=chromium --workers=1 --output=.omx/ui-execution/child-regression-prep-output` | 1; four expected contract reds, zero final harness failures | `child-regression-prep-e2e.log` |
| `npx eslint tests/e2e/ui-audit-child-recovery.spec.ts tests/e2e/ui-audit-child-fixture.ts --max-warnings=0` | 0 | `child-regression-prep-eslint.log` |
| `npm run typecheck` (full `tsc --noEmit`) | 0 | `child-regression-prep-typecheck.log` |

`git diff --check` also returned0. No unit/full E2E/build/deploy run in this test-only lane. Final per-case durations:19.3s,26.8s,12.9s,20.6s.

| Case / reproduction | Observed final result and classification |
|---|---|
| Hold approval-required completion; dispatch two events before rerender; inspect before ack; ack pending | **Expected red:** two completeHabit requests with different command IDs, anticipatory praise before ack, no visible `Đang lưu…` text despite saving accessible name/native disabled control. Pending acknowledgement still leaves balance40 and data-complete=false; those assertions passed. |
| Hold ordinary completion, inspect before ack, refuse409, inspect rollback, advance5s, explicitly retry | **Expected red:** pre-ack data-complete=true and guessed balance instead of40. Refusal restores card, aria-pressed=false and balance40 and clears praise; localized prose exists but exposes `(request-409)`. No automatic replay observed; explicit retry button missing (5s locator timeout is a contract failure, not infrastructure). |
| Open labelled habit timer, start, advance60 virtual seconds, save elapsed result, refuse409 | **Expected red:** timer reached `Hoàn thành thời gian` with zero commands, save sent one completeHabit, but labelled timer dialog disappears after failed save. Elapsed-result/retry recovery is absent. |
| Open rewards with selected goal40/15, dispatch two claim events, refuse both, advance5s | **Expected red:** claim is not disabled while waiting and sends two redeemReward requests with distinct IDs. Balance40, selected goal40/15 and both goal/card titles remain. No localized error at reward card, so recovery assertion fails. No approval/delivery workflow is fabricated. |

Final command IDs for repro correlation: completion double event `4016c1fc-edb3-4fb7-b78b-e3a965b5bb0e` / `5adc1a65-b33d-4462-939b-a6d65fcf663a`; refused ordinary completion `9ce9d080-e9b3-413c-823c-bc25bc3f432a`; timer save `11135ca8-f663-40a5-8ec0-7ca015ff29b2`; reward double event `6df76590-dac5-4fc3-b2bb-0ca9b44c6af8` / `f31e324f-0605-4bf0-abd2-53c6749312a7`. Exact payloads are in final log and trace network records.

Each case has `trace.zip`, `test-failed-1.png`, and `error-context.md` in `.omx/ui-execution/child-regression-prep-output/`, with suffixes `ee45c-roval-never-verifies-points-chromium`, `6b1f9-calized-explicit-safe-retry-chromium`, `20a17-ed-result-and-focused-retry-chromium`, `9219d-ut-duplicate-claim-workflow-chromium` (all prefixed `ui-audit-child-recovery-pa-`). Reproduce with the focused command above; inspect using `rtk npx playwright show-trace <trace.zip>`.

## Harness corrections and remaining limits

Initial run was interrupted (exit130) after a paused-clock/actionability/capture problem; it is not acceptance evidence. Switched to installed clock + fixed Date with running browser timers. Fixed language cookie name, navigation timeout (30s and DOMContentLoaded rather than5s full load on shared dev server), duplicate-request capture so later assertions still execute while explicit count fails, duplicate goal/card heading locator, and exact timer dialog label so a badge dialog cannot masquerade as retained timer. Historical logs: `child-regression-prep-e2e-initial.log`, `child-regression-prep-e2e-intermediate.log`, `child-regression-prep-e2e-navigation-repro.log`. Intermediate runs include harness failures; final run contains only the four described contract reds.

Retry-success payload/count assertions, timer retry focus + Enter activation, and reward explicit retry are written but **not yet exercised past the earlier missing recovery UI assertions**. Do not claim these paths pass. No `test.fail`, skip, silent return, optional flag pass, or fallback to unrelated retry controls. This suite does not cover transport uncertainty after a committed command, refresh-after-ack failure, all locales, complete visual acceptance, or live database authorization. In particular, a definitive409 refusal here does not establish safe new command IDs for an unknown outcome; Phase04 must reconcile uncertainty and preserve IDs according to coordinator dispositions.

Current unit expectations intentionally differ: `tests/unit/habit-actions.test.ts` protects “puts the card on screen before the server answers and rolls it back when the server refuses” and optimistic-log/server-ID behavior. These tests and source are owned elsewhere and untouched. The accepted Phase04 correction deliberately changes guessed pre-ack logs/points/success feedback; later owner must update those expectations with meaningful before/after regression coverage, preserving authoritative outcomes and rollback/retry safety rather than deleting tests to turn this suite green.

## Identity and release

Final SHA256:

```text
6e46182c6ad47ceb67d02a714f13b703a26316d46a0742c24788464c047c2463  tests/e2e/ui-audit-child-fixture.ts
603aa44a58f253e72a4bbd21c04db806348f7b3883f3530f91db8c66de202814  tests/e2e/ui-audit-child-recovery.spec.ts
55457b7b845ee5ffb849e5086fe7ca11f06ef7157030c4ea5d845d6fb35fa6ba  src/components/KidDashboard.tsx (read-only snapshot)
a7524dd87cc104246e59d360d9b9f213372d57b935bec618c3b9923336e60889  src/components/HabitTimerModal.tsx (other owner)
9f7acb7869c53c096a76e5a8d9350b858c56d8d63cb8555ea7e931fdd466aedb  src/lib/store/habit-actions.ts (other owner)
3151c2011148c6c3527b9d01b93e005840a62841a920bf985ca52739e175c6b2  src/lib/store/reward-actions.ts (other owner)
```

Released both new test files to the eventual Phase04 owner; this preparation lane stops. Rollback is removal of only these two new test files and this report if requested, retaining unrelated shared-checkout changes and evidence. No Phase04 source ownership assumed, no remediation accepted, and 01/02/03 dependency acceptance remains coordinator-controlled.
